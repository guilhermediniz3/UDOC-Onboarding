import api from "./api";
import type { TranscricaoTrecho } from "../types/TranscricaoTrecho";

export async function salvarTrecho(
  trainingRoomId: number,
  texto: string
): Promise<TranscricaoTrecho> {
  const r = await api.post<TranscricaoTrecho>("/transcricao", { trainingRoomId, texto });
  return r.data;
}

export async function listarTranscricaoPorSala(
  trainingRoomId: number
): Promise<TranscricaoTrecho[]> {
  const r = await api.get<TranscricaoTrecho[]>(`/transcricao/sala/${trainingRoomId}`);
  return r.data;
}
