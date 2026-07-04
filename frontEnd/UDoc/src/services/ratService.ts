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
  status?: string;
  timezoneOffset?: number;
}

interface RatRequest {
  trainingRoomId?: number;
  sessaoId?: number;
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
      timezoneOffset: new Date().getTimezoneOffset(),
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

export async function finalizarRat(id: number): Promise<Rat> {
  const r = await api.post<Rat>(`/rat/${id}/finalizar`);
  return r.data;
}

export async function reabrirRat(id: number, motivo: string): Promise<Rat> {
  const r = await api.post<Rat>(`/rat/${id}/reabrir`, { motivo });
  return r.data;
}

export async function listarRatsLegadoPorSala(trainingRoomId: number): Promise<Rat[]> {
  const r = await api.get<Rat[]>(`/rat/sala/${trainingRoomId}/legado`);
  return r.data;
}

export async function gerarRatComIA(sessaoId: number): Promise<string> {
  const timezoneOffset = new Date().getTimezoneOffset();
  const r = await api.post<{ content: string }>("/rat/gerar-ia", { sessaoId, timezoneOffset });
  return r.data.content;
}
