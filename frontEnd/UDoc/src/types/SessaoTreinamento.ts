export interface SessaoTreinamento {
  id: number;
  trainingRoomId: number;
  trainingRoomTitle?: string;
  dataHoraInicio: string;
  dataHoraFim?: string;
  status: "EM_ANDAMENTO" | "ENCERRADA";
  criadoPorId?: number;
  criadoPorName?: string;
  ratStatus: "SEM_RAT" | "RASCUNHO" | "FINALIZADO";
  ratId?: number;
}
