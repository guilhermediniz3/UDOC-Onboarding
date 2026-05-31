export interface Funcionario {
  id?: number;
  nome: string;
  telefone: string;
  email: string;
  empresaId: number;
  empresaNome?: string;
  active: boolean;
}
