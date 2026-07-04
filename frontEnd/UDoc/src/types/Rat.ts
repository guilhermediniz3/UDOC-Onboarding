export interface Rat {
  id: number;
  trainingRoomId: number;
  trainingRoomTitle?: string;
  companyId?: number;
  companyName?: string;
  ismId?: number;
  ismName?: string;
  autorId?: number;
  autorName?: string;
  sessaoId?: number;
  status: "RASCUNHO" | "FINALIZADO";
  titulo: string;
  conteudo?: string;
  dataCriacao: string;
}
