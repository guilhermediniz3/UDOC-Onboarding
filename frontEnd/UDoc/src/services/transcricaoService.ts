import api from "./api";
import type { TranscricaoTrecho } from "../types/TranscricaoTrecho";

export async function salvarTrecho(
  trainingRoomId: number,
  texto: string,
  sessaoId?: number
): Promise<TranscricaoTrecho> {
  const r = await api.post<TranscricaoTrecho>("/transcricao", { trainingRoomId, texto, sessaoId });
  return r.data;
}

export async function listarTranscricaoPorSala(
  trainingRoomId: number
): Promise<TranscricaoTrecho[]> {
  const r = await api.get<TranscricaoTrecho[]>(`/transcricao/sala/${trainingRoomId}`);
  return r.data;
}

export async function listarTranscricaoPorSessao(
  sessaoId: number
): Promise<TranscricaoTrecho[]> {
  const r = await api.get<TranscricaoTrecho[]>(`/transcricao/sessao/${sessaoId}`);
  return r.data;
}

export async function registrarAcessoTranscricao(
  sessaoId: number,
  ratId: number,
  acao: "VIEW" | "DOWNLOAD_PDF" | "DOWNLOAD_TXT"
): Promise<void> {
  await api.post(`/transcricao/sessao/${sessaoId}/acesso`, { ratId, acao });
}

export async function enviarAudioChunk(
  trainingRoomId: number,
  sessaoId: number,
  blob: Blob
): Promise<TranscricaoTrecho | null> {
  const form = new FormData();
  form.append("audio", blob, "audio.webm");
  form.append("trainingRoomId", String(trainingRoomId));
  try {
    const r = await api.post<TranscricaoTrecho>(
      `/transcricao/sessao/${sessaoId}/audio`,
      form
    );
    return r.status === 204 ? null : r.data;
  } catch {
    return null;
  }
}
