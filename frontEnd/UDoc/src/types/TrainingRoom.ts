export interface TrainingRoom {
  id?: number;
  title: string;
  description: string;
  companyId?: number;
  companyName?: string;
  ismId?: number;
  ismName?: string;
  trailId?: number;
  trailName?: string;
  sortOrder: number;
  status: "AGENDADA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
  vimeoUrl?: string;
  youtubeUrl?: string;
  jitsiRoomId?: string;
  active: boolean;
  createdAt?: string;
  invitedEmployeeIds?: number[];
  invitedEmployeeNames?: string[];
}
