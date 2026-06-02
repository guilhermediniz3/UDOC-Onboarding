export interface Card {
  id?: number;
  title: string;
  description: string;
  icon: string;
  content: string;
  active: boolean;
  interno?: boolean; // visível apenas para funcionários internos e admins
}