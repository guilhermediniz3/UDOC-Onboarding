import { ActionIcon, Badge, Group, ScrollArea, Stack, Text, Textarea } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import type { ChatConversa, ChatMensagem } from "../../services/chatApiService";
import { avaliarChat, enviarMensagemCliente, marcarLidasCliente } from "../../services/chatApiService";
import ChatNPS from "./ChatNPS";

interface Props {
  conversa: ChatConversa;
  userEmail: string;
  showNPS: boolean;
  onNPSAvaliar: (nota: number) => void;
  ismStatus?: string;
}

const STATUS_CONFIG: Record<string, { cor: string; label: string }> = {
  Online:  { cor: "#22c55e", label: "Online" },
  Ausente: { cor: "#eab308", label: "Ausente" },
  Offline: { cor: "#6b7280", label: "Offline" },
};

export default function ChatISMClientTab({ conversa, userEmail, showNPS, onNPSAvaliar, ismStatus = "Offline" }: Props) {
  const [msgs, setMsgs] = useState<ChatMensagem[]>(conversa.mensagens);
  const [input, setInput] = useState("");
  const [aguardando, setAguardando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // Marca mensagens do ISM como lidas ao abrir a aba e zera o badge do cliente
  useEffect(() => {
    marcarLidasCliente().catch(() => {});
  }, []);

  // Recebe nova mensagem via WebSocket (controlado pelo pai)
  useEffect(() => {
    setMsgs(conversa.mensagens);
    // Ao receber novas mensagens enquanto a aba está aberta, marca como lidas imediatamente
    marcarLidasCliente().catch(() => {});
  }, [conversa.mensagens]);

  function addMensagem(msg: ChatMensagem) { setMsgs((p) => [...p, msg]); }

  // Expõe para o ChatWindow
  (window as any)._chatISMAddMsg = addMensagem;

  async function enviar() {
    const texto = input.trim();
    if (!texto || aguardando) return;
    setInput("");
    setAguardando(true);

    // Otimista: exibe na UI imediatamente
    const msgLocal: ChatMensagem = {
      id: Date.now(), conversaId: conversa.id,
      conteudo: texto, tipo: "CLIENTE", lida: false,
      dataHora: new Date().toISOString(),
    };
    setMsgs((p) => [...p, msgLocal]);

    try {
      // REST garante persistência no banco independente do WebSocket
      // O backend notifica o ISM via WebSocket após salvar (se vinculado)
      await enviarMensagemCliente(conversa.id, texto);

      const confirmacao: ChatMensagem = {
        id: Date.now() + 1, conversaId: conversa.id,
        conteudo: "✓ Mensagem enviada! Vamos analisar e retornar assim que possível.",
        tipo: "SISTEMA", lida: true,
        dataHora: new Date().toISOString(),
      };
      setMsgs((p) => [...p, confirmacao]);
    } catch {
      // Remove a mensagem otimista e mostra erro
      setMsgs((p) => p.filter((m) => m.id !== msgLocal.id));
      const erro: ChatMensagem = {
        id: Date.now() + 2, conversaId: conversa.id,
        conteudo: "Erro ao enviar mensagem. Tente novamente.",
        tipo: "SISTEMA", lida: true,
        dataHora: new Date().toISOString(),
      };
      setMsgs((p) => [...p, erro]);
    } finally {
      setAguardando(false);
    }
  }

  const statusCfg = STATUS_CONFIG[ismStatus] || STATUS_CONFIG["Offline"];

  return (
    <Stack gap={0} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Status ISM */}
      <Group px="md" py="xs" gap="sm"
        style={{ borderBottom: "1px solid var(--border-color)", background: "var(--app-bg)" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusCfg.cor }} />
        <Text fz="xs" c="var(--text-secondary)">
          {conversa.ismNome
            ? `${conversa.ismNome} — ${statusCfg.label}`
            : "Nenhum ISM atribuído — aguarde a atribuição"}
        </Text>
      </Group>

      <ScrollArea style={{ flex: 1, padding: "12px 16px" }} scrollbarSize={4}>
        <Stack gap="sm">
          {msgs.map((m, i) => {
            const isCliente = m.tipo === "CLIENTE";
            const isSistema = m.tipo === "SISTEMA";
            return (
              <div key={i} style={{
                alignSelf: isCliente ? "flex-end" : isSistema ? "center" : "flex-start",
                maxWidth: isSistema ? "90%" : "80%",
              }}>
                <div style={{
                  background: isCliente ? "linear-gradient(135deg,#7c3aed,#2563eb)"
                    : isSistema ? "rgba(34,197,94,0.1)"
                    : "var(--app-bg)",
                  color: isCliente ? "#fff"
                    : isSistema ? "#16a34a"
                    : "var(--text-primary)",
                  padding: "8px 12px", borderRadius: 14, fontSize: 13, lineHeight: 1.6,
                  border: !isCliente ? "1px solid var(--border-color)" : "none",
                }}>
                  {!isCliente && !isSistema && (
                    <Text fz="xs" fw={700} mb={2} c="violet">{conversa.ismNome ?? "ISM"}</Text>
                  )}
                  {m.conteudo}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </Stack>

        {showNPS && (
          <ChatNPS tipo="ISM" conversaId={conversa.id} onAvaliar={onNPSAvaliar} />
        )}
      </ScrollArea>

      {!showNPS && (
        <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-color)" }}>
          <Group gap="sm" align="flex-end">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
              autosize minRows={1} maxRows={3}
              radius="xl" size="sm" style={{ flex: 1 }}
              styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } }}
            />
            <ActionIcon variant="gradient" gradient={{ from: "violet", to: "blue" }}
              radius="xl" size="lg" onClick={enviar}>
              <IconSend size={16} />
            </ActionIcon>
          </Group>
        </div>
      )}
    </Stack>
  );
}
