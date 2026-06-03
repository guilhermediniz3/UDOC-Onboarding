import { ActionIcon, Group, Loader, ScrollArea, Stack, Text, Textarea } from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { avaliarChat, getBoasVindas, perguntarIA } from "../../services/chatApiService";
import ChatNPS from "./ChatNPS";

interface Msg { role: "user" | "ia"; text: string; }

interface Props { conversaId: number; onEncerrar: () => void; }

export default function ChatIATab({ conversaId, onEncerrar }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNPS, setShowNPS] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getBoasVindas().then((bv) => setMsgs([{ role: "ia", text: bv }])).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function enviar() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMsgs((p) => [...p, { role: "user", text: q }]);
    setLoading(true);
    try {
      const resp = await perguntarIA(q);
      setMsgs((p) => [...p, { role: "ia", text: resp }]);
    } catch {
      setMsgs((p) => [...p, { role: "ia", text: "Desculpe, ocorreu um erro. Tente novamente." }]);
    } finally { setLoading(false); }
  }

  function handleAvaliar(nota: number) {
    avaliarChat(conversaId, nota, "IA").catch(() => {});
    setTimeout(onEncerrar, 1500);
  }

  return (
    <Stack gap={0} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <ScrollArea style={{ flex: 1, padding: "12px 16px" }} scrollbarSize={4}>
        <Stack gap="sm">
          {msgs.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              display: "flex", flexDirection: "column",
              maxWidth: "80%",
            }}>
              <div style={{
                background: m.role === "user"
                  ? "linear-gradient(135deg, #7c3aed, #2563eb)"
                  : "var(--app-bg)",
                color: m.role === "user" ? "#fff" : "var(--text-primary)",
                padding: "8px 12px", borderRadius: 14,
                fontSize: 13, lineHeight: 1.6,
                border: m.role === "ia" ? "1px solid var(--border-color)" : "none",
                whiteSpace: "pre-wrap",
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start" }}>
              <Loader size="xs" color="violet" />
            </div>
          )}
          <div ref={bottomRef} />
        </Stack>

        {showNPS && (
          <ChatNPS tipo="IA" conversaId={conversaId} onAvaliar={handleAvaliar} />
        )}
      </ScrollArea>

      {!showNPS && (
        <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-color)" }}>
          <Group gap="sm" align="flex-end">
            <Textarea
              placeholder="Digite sua pergunta..."
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
              autosize minRows={1} maxRows={3}
              radius="xl" size="sm"
              style={{ flex: 1 }}
              styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } }}
            />
            <ActionIcon variant="gradient" gradient={{ from: "violet", to: "blue" }}
              radius="xl" size="lg" onClick={enviar} loading={loading}>
              <IconSend size={16} />
            </ActionIcon>
          </Group>
          <Text
            fz="xs" c="dimmed" ta="center" mt={4} style={{ cursor: "pointer" }}
            onClick={() => setShowNPS(true)}
          >
            Encerrar conversa IA
          </Text>
        </div>
      )}
    </Stack>
  );
}
