import api from "./api";

export interface KanbanEmployeeEntry {
  employeeId: number;
  employeeName: string;
  notaObtida?: number;
  aprovado: boolean;
  completedTrail?: boolean;  // concluiu a trilha no sistema
  certifiedTrail?: boolean;  // passou no quiz da trilha
}

export interface KanbanCompanyEntry {
  companyId: number;
  companyName: string;
  trainingId: number;
  dataInicio?: string;
  dataConclusao?: string;
  aprovado: boolean;
  allCompleted?: boolean;  // todos os funcionários concluíram
  anyCertified?: boolean;  // ao menos um foi certificado
  funcionarios: KanbanEmployeeEntry[];
}

export async function getKanbanData(trailId: number): Promise<KanbanCompanyEntry[]> {
  const r = await api.get<KanbanCompanyEntry[]>(`/trainings/trail/${trailId}/kanban-data`);
  return r.data;
}
