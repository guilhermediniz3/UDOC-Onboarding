import {
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import {
  IconArrowRight,
  IconRoute,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMyTrails } from "../../services/myTrailsService";
import type { Trail } from "../../types/Trail";

export default function MinhasTrihas() {

  const navigate = useNavigate();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getMyTrails()
      .then(setTrails)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group gap="sm" align="center">
          <IconRoute size={28} color="var(--mantine-color-violet-5)" />
          <div>
            <Title order={2} c="var(--text-primary)" fw={700}>Minhas Trilhas</Title>
            <Text c="var(--text-secondary)" mt={4}>
              Trilhas de treinamento em que você está matriculado
            </Text>
          </div>
        </Group>
      </Paper>

      {loading && (
        <Text ta="center" c="var(--text-secondary)" py="xl">Carregando trilhas...</Text>
      )}

      {error && (
        <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
          <Text ta="center" c="var(--text-secondary)">
            Você ainda não está vinculado a nenhum funcionário externo.
            Peça ao administrador para vincular seu usuário a um funcionário.
          </Text>
        </Paper>
      )}

      {!loading && !error && trails.length === 0 && (
        <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
          <Text ta="center" c="var(--text-secondary)">
            Nenhuma trilha de treinamento encontrada para o seu perfil.
          </Text>
        </Paper>
      )}

      {!loading && trails.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {trails.map((trail) => (
            <Paper
              key={trail.id}
              p="28px"
              radius="24px"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-color)",
                boxShadow: "0 4px 20px var(--shadow-color)",
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 12px 40px var(--shadow-color)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 4px 20px var(--shadow-color)";
              }}
              onClick={() => navigate(`/minhas-trilhas/${trail.id}`)}
            >
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: "rgba(124,58,237,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <IconRoute size={26} color="#7c3aed" />
                  </div>
                  <Badge
                    color={trail.active ? "green" : "gray"}
                    variant="light" radius="xl" size="sm"
                  >
                    {trail.active ? "Ativa" : "Inativa"}
                  </Badge>
                </Group>

                <div>
                  <Text fw={700} fz="lg" c="var(--text-primary)" lineClamp={2}>
                    {trail.name}
                  </Text>
                  {trail.description && (
                    <Text fz="sm" c="var(--text-secondary)" mt={6} lineClamp={2}>
                      {trail.description}
                    </Text>
                  )}
                </div>

                <Button
                  rightSection={<IconArrowRight size={16} />}
                  radius="xl" size="sm" variant="light" color="violet"
                  fullWidth
                  onClick={(e) => { e.stopPropagation(); navigate(`/minhas-trilhas/${trail.id}`); }}
                >
                  Acessar trilha
                </Button>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      )}

    </Stack>
  );
}
