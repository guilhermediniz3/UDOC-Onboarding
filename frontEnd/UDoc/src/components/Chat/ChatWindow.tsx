import { ActionIcon, Group, Loader, Tabs, Text } from "@mantine/core";
import { IconMessageChatbot, IconUser, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { ChatConversa } from "../../services/chatApiService";
import { avaliarChat, getMinhaConversa } from "../../services/chatApiService";
import { connectChat } from "../../services/chatWsService";
import ChatIATab from "./ChatIATab";
import ChatISMClientTab from "./ChatISMClientTab";
import ChatISMQueue from "./ChatISMQueue";

interface Props {
  onClose: () => void;
  chatIsmHabilitado: boolean;
}

export default function ChatWindow({ onClose, chatIsmHabilitado }: Props) {
  const { user } = useAuth();
  const [conversa, setConversa] = useState<ChatConversa | null>(null);
  const [loading, setLoading] = useState(true);
  const [showISMNPS, setShowISMNPS] = useState(false);
  const disconnectRef = useRef<() => void>(() => {});

  const isIsm   = user?.role === "ISM";
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    // Todos os perfis carregam/criam conversa para usar o assistente IA
    getMinhaConversa()
      .then(setConversa)
      .catch(() => {})
      .finally(() => setLoading(false));

    // Conecta WebSocket
    const disconnect = connectChat(
      (msg) => {
        // Encerramento pelo ISM → dispara NPS no cliente
        if (msg.tipo === "ENCERRAMENTO") {
          setShowISMNPS(true);
          return;
        }
        // Nova mensagem do ISM → adiciona na aba ISM cliente
        if (typeof (window as any)._chatISMAddMsg === "function") {
          (window as any)._chatISMAddMsg(msg);
        }
        // Nova mensagem do cliente → adiciona na fila ISM
        if (typeof (window as any)._ismAddMsgToConversa === "function") {
          (window as any)._ismAddMsgToConversa(msg);
        }
      },
      undefined,
      user?.id
    );
    disconnectRef.current = disconnect;
    return () => disconnect();
  }, []);

  function handleIAEncerrar() { onClose(); }

  function handleISMNPSAvaliar(nota: number) {
    if (conversa) avaliarChat(conversa.id, nota, "ISM").catch(() => {});
    setShowISMNPS(false);
    onClose();
  }

  return (
    <div style={{
      position: "fixed", bottom: 90, right: 24, zIndex: 1000,
      width: 380, height: 520,
      background: "var(--card-bg)",
      border: "1px solid var(--border-color)",
      borderRadius: 20,
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <Group px="md" py="sm" justify="space-between"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #2563eb)",
          flexShrink: 0,
        }}>
        <Group gap="sm">
          <IconMessageChatbot size={20} color="white" />
          <Text fw={700} fz="sm" c="white">UDoc Assistente</Text>
        </Group>
        <ActionIcon variant="subtle" color="white" radius="xl" size="sm" onClick={onClose}>
          <IconX size={16} />
        </ActionIcon>
      </Group>

      {/* Conteúdo */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader size="md" color="violet" />
        </div>
      ) : isIsm ? (
        /* Visão ISM: Assistente IA + Atendimentos */
        <Tabs defaultValue="ia" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          styles={{ panel: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" } }}>
          <Tabs.List px="md" style={{ flexShrink: 0 }}>
            <Tabs.Tab value="ia" leftSection={<IconMessageChatbot size={14} />}>
              Assistente IA
            </Tabs.Tab>
            <Tabs.Tab value="atendimentos" leftSection={<IconUser size={14} />}>
              Atendimentos
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="ia" style={{ flex: 1, overflow: "hidden" }}>
            {conversa && (
              <ChatIATab conversaId={conversa.id} onEncerrar={handleIAEncerrar} />
            )}
          </Tabs.Panel>

          <Tabs.Panel value="atendimentos" style={{ flex: 1, overflow: "hidden" }}>
            <ChatISMQueue
              userEmail={user?.email ?? ""}
              userId={user?.id ?? 0}
            />
          </Tabs.Panel>
        </Tabs>
      ) : isAdmin ? (
        /* Visão Admin: apenas Assistente IA */
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {conversa && (
            <ChatIATab conversaId={conversa.id} onEncerrar={handleIAEncerrar} />
          )}
        </div>
      ) : (
        /* Visão Cliente: abas IA + ISM */
        <Tabs defaultValue="ia" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          styles={{ panel: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" } }}>
          <Tabs.List px="md" style={{ flexShrink: 0 }}>
            <Tabs.Tab value="ia" leftSection={<IconMessageChatbot size={14} />}>
              Assistente IA
            </Tabs.Tab>
            {chatIsmHabilitado && (
              <Tabs.Tab value="ism" leftSection={<IconUser size={14} />}>
                Falar com ISM
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="ia" style={{ flex: 1, overflow: "hidden" }}>
            {conversa && (
              <ChatIATab conversaId={conversa.id} onEncerrar={handleIAEncerrar} />
            )}
          </Tabs.Panel>

          {chatIsmHabilitado && conversa && (
            <Tabs.Panel value="ism" style={{ flex: 1, overflow: "hidden" }}>
              <ChatISMClientTab
                conversa={conversa}
                userEmail={user?.email ?? ""}
                showNPS={showISMNPS}
                onNPSAvaliar={handleISMNPSAvaliar}
              />
            </Tabs.Panel>
          )}
        </Tabs>
      )}
    </div>
  );
}
