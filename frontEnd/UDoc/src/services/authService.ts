import api from "./api";

export interface AuthResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  photo?: string;
  role: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", { email, password });
  return response.data;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", { name, email, password, role });
  return response.data;
}
