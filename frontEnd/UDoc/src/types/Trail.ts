export interface Trail {
  id?: number;
  name: string;
  description: string;
  active: boolean;
  sortOrder: number;
  visibilidade?: "INTERNA" | "EXTERNA" | "AMBAS";
  createdAt?: string;
}
