import api from "./api";

export interface EmailConfigData {
  id?: number;
  host: string;
  port: number;
  username: string;
  password?: string;
  sslEnabled: boolean;
  tlsEnabled: boolean;
  fromName: string;
}

export async function getEmailConfig(): Promise<EmailConfigData> {
  const response = await api.get<EmailConfigData>("/email-config");
  return response.data;
}

export async function saveEmailConfig(data: EmailConfigData): Promise<EmailConfigData> {
  const response = await api.post<EmailConfigData>("/email-config", data);
  return response.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post("/auth/reset-password", { token, newPassword });
}
