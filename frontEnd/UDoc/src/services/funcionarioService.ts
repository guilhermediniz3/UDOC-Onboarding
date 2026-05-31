import api from "./api";
import type { Funcionario } from "../types/Funcionario";
import type { PaginationResponse } from "../types/Pagination";

interface GetFuncionariosParams {
  page?: number;
  size?: number;
  search?: string;
  active?: boolean | null;
}

interface FuncionarioRequest {
  nome: string;
  telefone: string;
  email: string;
  empresaId: number;
  active: boolean;
}

export async function getFuncionarios({
  page = 0,
  size = 10,
  search = "",
  active = null,
}: GetFuncionariosParams = {}): Promise<PaginationResponse<Funcionario>> {
  const response = await api.get<PaginationResponse<Funcionario>>("/funcionarios", {
    params: {
      page,
      size,
      search,
      active: active === null ? undefined : active,
    },
  });
  return response.data;
}

export async function getFuncionarioById(id: number): Promise<Funcionario> {
  const response = await api.get<Funcionario>(`/funcionarios/${id}`);
  return response.data;
}

export async function createFuncionario(data: FuncionarioRequest): Promise<Funcionario> {
  const response = await api.post<Funcionario>("/funcionarios", data);
  return response.data;
}

export async function updateFuncionario(id: number, data: FuncionarioRequest): Promise<Funcionario> {
  const response = await api.put<Funcionario>(`/funcionarios/${id}`, data);
  return response.data;
}

export async function deleteFuncionario(id: number): Promise<void> {
  await api.delete(`/funcionarios/${id}`);
}
