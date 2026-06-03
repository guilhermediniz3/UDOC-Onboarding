import api from "./api";

export interface ConversaResumo {
  id: number;
  clienteId: number;
  clienteNome: string;
  clienteEmail: string;
  ismId?: number;
  ismNome?: string;
  status: "ABERTA" | "ENCERRADA";
  criadaEm: string;
  encerradaEm?: string;
  naoLidas: number;
}

export interface MensagemDetalhe {
  id: number;
  conversaId: number;
  conteudo: string;
  tipo: "CLIENTE" | "ISM" | "IA" | "SISTEMA";
  lida: boolean;
  dataHora: string;
}

export interface ConversaDetalhe extends ConversaResumo {
  mensagens: MensagemDetalhe[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface NpsChatIsm {
  ismId: number;
  ismNome: string;
  ismFoto?: string;
  nota1: number;
  nota2: number;
  nota3: number;
  nota4: number;
  total: number;
}

export interface AuditLogEntry {
  id: number;
  module?: string;
  action: string;
  target: string;
  performedBy?: string;
  timestamp: string;
  details?: string;
}

// ── Aba 1: Conversas ─────────────────────────────────────────────────────────

export async function getAuditoriaConversas(params: {
  ismId?: number;
  status?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<ConversaResumo>> {
  const r = await api.get<PageResponse<ConversaResumo>>("/auditoria/conversas", { params });
  return r.data;
}

export async function getAuditoriaConversa(id: number): Promise<ConversaDetalhe> {
  const r = await api.get<ConversaDetalhe>(`/auditoria/conversas/${id}`);
  return r.data;
}

// ── Aba 2: NPS Chat ───────────────────────────────────────────────────────────

export async function getAuditoriaNpsChat(params: {
  ismId?: number;
  startDate?: string;
  endDate?: string;
}): Promise<NpsChatIsm[]> {
  const r = await api.get<NpsChatIsm[]>("/auditoria/nps-chat", { params });
  return r.data;
}

// ── Aba 3: Sistema ────────────────────────────────────────────────────────────

export async function getAuditoriaSistema(params: {
  module?: string;
  action?: string;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}): Promise<PageResponse<AuditLogEntry>> {
  const r = await api.get<PageResponse<AuditLogEntry>>("/auditoria/sistema", { params });
  return r.data;
}
