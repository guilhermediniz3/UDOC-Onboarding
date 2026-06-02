import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  Progress,
  Select,
  Stack,
  Table,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";

import {
  IconAlertTriangle,
  IconCheck,
  IconDatabase,
  IconInfoCircle,
  IconSettings,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";

import {
  deleteRoomRecording,
  getRecordingFileUrl,
} from "../../services/recordingService";

import {
  formatBytes,
  getAllRecordings,
  getStorageInfo,
  setStorageLimit,
  storageColor,
  type RecordingEntry,
  type StorageInfo,
} from "../../services/storageService";

// ── Barra de progresso de armazenamento ──────────────────────────────────────
function StorageBar({ info }: { info: StorageInfo }) {
  const color = storageColor(info.pct);
  const mantineColor = color === "red" ? "red" : color === "yellow" ? "yellow" : "green";

  return (
    <Stack gap="6px">
      <Group justify="space-between">
        <Text fz="sm" c="var(--text-secondary)">
          {formatBytes(info.usedBytes)} utilizados de {formatBytes(info.limitBytes)}
        </Text>
        <Text fz="sm" fw={700} c={mantineColor}>{info.pct}%</Text>
      </Group>
      <Progress value={info.pct} color={mantineColor} radius="xl" size="lg" animated={info.pct < 100} />
      <Text fz="xs" c="var(--text-secondary)">
        {formatBytes(info.limitBytes - info.usedBytes)} disponíveis
      </Text>
    </Stack>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function AdminSettings() {
  const [info, setInfo]             = useState<StorageInfo | null>(null);
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);
  const [limitValue, setLimitValue] = useState<number>(10);
  const [limitUnit, setLimitUnit]   = useState<"GB" | "MB">("GB");
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState("");
  const [msgType, setMsgType]       = useState<"success" | "error">("success");

  function showMsg(type: "success" | "error", text: string) {
    setMsgType(type); setMsg(text); setTimeout(() => setMsg(""), 3500);
  }

  async function load() {
    const [si, recs] = await Promise.all([
      getStorageInfo().catch(() => null),
      getAllRecordings().catch(() => [] as RecordingEntry[]),
    ]);
    if (si) {
      setInfo(si);
      const gb = si.limitBytes / 1_073_741_824;
      if (gb >= 1 && Number.isInteger(gb)) { setLimitValue(gb); setLimitUnit("GB"); }
      else { setLimitValue(Math.round(si.limitBytes / 1_048_576)); setLimitUnit("MB"); }
    }
    setRecordings(recs);
  }

  useEffect(() => { load(); }, []);

  async function handleSaveLimit() {
    setSaving(true);
    try {
      const bytes = limitUnit === "GB"
        ? limitValue * 1_073_741_824
        : limitValue * 1_048_576;
      const updated = await setStorageLimit(bytes);
      setInfo(updated);
      showMsg("success", "Limite de armazenamento salvo!");
    } catch { showMsg("error", "Erro ao salvar o limite."); }
    finally { setSaving(false); }
  }

  async function handleDelete(recId: number) {
    if (!confirm("Excluir esta gravação permanentemente?")) return;
    await deleteRoomRecording(recId);
    setRecordings((p) => p.filter((r) => r.id !== recId));
    load(); // atualiza espaço utilizado
  }

  const inputStyles = {
    input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
    label: { color: "var(--text-primary)", marginBottom: 6 },
  };

  const totalSize = recordings.reduce((s, r) => s + (r.fileSize ?? 0), 0);

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      {/* Header */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group gap="sm">
          <IconSettings size={28} color="var(--mantine-color-violet-5)" />
          <div>
            <Title order={2} c="var(--text-primary)">Configurações Globais</Title>
            <Text c="var(--text-secondary)" mt={2}>Parâmetros gerais do sistema UDoc</Text>
          </div>
        </Group>
      </Paper>

      {/* Seção: Armazenamento */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
        <Stack gap="20px">

          <Group gap="sm" align="center">
            <IconDatabase size={22} color="var(--mantine-color-violet-5)" />
            <Title order={4} c="var(--text-primary)">Armazenamento de Gravações</Title>
            <Tooltip
              label="Controla o espaço total disponível para gravações de tela. Quando o limite é atingido, novas gravações são bloqueadas."
              withArrow multiline w={280} position="right"
            >
              <IconInfoCircle size={15} color="var(--text-secondary)" style={{ cursor: "help", opacity: 0.7 }} />
            </Tooltip>
          </Group>

          {/* Alertas progressivos */}
          {info && info.pct >= 90 && (
            <Alert color="red" radius="xl" variant="light" icon={<IconAlertTriangle size={18} />}>
              <Text fw={600}>Espaço crítico: {info.pct}% utilizado.</Text>
              <Text fz="sm">Exclua gravações desnecessárias ou aumente o limite para permitir novas gravações.</Text>
            </Alert>
          )}
          {info && info.pct >= 80 && info.pct < 90 && (
            <Alert color="yellow" radius="xl" variant="light" icon={<IconAlertTriangle size={18} />}>
              Atenção: {info.pct}% do espaço de gravações está sendo utilizado.
            </Alert>
          )}

          {/* Barra de uso */}
          {info ? <StorageBar info={info} /> : <Text c="var(--text-secondary)" fz="sm">Carregando...</Text>}

          {/* Configuração do limite */}
          <Group align="flex-end" gap="sm">
            <NumberInput
              label="Limite de armazenamento"
              description="Espaço máximo para todas as gravações de tela"
              min={1} step={1}
              value={limitValue}
              onChange={(v) => setLimitValue(Number(v) || 1)}
              radius="xl" size="md" w={180}
              styles={inputStyles}
            />
            <Select
              data={[{ value: "GB", label: "GB" }, { value: "MB", label: "MB" }]}
              value={limitUnit}
              onChange={(v) => setLimitUnit((v ?? "GB") as "GB" | "MB")}
              radius="xl" size="md" w={100}
              styles={inputStyles}
            />
            <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }}
              loading={saving} onClick={handleSaveLimit}>
              Salvar limite
            </Button>
          </Group>

          {msg && (
            <Alert color={msgType === "success" ? "green" : "red"} radius="xl" variant="light"
              icon={msgType === "success" ? <IconCheck size={16} /> : <IconX size={16} />}>
              {msg}
            </Alert>
          )}
        </Stack>
      </Paper>

      {/* Seção: Gerenciar gravações */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
        <Stack gap="16px">

          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Title order={4} c="var(--text-primary)">Gravações armazenadas</Title>
              <Badge variant="light" color="violet" radius="xl">{recordings.length}</Badge>
            </Group>
            <Text fz="sm" c="var(--text-secondary)">Total: {formatBytes(totalSize)}</Text>
          </Group>

          {recordings.length === 0 ? (
            <Text ta="center" c="var(--text-secondary)" py="xl">Nenhuma gravação armazenada ainda.</Text>
          ) : (
            <Table striped highlightOnHover radius="md"
              styles={{ th: { color: "var(--text-secondary)", background: "var(--app-bg)" }, td: { color: "var(--text-primary)" } }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Arquivo</Table.Th>
                  <Table.Th>Tamanho</Table.Th>
                  <Table.Th>Duração</Table.Th>
                  <Table.Th>Data</Table.Th>
                  <Table.Th w={120}>Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {recordings.map((rec) => (
                  <Table.Tr key={rec.id}>
                    <Table.Td>
                      <Text fz="sm" truncate maw={280}>{rec.filename}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fz="sm">{rec.fileSize ? formatBytes(rec.fileSize) : "—"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fz="sm">
                        {rec.durationSeconds != null
                          ? `${Math.floor(rec.durationSeconds / 60)}:${String(rec.durationSeconds % 60).padStart(2, "0")}`
                          : "—"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fz="sm">{new Date(rec.createdAt).toLocaleString("pt-BR")}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="Reproduzir" withArrow>
                          <ActionIcon
                            size="sm" radius="xl" variant="light" color="violet"
                            component="a" href={getRecordingFileUrl(rec.id)} target="_blank"
                          >
                            ▶
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Excluir permanentemente" withArrow>
                          <ActionIcon size="sm" radius="xl" variant="light" color="red"
                            onClick={() => handleDelete(rec.id)}>
                            <IconTrash size={13} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Paper>

    </Stack>
  );
}
