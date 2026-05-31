import api from "./api";
import type { Empresa } from "../types/Empresa";
import type { PaginationResponse } from "../types/Pagination";

interface GetEmpresasParams {
  page?: number;
  size?: number;
  search?: string;
  active?: boolean | null;
}

interface EmpresaRequest {
  matriz: number;
  nome: string;
  telefone: string;
  cnpj: string;
  email: string;
  numeroFuncionarios: number;
  active: boolean;
}

export async function getEmpresas({
  page = 0,
  size = 10,
  search = "",
  active = null,
}: GetEmpresasParams = {}): Promise<PaginationResponse<Empresa>> {
  const response = await api.get<PaginationResponse<Empresa>>("/empresas", {
    params: {
      page,
      size,
      search,
      active: active === null ? undefined : active,
    },
  });
  return response.data;
}

export async function getAllEmpresasSimple(): Promise<Empresa[]> {
  const response = await api.get<PaginationResponse<Empresa>>("/empresas", {
    params: { size: 1000, active: true },
  });
  return response.data.content;
}

export async function getEmpresaById(id: number): Promise<Empresa> {
  const response = await api.get<Empresa>(`/empresas/${id}`);
  return response.data;
}

export async function createEmpresa(data: EmpresaRequest): Promise<Empresa> {
  const response = await api.post<Empresa>("/empresas", data);
  return response.data;
}

export async function updateEmpresa(id: number, data: EmpresaRequest): Promise<Empresa> {
  const response = await api.put<Empresa>(`/empresas/${id}`, data);
  return response.data;
}

export async function deleteEmpresa(id: number): Promise<void> {
  await api.delete(`/empresas/${id}`);
}
