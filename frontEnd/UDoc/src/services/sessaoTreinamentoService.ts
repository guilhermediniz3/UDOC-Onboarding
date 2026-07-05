import api from "./api";
import type { SessaoTreinamento } from "../types/SessaoTreinamento";

export async function criarSessao(
  trainingRoomId: number,
  modoCaptura: "SOLO" | "COMPLETO" = "SOLO"
): Promise<SessaoTreinamento> {
  const r = await api.post<SessaoTreinamento>("/sessao-treinamento", { trainingRoomId, modoCaptura });
  return r.data;
}

export async function encerrarSessao(sessaoId: number): Promise<SessaoTreinamento> {
  const r = await api.post<SessaoTreinamento>(`/sessao-treinamento/${sessaoId}/encerrar`);
  return r.data;
}

export async function listarSessoesPorSala(roomId: number): Promise<SessaoTreinamento[]> {
  const r = await api.get<SessaoTreinamento[]>(`/sessao-treinamento/sala/${roomId}`);
  return r.data;
}
