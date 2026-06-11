import api from "./api";

export interface ChatConfig {
  chatGlobalHabilitado: boolean;
  chatIsmHabilitado: boolean;
}

export interface ChatMensagem {
  id: number;
  conversaId: number;
  conteudo: string;
  tipo: "CLIENTE" | "ISM" | "IA" | "SISTEMA";
  lida: boolean;
  dataHora: string;
}

export interface ChatConversa {
  id: number;
  clienteId: number;
  clienteNome: string;
  clienteEmail: string;
  ismId?: number;
  ismNome?: string;
  ismUserEmail?: string;     // email de login do ISM — usado para rotear mensagem no WebSocket
  ismAccountUserId?: number; // user_id do ISM — usado para assinar o tópico de badge
  status: "ABERTA" | "ENCERRADA";
  criadaEm: string;
  encerradaEm?: string;
  mensagens: ChatMensagem[];
  naoLidas: number;
}

export async function getChatConfig(): Promise<ChatConfig> {
  const r = await api.get<ChatConfig>("/chat/config");
  return r.data;
}

export async function getBoasVindas(): Promise<string> {
  const r = await api.get<{ mensagem: string }>("/chat/ia/boas-vindas");
  return r.data.mensagem;
}

export async function perguntarIA(pergunta: string): Promise<string> {
  const r = await api.post<{ resposta: string }>("/chat/ia/perguntar", { pergunta });
  return r.data.resposta;
}

export async function getMinhaConversa(): Promise<ChatConversa> {
  const r = await api.get<ChatConversa>("/chat/conversa");
  return r.data;
}

export async function getNaoLidasCliente(): Promise<number> {
  try {
    const r = await api.get<{ total: number }>("/chat/conversa/nao-lidas");
    return r.data.total;
  } catch { return 0; }
}

export async function marcarLidasCliente(): Promise<void> {
  await api.post("/chat/conversa/marcar-lidas");
}

export async function enviarMensagemCliente(conversaId: number, conteudo: string): Promise<void> {
  await api.post(`/chat/conversa/${conversaId}/mensagem`, { conteudo });
}

export async function enviarRespostaIsm(conversaId: number, conteudo: string): Promise<void> {
  await api.post(`/chat/ism/conversas/${conversaId}/mensagem`, { conteudo });
}

export async function avaliarChat(conversaId: number, nota: number, tipo: "IA" | "ISM"): Promise<void> {
  await api.post(`/chat/conversa/${conversaId}/avaliar`, { nota, tipo });
}

// ISM endpoints
export async function getIsmVinculado(): Promise<boolean> {
  try {
    const r = await api.get<{ vinculado: boolean }>("/chat/ism/vinculado");
    return r.data.vinculado;
  } catch {
    return false;
  }
}

export async function getConversasIsm(): Promise<ChatConversa[]> {
  const r = await api.get<ChatConversa[]>("/chat/ism/conversas");
  return r.data;
}

export async function getDetalheConversa(id: number): Promise<ChatConversa> {
  const r = await api.get<ChatConversa>(`/chat/ism/conversas/${id}`);
  return r.data;
}

export async function encerrarConversa(id: number): Promise<void> {
  await api.post(`/chat/ism/conversas/${id}/encerrar`);
}

export async function getNaoLidasIsm(): Promise<number> {
  const r = await api.get<{ total: number }>("/chat/ism/nao-lidas");
  return r.data.total;
}

export async function getChatDashboard(startDate?: string, endDate?: string) {
  const r = await api.get("/chat/dashboard", { params: { startDate, endDate } });
  return r.data;
}

export interface AdminConversasPage {
  content: ChatConversa[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export async function getAdminConversas(params: {
  ismId?: number;
  status?: string;
  page?: number;
  size?: number;
}): Promise<AdminConversasPage> {
  const r = await api.get<AdminConversasPage>("/chat/admin/conversas", { params });
  return r.data;
}

export async function getAdminConversa(id: number): Promise<ChatConversa> {
  const r = await api.get<ChatConversa>(`/chat/admin/conversas/${id}`);
  return r.data;
}

// ── Analytics de dúvidas ──────────────────────────────────────────────────────

export interface ChatTopico {
  tema: string;
  total: number;
  ultimaOcorrencia: string | null;
}

export interface CardSugestao {
  tema: string;
  conteudoHtml: string;
  provedor: string;
}

export interface ClassificarResult {
  processadas: number;
  classificadas: number;
  pendentes: number;
}

export async function getTopicosChat(de?: string, ate?: string): Promise<ChatTopico[]> {
  const r = await api.get<ChatTopico[]>("/chat/admin/analytics/topicos", {
    params: { de, ate },
  });
  return r.data;
}

export async function getPendentesChat(): Promise<number> {
  const r = await api.get<{ pendentes: number }>("/chat/admin/analytics/pendentes");
  return r.data.pendentes;
}

export async function classificarChat(limite = 50): Promise<ClassificarResult> {
  const r = await api.post<ClassificarResult>("/chat/admin/analytics/classificar", null, {
    params: { limite },
  });
  return r.data;
}

export async function sugerirCardChat(tema: string, total: number): Promise<CardSugestao> {
  const r = await api.post<CardSugestao>("/chat/admin/analytics/sugerir-card", null, {
    params: { tema, total },
  });
  return r.data;
}
