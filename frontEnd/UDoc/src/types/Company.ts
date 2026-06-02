export interface Company {
  id?: number;
  headquarters?: number; // opcional — nem toda empresa tem matriz
  name: string;
  phone: string;
  cnpj: string;
  email: string;
  employeeCount: number;
  active: boolean;
  logo?: string;
}
