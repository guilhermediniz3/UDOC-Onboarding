import api from "./api";
import type { ISM } from "../types/ISM";
import type { PaginationResponse } from "../types/Pagination";

interface GetIsmsParams {
  page?: number;
  size?: number;
  search?: string;
  active?: boolean | null;
}

interface IsmRequest {
  name: string;
  email: string;
  phone: string;
  photo?: string;
  active: boolean;
  userId?: number | null;
}

export async function getIsms({
  page = 0,
  size = 10,
  search = "",
  active = null,
}: GetIsmsParams = {}): Promise<PaginationResponse<ISM>> {
  const response = await api.get<PaginationResponse<ISM>>("/ismsApi", {
    params: { page, size, search, active: active === null ? undefined : active },
  });
  return response.data;
}

export async function getAllIsmsSimple(): Promise<ISM[]> {
  const response = await api.get<PaginationResponse<ISM>>("/ismsApi", {
    params: { size: 1000, active: true },
  });
  return response.data.content;
}

export async function getIsmById(id: number): Promise<ISM> {
  const response = await api.get<ISM>(`/ismsApi/${id}`);
  return response.data;
}

export async function createIsm(data: IsmRequest): Promise<ISM> {
  const response = await api.post<ISM>("/ismsApi", data);
  return response.data;
}

export async function updateIsm(id: number, data: IsmRequest): Promise<ISM> {
  const response = await api.put<ISM>(`/ismsApi/${id}`, data);
  return response.data;
}

export async function deleteIsm(id: number): Promise<void> {
  await api.delete(`/ismsApi/${id}`);
}
