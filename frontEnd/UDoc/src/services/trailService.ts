import api from "./api";

import type { Trail } from "../types/Trail";

import type { PaginationResponse } from "../types/Pagination";

interface GetTrailsParams {
  page?: number;
  size?: number;
  search?: string;
  active?: boolean | null;
}

interface TrailRequest {
  name: string;
  description: string;
  active: boolean;
  sortOrder: number;
  cardIds?: number[];
}

export async function getTrails({
  page = 0,
  size = 10,
  search = "",
  active = null,
}: GetTrailsParams = {}): Promise<PaginationResponse<Trail>> {

  const response =
    await api.get<PaginationResponse<Trail>>("/trails", {
      params: {
        page,
        size,
        search,
        active: active === null ? undefined : active,
      },
    });

  return response.data;
}

export async function getTrailById(id: number): Promise<Trail> {
  const response = await api.get<Trail>(`/trails/${id}`);
  return response.data;
}

export async function createTrail(data: TrailRequest): Promise<Trail> {
  const response = await api.post<Trail>("/trails", data);
  return response.data;
}

export async function updateTrail(
  id: number,
  data: TrailRequest
): Promise<Trail> {
  const response = await api.put<Trail>(`/trails/${id}`, data);
  return response.data;
}

export async function deleteTrail(id: number): Promise<void> {
  await api.delete(`/trails/${id}`);
}

export async function swapTrailOrder(
  id1: number,
  id2: number
): Promise<void> {
  await api.put(`/trails/${id1}/swap/${id2}`);
}

export async function cloneTrail(id: number): Promise<Trail> {
  const response = await api.post<Trail>(`/trails/${id}/clone`);
  return response.data;
}
