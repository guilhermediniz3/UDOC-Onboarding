import api from "./api";

export interface StorageInfo {
  limitBytes: number;
  usedBytes: number;
  pct: number; // 0-100
}

export interface RecordingEntry {
  id: number;
  trainingRoomId: number | null;
  filename: string;
  fileSize: number | null;
  durationSeconds: number | null;
  createdAt: string;
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const r = await api.get<StorageInfo>("/config/storage");
  return r.data;
}

export async function setStorageLimit(limitBytes: number): Promise<StorageInfo> {
  const r = await api.put<StorageInfo>("/config/storage/limit", { limitBytes });
  return r.data;
}

export async function getAllRecordings(): Promise<RecordingEntry[]> {
  const r = await api.get<RecordingEntry[]>("/config/recordings");
  return r.data;
}

/* ── Configurações de integração ── */
export interface IntegrationConfig {
  sendgridKey: string; // mascarado: ***...xxxx ou vazio
  aiKey: string;       // mascarado: ***...xxxx ou vazio
  mailFrom: string;
}

export async function getIntegrationConfig(): Promise<IntegrationConfig> {
  const r = await api.get<IntegrationConfig>("/config/integrations");
  return r.data;
}

export async function saveIntegrationConfig(data: Partial<IntegrationConfig>): Promise<void> {
  await api.put("/config/integrations", data);
}

// helpers
export function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576)     return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function storageColor(pct: number): string {
  if (pct >= 90) return "red";
  if (pct >= 80) return "yellow";
  return "green";
}
