/**
 * Serviço de gravação de vídeo.
 *
 * Usa upload binário (application/octet-stream) em vez de multipart/form-data
 * porque o Tomcat impõe um limite de 2MB para POST com multipart (maxPostSize),
 * o que causava 401 antes do filtro JWT processar o header Authorization.
 * Com octet-stream esse limite não se aplica.
 */

import { BASE_URL } from "./api";

export interface VideoRecordingInfo {
  id: number;
  trainingRoomId: number | null;
  filename: string;
  fileSize: number | null;
  durationSeconds: number | null;
  createdAt: string;
}

function getToken(): string {
  return localStorage.getItem("udoc-token") ?? "";
}

function binaryUpload(
  url: string,
  blob: Blob,
  filename: string,
  durationSeconds: number
): Promise<VideoRecordingInfo> {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const params = new URLSearchParams({
      durationSeconds: String(Math.round(durationSeconds)),
      filename,
    });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${url}?${params.toString()}`);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.timeout = 300_000; // 5 min

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error("Resposta inválida do servidor")); }
      } else {
        let msg = `Erro ${xhr.status} ao fazer upload`;
        try { msg = JSON.parse(xhr.responseText)?.message ?? msg; } catch {}
        reject(new Error(msg));
      }
    };
    xhr.onerror   = () => reject(new Error("Erro de rede ao enviar gravação"));
    xhr.ontimeout = () => reject(new Error("Timeout ao enviar gravação"));

    xhr.send(blob);
  });
}

/** Upload para sala de treinamento específica */
export function uploadRoomRecording(
  roomId: number,
  blob: Blob,
  filename: string,
  durationSeconds: number
): Promise<VideoRecordingInfo> {
  return binaryUpload(
    `${BASE_URL}/training-rooms/${roomId}/recordings`,
    blob, filename, durationSeconds
  );
}

/** Upload genérico — para gravações inseridas em cards via editor TipTap */
export function uploadGenericRecording(
  blob: Blob,
  filename: string,
  durationSeconds: number
): Promise<VideoRecordingInfo> {
  return binaryUpload(
    `${BASE_URL}/training-rooms/recordings/upload`,
    blob, filename, durationSeconds
  );
}

/** Lista gravações de uma sala */
export function getRoomRecordings(roomId: number): Promise<VideoRecordingInfo[]> {
  return new Promise((resolve) => {
    const token = getToken();
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `${BASE_URL}/training-rooms/${roomId}/recordings`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); } catch { resolve([]); }
      } else { resolve([]); }
    };
    xhr.onerror = () => resolve([]);
    xhr.send();
  });
}

/** Exclui uma gravação */
export function deleteRoomRecording(recordingId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const xhr = new XMLHttpRequest();
    xhr.open("DELETE", `${BASE_URL}/training-rooms/recordings/${recordingId}`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) { resolve(); }
      else { reject(new Error(`Erro ${xhr.status}`)); }
    };
    xhr.onerror = () => reject(new Error("Erro de rede"));
    xhr.send();
  });
}

/** URL pública de streaming (usada como src no <video>) */
export function getRecordingFileUrl(recordingId: number): string {
  return `${BASE_URL}/training-rooms/recordings/${recordingId}/file`;
}
