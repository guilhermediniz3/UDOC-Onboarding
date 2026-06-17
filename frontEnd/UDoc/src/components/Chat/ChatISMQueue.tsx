import { ActionIcon, Alert, Badge, Button, Group, Loader, ScrollArea, Stack, Text, Textarea } from "@mantine/core";
import { IconAlertTriangle, IconArrowLeft, IconPlayerStop, IconRefresh, IconSend } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import type { ChatConversa, ChatMensagem } from "../../services/chatApiService";
import { encerrarConversa, enviarRespostaIsm, getConversasIsm, getDetalheConversa, getIsmVinculado } from "../../services/chatApiService";

const POLL_INTERVAL_MS = 20_000; // 20 segundos

interface Props { userEmail: string; userId: number; }

export default function ChatISMQueue({ userEmail: _userEmail, userId: _userId }: Props) {
  const [conversas, setConversas]     = useState<ChatConversa[]>([]);
  const [selecionada, setSelecionada] = useState<ChatConversa | null>(null);
  const [input, setInput]             = useState("");
  const [enviando, setEnviando]       = useState(false);
  const [loadingLista, setLoadingLista] = useState(false);
  const [vinculado, setVinculado]     = useState<boolean | null>(null);
  const bottomRef      = useRef<HTMLDivElement>(null);
  const selecionadaRef = useRef<ChatConversa | null>(null);

  // Mantém ref sincronizada para uso dentro de callbacks WS (evita stale closure)
  useEffect(() => { selecionadaRef.current = selecionada; }, [selecionada]);

  useEffect(() => {
    // Verifica se o perfil ISM está vinculado à conta antes de carregar conversas
    getIsmVinculado().then(setVinculado);
    carregarConversas();

    // Polling periódico para capturar novas conversas mesmo sem WS
    const timer = setInterval(carregarConversas, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selecionada?.mensagens]);

  // Handler injetado pelo ChatWindow — chamado quando chega mensagem via WebSocket
  (window as any)._ismAddMsgToConversa = (msg: ChatMensagem) => {
    // Adiciona no detalhe da conversa aberta
    if (selecionadaRef.current?.id === msg.conversaId) {
      setSelecionada((p) => p ? { ...p, mensagens: [...p.mensagens, msg] } : p);
    }

    // Atualiza lista: se a conversa não existir ainda, recarrega tudo
    setConversas((prev) => {
      const existe = prev.some((c) => c.id === msg.conversaId);
      if (!existe) {
        // Nova conversa chegou — busca a lista atualizada
        setTimeout(() => carregarConversas(), 0);
        return prev;
      }
      return prev.map((c) =>
        c.id === msg.conversaId
          ? { ...c, naoLidas: selecionadaRef.current?.id === c.id ? 0 : c.naoLidas + 1 }
          : c
      );
    });
  };

  async function carregarConversas() {
    try {
      setLoadingLista(true);
      const lista = await getConversasIsm();
      setConversas(lista);
    } catch {}
    finally { setLoadingLista(false); }
  }

  async function abrirConversa(c: ChatConversa) {
    try {
      const detalhe = await getDetalheConversa(c.id);
      setSelecionada(detalhe);
      setConversas((prev) => prev.map((x) => x.id === c.id ? { ...x, naoLidas: 0 } : x));
    } catch {}
  }

  async function responder() {
    const texto = input.trim();
    if (!texto || !selecionada || enviando) return;
    setInput("");
    setEnviando(true);

    // Otimista
    const msgOtimista: ChatMensagem = {
      id: Date.now(), conversaId: selecionada.id,
      conteudo: texto, tipo: "ISM", lida: true,
      dataHora: new Date().toISOString(),
    };
    setSelecionada((p) => p ? { ...p, mensagens: [...p.mensagens, msgOtimista] } : p);

    try {
      // REST garante persistência no banco; backend notifica cliente via WebSocket
      await enviarRespostaIsm(selecionada.id, texto);
    } catch {
      // Remove otimista em caso de erro
      setSelecionada((p) =>
        p ? { ...p, mensagens: p.mensagens.filter((m) => m.id !== msgOtimista.id) } : p
      );
    } finally {
      setEnviando(false);
    }
  }

  async function encerrar() {
    if (!selecionada) return;
    await encerrarConversa(selecionada.id);
    // O NPS é enviado ao CLIENTE via WebSocket (ENCERRAMENTO event)
    // O ISM simplesmente volta para a lista de conversas
    setSelecionada(null);
    carregarConversas();
  }

  // ── Lista de conversas ───────────────────────────────────────────────────
  if (!selecionada) {
    return (
      <Stack gap={0} style={{ height: "100%" }}>
        <Group px="md" py="sm" justify="space-between"
          style={{ borderBottom: "1px solid var(--border-color)", flexShrink: 0 }}>
          <Text fz="sm" fw={600} c="var(--text-primary)">Conversas abertas</Text>
          <ActionIcon
            size="sm" variant="subtle" radius="xl"
            loading={loadingLista}
            onClick={carregarConversas}
            title="Atualizar lista"
          >
            <IconRefresh size={14} />
          </ActionIcon>
        </Group>

        {/* Aviso quando o perfil ISM não está vinculado à conta */}
        {vinculado === false && (
          <Alert
            color="orange" radius={0} variant="light"
            icon={<IconAlertTriangle size={15} />}
            style={{ borderBottom: "1px solid var(--border-color)" }}
          >
            <Text fz="xs" fw={600}>Perfil ISM não configurado</Text>
            <Text fz="xs" mt={2}>
              Peça ao administrador acessar{" "}
              <strong>Cadastro → ISM → seu cadastro → "Conta de acesso"</strong>{" "}
              e selecionar esta conta de login.
            </Text>
          </Alert>
        )}

        <ScrollArea style={{ flex: 1 }}>
          {conversas.length === 0 ? (
            <Stack align="center" py="xl" gap="xs">
              {loadingLista
                ? <Loader size="sm" color="violet" />
                : <Text ta="center" c="var(--text-secondary)" fz="sm">Nenhuma conversa aberta 🎉</Text>}
            </Stack>
          ) : (
            conversas.map((c) => (
              <div key={c.id}
                onClick={() => abrirConversa(c)}
                style={{
                  padding: "12px 16px", cursor: "pointer",
                  borderBottom: "1px solid var(--border-color)",
                  background: "transparent", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--app-bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Group justify="space-between" align="flex-start">
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text fz="sm" fw={600} c="var(--text-primary)" truncate>
                      {c.clienteNome}
                    </Text>
                    <Text fz="xs" c="var(--text-secondary)">
                      {new Date(c.criadaEm).toLocaleString("pt-BR")}
                    </Text>
                  </Stack>
                  {c.naoLidas > 0 && (
                    <Badge color="red" radius="xl" size="sm" style={{ flexShrink: 0 }}>
                      {c.naoLidas}
                    </Badge>
                  )}
                </Group>
              </div>
            ))
          )}
        </ScrollArea>
      </Stack>
    );
  }

  // ── Detalhe da conversa ──────────────────────────────────────────────────
  return (
    <Stack gap={0} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Group px="md" py="sm" gap="sm"
        style={{ borderBottom: "1px solid var(--border-color)", background: "var(--app-bg)", flexShrink: 0 }}>
        <ActionIcon variant="subtle" radius="xl" onClick={() => setSelecionada(null)}>
          <IconArrowLeft size={16} />
        </ActionIcon>
        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
          <Text fz="sm" fw={600} c="var(--text-primary)" truncate>{selecionada.clienteNome}</Text>
          <Text fz="xs" c="var(--text-secondary)">{selecionada.clienteEmail}</Text>
        </Stack>
        <Button size="xs" color="red" variant="light" radius="xl"
          leftSection={<IconPlayerStop size={12} />}
          onClick={encerrar}>
          Encerrar
        </Button>
      </Group>

      <ScrollArea style={{ flex: 1, padding: "12px 16px" }} scrollbarSize={4}>
        <Stack gap="sm">
          {selecionada.mensagens.map((m, i) => {
            const isIsm    = m.tipo === "ISM";
            const isSistema = m.tipo === "SISTEMA";
            return (
              <div key={i} style={{
                alignSelf: isIsm ? "flex-end" : isSistema ? "center" : "flex-start",
                maxWidth: isSistema ? "90%" : "80%",
              }}>
                <div style={{
                  background: isIsm
                    ? "linear-gradient(135deg,#7c3aed,#2563eb)"
                    : isSistema ? "rgba(34,197,94,0.1)" : "var(--app-bg)",
                  color: isIsm ? "#fff" : isSistema ? "#16a34a" : "var(--text-primary)",
                  padding: "8px 12px", borderRadius: 14, fontSize: 13, lineHeight: 1.6,
                  border: !isIsm ? "1px solid var(--border-color)" : "none",
                  fontStyle: isSistema ? "italic" : "normal",
                }}>
                  {!isIsm && !isSistema && (
                    <Text fz="xs" fw={700} mb={2} c="var(--text-secondary)">
                      {selecionada.clienteNome}
                    </Text>
                  )}
                  {m.conteudo}
                </div>
                <Text fz="10px" c="var(--text-secondary)"
                  ta={isIsm ? "right" : "left"} mt={2} style={{ paddingLeft: 4 }}>
                  {new Date(m.dataHora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </Stack>

      </ScrollArea>

      <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-color)", flexShrink: 0 }}>
          <Group gap="sm" align="flex-end">
            <Textarea
              placeholder="Responder..."
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); responder(); } }}
              autosize minRows={1} maxRows={3}
              radius="xl" size="sm" style={{ flex: 1 }}
              styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } }}
            />
            <ActionIcon
              variant="gradient" gradient={{ from: "violet", to: "blue" }}
              radius="xl" size="lg"
              loading={enviando}
              onClick={responder}
            >
              <IconSend size={16} />
            </ActionIcon>
          </Group>
        </div>
    </Stack>
  );
}
