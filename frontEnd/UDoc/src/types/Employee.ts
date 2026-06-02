export interface Employee {
  id?: number;
  name: string;
  phone: string;
  email: string;
  photo?: string;
  companyId: number;
  companyName?: string;
  userId?: number;
  active: boolean;
  tipo?: "EXTERNO" | "INTERNO"; // tipo do funcionário
}
