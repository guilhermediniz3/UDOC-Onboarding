import { Button, Center, Stack, Text, Title } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

export default function Forbidden() {
  const navigate = useNavigate();
  return (
    <Center style={{ minHeight: "100vh", background: "var(--app-bg)" }}>
      <Stack align="center" gap="lg">
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: "rgba(239,68,68,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <IconLock size={40} color="#ef4444" />
        </div>
        <Title order={2} c="var(--text-primary)">Acesso Negado</Title>
        <Text c="var(--text-secondary)" ta="center" maw={360}>
          Você não tem permissão para acessar esta página.
          Esta área é restrita a administradores.
        </Text>
        <Button radius="xl" variant="gradient" gradient={{ from: "violet", to: "blue" }}
          onClick={() => navigate("/")}>
          Voltar ao início
        </Button>
      </Stack>
    </Center>
  );
}
