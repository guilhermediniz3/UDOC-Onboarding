import api from "./api";
import type { PaginationResponse } from "../types/Pagination";

export interface UserData {
  id?: number;
  name: string;
  email: string;
  photo?: string;
  role: string;
  active: boolean;
  createdAt?: string;
  employeeId?: number;
  employeeName?: string;
}

interface UserRequest {
  name: string;
  email: string;
  photo?: string;
  password?: string;
  role: string;
  active: boolean;
  employeeId?: number | null;
}

interface ChangePasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

interface GetUsersParams {
  page?: number;
  size?: number;
  search?: string;
  active?: boolean | null;
}

export async function getUsers({
  page = 0,
  size = 10,
  search = "",
  active = null,
}: GetUsersParams = {}): Promise<PaginationResponse<UserData>> {
  const response = await api.get<PaginationResponse<UserData>>("/users", {
    params: { page, size, search, active: active === null ? undefined : active },
  });
  return response.data;
}

export async function getUserById(id: number): Promise<UserData> {
  const response = await api.get<UserData>(`/users/${id}`);
  return response.data;
}

export async function createUser(data: UserRequest): Promise<UserData> {
  const response = await api.post<UserData>("/users", data);
  return response.data;
}

export async function updateUser(id: number, data: UserRequest): Promise<UserData> {
  const response = await api.put<UserData>(`/users/${id}`, data);
  return response.data;
}

export async function changePassword(id: number, data: ChangePasswordRequest): Promise<void> {
  await api.put(`/users/${id}/password`, data);
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function sendWelcomeEmail(id: number): Promise<void> {
  await api.post(`/users/${id}/send-welcome-email`);
}
