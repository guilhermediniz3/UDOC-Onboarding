import { Group, Paper, Stack, Tabs, Text, Title } from "@mantine/core";
import {
  IconClipboardList,
  IconMessageChatbot,
  IconMoodSmile,
  IconShield,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import AbaConversas from "./AbaConversas";
import AbaNpsChat   from "./AbaNpsChat";
import AbaSistema   from "./AbaSistema";

export default function Auditoria() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Guard de segurança client-side — backend já bloqueia via @PreAuthorize
  useEffect(() => {
    if (user && user.role !== "ADMIN" && user.role !== "GESTOR") {
      navigate("/403", { replace: true });
    }
  }, [user]);

  if (!user || (user.role !== "ADMIN" && user.role !== "GESTOR")) return null;

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      {/* Header */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group gap="sm">
          <IconShield size={28} color="var(--mantine-color-violet-5)" />
          <div>
            <Title order={2} c="var(--text-primary)">Auditoria</Title>
            <Text c="var(--text-secondary)" mt={2}>
              Conversas, NPS do chat e histórico de ações do sistema
            </Text>
          </div>
        </Group>
      </Paper>

      {/* Abas */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>

        <Tabs defaultValue="conversas" color="violet">
          <Tabs.List mb="xl">
            <Tabs.Tab value="conversas" leftSection={<IconMessageChatbot size={16} />}>
              Conversas
            </Tabs.Tab>
            <Tabs.Tab value="nps" leftSection={<IconMoodSmile size={16} />}>
              NPS Chat
            </Tabs.Tab>
            <Tabs.Tab value="sistema" leftSection={<IconClipboardList size={16} />}>
              Auditoria do Sistema
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="conversas">
            <AbaConversas />
          </Tabs.Panel>

          <Tabs.Panel value="nps">
            <AbaNpsChat />
          </Tabs.Panel>

          <Tabs.Panel value="sistema">
            <AbaSistema />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Stack>
  );
}
