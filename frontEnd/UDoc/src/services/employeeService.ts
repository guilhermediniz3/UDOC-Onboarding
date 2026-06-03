import api from "./api";
import type { Employee } from "../types/Employee";
import type { PaginationResponse } from "../types/Pagination";

interface GetEmployeesParams {
  page?: number;
  size?: number;
  search?: string;
  active?: boolean | null;
}

interface EmployeeRequest {
  name: string;
  phone: string;
  email: string;
  photo?: string;
  companyId: number;
  active: boolean;
  userId?: number | null;
  tipo?: string;             // "EXTERNO" | "INTERNO"
  ismId?: number | null;     // ISM responsável (só para EXTERNO)
  chatIsmHabilitado?: boolean;
}

export async function getEmployees({
  page = 0,
  size = 10,
  search = "",
  active = null,
}: GetEmployeesParams = {}): Promise<PaginationResponse<Employee>> {
  const response = await api.get<PaginationResponse<Employee>>("/employees", {
    params: { page, size, search, active: active === null ? undefined : active },
  });
  return response.data;
}

export async function getEmployeeById(id: number): Promise<Employee> {
  const response = await api.get<Employee>(`/employees/${id}`);
  return response.data;
}

export async function createEmployee(data: EmployeeRequest): Promise<Employee> {
  const response = await api.post<Employee>("/employees", data);
  return response.data;
}

export async function updateEmployee(id: number, data: EmployeeRequest): Promise<Employee> {
  const response = await api.put<Employee>(`/employees/${id}`, data);
  return response.data;
}

export async function deleteEmployee(id: number): Promise<void> {
  await api.delete(`/employees/${id}`);
}
