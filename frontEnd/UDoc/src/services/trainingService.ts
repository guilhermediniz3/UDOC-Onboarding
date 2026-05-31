import api from "./api";

export interface KanbanEmployeeEntry {
  employeeId: number;
  employeeName: string;
  notaObtida?: number;
  aprovado: boolean;
}

export interface KanbanCompanyEntry {
  companyId: number;
  companyName: string;
  trainingId: number;
  dataInicio?: string;
  dataConclusao?: string;
  aprovado: boolean;
  funcionarios: KanbanEmployeeEntry[];
}

export async function getKanbanData(trailId: number): Promise<KanbanCompanyEntry[]> {
  const r = await api.get<KanbanCompanyEntry[]>(`/trainings/trail/${trailId}/kanban-data`);
  return r.data;
}
