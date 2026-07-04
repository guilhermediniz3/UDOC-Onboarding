import api from "./api";
import type { Rat } from "../types/Rat";
import type { PaginationResponse } from "../types/Pagination";

interface GetRatsParams {
  page?: number;
  size?: number;
  ismId?: number | null;
  companyId?: number | null;
  autorId?: number | null;
  dataInicio?: string;
  dataFim?: string;
}

interface RatRequest {
  trainingRoomId: number;
  companyId?: number | null;
  ismId?: number | null;
  titulo: string;
  conteudo: string;
}

export async function getRats(params: GetRatsParams = {}): Promise<PaginationResponse<Rat>> {
  const r = await api.get<PaginationResponse<Rat>>("/rat", {
    params: {
      ...params,
      ismId: params.ismId ?? undefined,
      companyId: params.companyId ?? undefined,
      autorId: params.autorId ?? undefined,
    },
  });
  return r.data;
}

export async function getRatById(id: number): Promise<Rat> {
  const r = await api.get<Rat>(`/rat/${id}`);
  return r.data;
}

export async function createRat(data: RatRequest): Promise<Rat> {
  const r = await api.post<Rat>("/rat", data);
  return r.data;
}

export async function updateRat(id: number, data: RatRequest): Promise<Rat> {
  const r = await api.put<Rat>(`/rat/${id}`, data);
  return r.data;
}

export async function deleteRat(id: number): Promise<void> {
  await api.delete(`/rat/${id}`);
}

export async function gerarRatComIA(trainingRoomId: number): Promise<string> {
  const r = await api.post<{ content: string }>("/rat/gerar-ia", { trainingRoomId });
  return r.data.content;
}
