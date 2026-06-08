import api from "./api";
import type { Company } from "../types/Company";
import type { PaginationResponse } from "../types/Pagination";

interface GetCompaniesParams {
  page?: number;
  size?: number;
  search?: string;
  active?: boolean | null;
}

interface CompanyRequest {
  headquarters: number;
  name: string;
  phone: string;
  cnpj: string;
  email: string;
  employeeCount: number;
  active: boolean;
}

export async function getCompanies({
  page = 0,
  size = 10,
  search = "",
  active = null,
}: GetCompaniesParams = {}): Promise<PaginationResponse<Company>> {
  const response = await api.get<PaginationResponse<Company>>("/companies", {
    params: { page, size, search, active: active === null ? undefined : active },
  });
  return response.data;
}

export async function getAllCompaniesSimple(): Promise<Company[]> {
  const response = await api.get<PaginationResponse<Company>>("/companies", {
    params: { size: 1000, active: true },
  });
  return response.data.content;
}

export async function getCompanyById(id: number): Promise<Company> {
  const response = await api.get<Company>(`/companies/${id}`);
  return response.data;
}

export async function createCompany(data: CompanyRequest): Promise<Company> {
  const response = await api.post<Company>("/companies", data);
  return response.data;
}

export async function updateCompany(id: number, data: CompanyRequest): Promise<Company> {
  const response = await api.put<Company>(`/companies/${id}`, data);
  return response.data;
}

export async function deleteCompany(id: number): Promise<void> {
  await api.delete(`/companies/${id}`);
}

export interface CompanyAiProvidersConfig {
  activeProvider: string | null;
  providerKeys: Record<string, string | null>;
}

export async function getCompanyAiProviders(id: number): Promise<CompanyAiProvidersConfig> {
  const r = await api.get<CompanyAiProvidersConfig>(`/companies/${id}/ai-providers`);
  return r.data;
}

export async function saveCompanyAiProviders(
  id: number,
  data: { activeProvider: string | null; providerKeys: Record<string, string> }
): Promise<void> {
  await api.put(`/companies/${id}/ai-providers`, data);
}
