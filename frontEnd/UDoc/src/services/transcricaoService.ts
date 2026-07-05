import api, { BASE_URL } from "./api";
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

// Usa fetch diretamente para evitar que um 401 acidental (chunk vazio, silêncio)
// passe pelo interceptor do axios e dispare o logout do usuário.
export async function enviarAudioChunk(
  trainingRoomId: number,
  sessaoId: number,
  blob: Blob
): Promise<TranscricaoTrecho | null> {
  const token = localStorage.getItem("udoc-token");
  if (!token) return null;

  const form = new FormData();
  form.append("audio", blob, "audio.webm");
  form.append("trainingRoomId", String(trainingRoomId));

  try {
    const r = await fetch(`${BASE_URL}/transcricao/sessao/${sessaoId}/audio`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!r.ok || r.status === 204) return null;
    return (await r.json()) as TranscricaoTrecho;
  } catch {
    return null;
  }
}
