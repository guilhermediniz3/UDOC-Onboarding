import {
  ActionIcon, Badge, Button, Group, Loader, Paper,
  SimpleGrid, Stack, Text, TextInput, Title, Tooltip,
} from "@mantine/core";
import {
  IconBook2, IconCheck, IconClock,
  IconRoute, IconSearch, IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CatalogTrail } from "../../services/catalogService";
import { enrollTrail, getCatalog } from "../../services/catalogService";

// ── Card de trilha no catálogo ────────────────────────────────────────────────
function TrailCard({ trail, onEnrolled }: { trail: CatalogTrail; onEnrolled: () => void }) {
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError]         = useState("");
  const navigate = useNavigate();

  async function handleEnroll() {
    setEnrolling(true);
    setError("");
    try {
      await enrollTrail(trail.id);
      onEnrolled();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Erro ao matricular.");
    } finally {
      setEnrolling(false);
    }
  }

  const statusBadge = () => {
    if (trail.enrollStatus === "COMPLETED")  return <Badge color="green" variant="light" radius="xl">Concluída ✓</Badge>;
    if (trail.enrollStatus === "IN_PROGRESS") return <Badge color="blue"  variant="light" radius="xl">Em andamento</Badge>;
    if (trail.enrollStatus === "ENROLLED")    return <Badge color="violet" variant="light" radius="xl">Matriculado</Badge>;
    return null;
  };

  const actionButton = () => {
    if (trail.enrollStatus === "COMPLETED") {
      return (
        <Button fullWidth radius="xl" size="sm" color="green" variant="light"
          leftSection={<IconCheck size={15} />} disabled>
          Concluída
        </Button>
      );
    }
    if (trail.enrollStatus === "IN_PROGRESS" || trail.enrollStatus === "ENROLLED") {
      return (
        <Button fullWidth radius="xl" size="sm" color="blue" variant="light"
          leftSection={<IconClock size={15} />}
          onClick={() => navigate("/minhas-trilhas")}>
          Ver trilha
        </Button>
      );
    }
    return (
      <Button fullWidth radius="xl" size="sm" variant="gradient"
        gradient={{ from: "violet", to: "blue" }}
        leftSection={<IconBook2 size={15} />}
        loading={enrolling}
        onClick={handleEnroll}>
        Matricular
      </Button>
    );
  };

  return (
    <Paper p="24px" radius="20px"
      style={{
        background: "var(--card-bg)", border: "1px solid var(--border-color)",
        boxShadow: "0 4px 20px var(--shadow-color)",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
      {/* Ícone + badge */}
      <Group justify="space-between" align="flex-start">
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "rgba(124,58,237,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <IconRoute size={26} color="#7c3aed" />
        </div>
        {statusBadge()}
      </Group>

      {/* Título e descrição */}
      <Stack gap={4} style={{ flex: 1 }}>
        <Text fw={700} fz="md" c="var(--text-primary)" lineClamp={2}>
          {trail.name}
        </Text>
        {trail.description && (
          <Text fz="sm" c="var(--text-secondary)" lineClamp={3}>
            {trail.description}
          </Text>
        )}
      </Stack>

      {/* Contagem de cards */}
      <Text fz="xs" c="var(--text-secondary)">
        {trail.totalCards} card{trail.totalCards !== 1 ? "s" : ""}
      </Text>

      {error && (
        <Text fz="xs" c="red">{error}</Text>
      )}

      {actionButton()}
    </Paper>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Catalogo() {
  const [trails, setTrails]   = useState<CatalogTrail[]>([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load(search);
  }, []);

  async function load(q?: string) {
    setLoading(true);
    try {
      setTrails(await getCatalog(q));
    } catch {} finally { setLoading(false); }
  }

  function handleSearch(v: string) {
    setSearch(v);
    load(v);
  }

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      {/* Header */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="sm">
            <IconBook2 size={28} color="var(--mantine-color-violet-5)" />
            <div>
              <Title order={2} c="var(--text-primary)">Catálogo de Trilhas</Title>
              <Text c="var(--text-secondary)" mt={2}>Encontre e se matricule nas trilhas disponíveis</Text>
            </div>
          </Group>
          <TextInput
            placeholder="Buscar trilha..."
            leftSection={<IconSearch size={16} />}
            rightSection={search
              ? <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => handleSearch("")}><IconX size={12} /></ActionIcon>
              : null}
            value={search}
            onChange={(e) => handleSearch(e.currentTarget.value)}
            radius="xl" size="md" w={280}
            styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } }}
          />
        </Group>
      </Paper>

      {/* Lista */}
      {loading ? (
        <Stack align="center" py="xl"><Loader color="violet" /></Stack>
      ) : trails.length === 0 ? (
        <Paper p="40px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
          <Text ta="center" c="var(--text-secondary)">
            {search ? `Nenhuma trilha encontrada para "${search}".` : "Nenhuma trilha disponível no catálogo."}
          </Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="lg">
          {trails.map(t => (
            <TrailCard key={t.id} trail={t} onEnrolled={() => load(search)} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
