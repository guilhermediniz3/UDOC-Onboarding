import api from "./api";
import type { PaginationResponse } from "../types/Pagination";

export interface UsuarioData {
  id?: number;
  nome: string;
  email: string;
  foto?: string;
  role: string;
  active: boolean;
  createdAt?: string;
}

interface UsuarioRequest {
  nome: string;
  email: string;
  foto?: string;
  senha?: string;
  role: string;
  active: boolean;
}

interface AlterSenhaRequest {
  novaSenha: string;
  confirmaSenha: string;
}

interface GetUsuariosParams {
  page?: number;
  size?: number;
  search?: string;
  active?: boolean | null;
}

export async function getUsuarios({
  page = 0,
  size = 10,
  search = "",
  active = null,
}: GetUsuariosParams = {}): Promise<PaginationResponse<UsuarioData>> {
  const response = await api.get<PaginationResponse<UsuarioData>>("/usuarios", {
    params: { page, size, search, active: active === null ? undefined : active },
  });
  return response.data;
}

export async function getUsuarioById(id: number): Promise<UsuarioData> {
  const response = await api.get<UsuarioData>(`/usuarios/${id}`);
  return response.data;
}

export async function createUsuario(data: UsuarioRequest): Promise<UsuarioData> {
  const response = await api.post<UsuarioData>("/usuarios", data);
  return response.data;
}

export async function updateUsuario(id: number, data: UsuarioRequest): Promise<UsuarioData> {
  const response = await api.put<UsuarioData>(`/usuarios/${id}`, data);
  return response.data;
}

export async function alterarSenha(id: number, data: AlterSenhaRequest): Promise<void> {
  await api.put(`/usuarios/${id}/senha`, data);
}

export async function deleteUsuario(id: number): Promise<void> {
  await api.delete(`/usuarios/${id}`);
}
