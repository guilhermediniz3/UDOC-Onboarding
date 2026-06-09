import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  Pagination,
  PasswordInput,
  Progress,
  Select,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";

import {
  IconAlertTriangle,
  IconCheck,
  IconDatabase,
  IconInfoCircle,
  IconKey,
  IconMail,
  IconMessageChatbot,
  IconMessages,
  IconPlayerPlay,
  IconRobot,
  IconSearch,
  IconSend,
  IconSettings,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";
import api from "../../services/api";
import ChatAdminMonitor from "../../components/Chat/ChatAdminMonitor";
import AIProvidersPanel from "../../components/AIProvidersPanel/AIProvidersPanel";

import {
  deleteRoomRecording,
  getRecordingFileUrl,
} from "../../services/recordingService";

import {
  formatBytes,
  getAllRecordings,
  getIntegrationConfig,
  getStorageInfo,
  saveIntegrationConfig,
  setStorageLimit,
  storageColor,
  type IntegrationConfig,
  type RecordingEntry,
  type StorageInfo,
} from "../../services/storageService";

// ── Aba de configuração do Chat ───────────────────────────────────────────────
function ChatConfigTab() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/chat/config").then((r) => setEnabled(r.data.chatGlobalHabilitado)).catch(() => setEnabled(true));
  }, []);

  async function toggle(val: boolean) {
    setSaving(true);
    try {
      // Reutiliza GlobalConfigController PUT /config/integrations
      // que aceita chaves genéricas e salva no global_config
      await api.put("/config/chat-toggle", { habilitado: val });
      setEnabled(val);
      setMsg(val ? "Chat habilitado para todos os usuários." : "Chat desabilitado globalmente.");
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setMsg("Erro ao salvar configuração.");
    } finally { setSaving(false); }
  }

  if (enabled === null) return null;

  return (
    <Stack gap="20px">
      <Alert color="blue" radius="xl" variant="light" icon={<IconInfoCircle size={16} />}>
        <Text fz="sm">
          Quando o chat estiver <b>desabilitado globalmente</b>, o balão de chat some para
          todos os usuários sem exceção. Cada funcionário externo ainda pode ter
          a aba do ISM habilitada/desabilitada individualmente no cadastro de funcionário.
        </Text>
      </Alert>

      <Paper p="20px" radius="16px"
        style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
        <Group justify="space-between" align="center">
          <Stack gap={2}>
            <Text fw={600} c="var(--text-primary)">Chat habilitado globalmente</Text>
            <Text fz="xs" c="var(--text-secondary)">
              Controla se o balão de chat aparece para todos os usuários da plataforma
            </Text>
          </Stack>
          <Switch
            checked={enabled}
            onChange={(e) => toggle(e.currentTarget.checked)}
            disabled={saving}
            size="md" color="violet"
            styles={{ label: { color: "var(--text-primary)" } }}
          />
        </Group>
      </Paper>

      {msg && (
        <Alert color="green" radius="xl" variant="light" icon={<IconCheck size={16} />}>
          {msg}
        </Alert>
      )}
    </Stack>
  );
}

// ── Barra de progresso de armazenamento ──────────────────────────────────────
function StorageBar({ info }: { info: StorageInfo }) {
  const color = storageColor(info.pct);
  const mc = color === "red" ? "red" : color === "yellow" ? "yellow" : "green";
  return (
    <Stack gap="6px">
      <Group justify="space-between">
        <Text fz="sm" c="var(--text-secondary)">
          {formatBytes(info.usedBytes)} utilizados de {formatBytes(info.limitBytes)}
        </Text>
        <Text fz="sm" fw={700} c={mc}>{info.pct}%</Text>
      </Group>
      <Progress value={info.pct} color={mc} radius="xl" size="lg" animated={info.pct < 100} />
      <Text fz="xs" c="var(--text-secondary)">
        {formatBytes(Math.max(0, info.limitBytes - info.usedBytes))} disponíveis
      </Text>
    </Stack>
  );
}

// ── Campo de chave com suporte a edição / limpeza ─────────────────────────────
function ApiKeyField({
  label, description, value, onChange, icon: Icon, placeholder,
}: {
  label: string; description?: string; value: string;
  onChange: (v: string) => void;
  icon: React.ElementType; placeholder?: string;
}) {
  const isMasked = value.startsWith("***");
  return (
    <Stack gap="4px">
      <Group gap="6px" align="center">
        <Icon size={15} color="var(--text-secondary)" />
        <Text fz="sm" fw={600} c="var(--text-primary)">{label}</Text>
        {isMasked && (
          <Badge variant="dot" color="green" size="xs">Configurada</Badge>
        )}
      </Group>
      {description && <Text fz="xs" c="var(--text-secondary)">{description}</Text>}
      <Group gap="sm">
        <PasswordInput
          placeholder={isMasked ? value : (placeholder || "Cole a chave aqui")}
          value={isMasked ? "" : value}
          onChange={(e) => onChange(e.currentTarget.value)}
          style={{ flex: 1 }}
          radius="xl" size="sm"
          styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } }}
        />
        {isMasked && (
          <Tooltip label="Redefinir chave" withArrow>
            <ActionIcon size="lg" radius="xl" variant="light" color="orange"
              onClick={() => onChange("")}>
              <IconX size={14} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Stack>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function AdminSettings() {

  /* ── Armazenamento ── */
  const [info, setInfo]             = useState<StorageInfo | null>(null);
  const [recordings, setRecordings] = useState<RecordingEntry[]>([]);
  const [limitValue, setLimitValue] = useState<number>(10);
  const [limitUnit, setLimitUnit]   = useState<"GB" | "MB">("GB");
  const [savingLimit, setSavingLimit] = useState(false);
  const [recSearch, setRecSearch]         = useState("");
  const [recPage, setRecPage]             = useState(1);
  const [recPageSize, setRecPageSize]     = useState("10");
  const [sizeFilter, setSizeFilter]       = useState<"all"|"small"|"medium"|"large">("all");

  /* ── Integrações ── */
  const [integrations, setIntegrations] = useState<IntegrationConfig>({
    sendgridKey: "", aiKey: "", mailFrom: "", aiActiveProvider: "", aiProviderKeys: {},
  });
  const [savingInt, setSavingInt] = useState(false);

  /* ── Mensagens ── */
  const [storMsg, setStorMsg] = useState("");
  const [storMsgType, setStorMsgType] = useState<"success" | "error">("success");
  const [intMsg, setIntMsg]   = useState("");
  const [intMsgType, setIntMsgType]   = useState<"success" | "error">("success");

  function showStorMsg(t: "success" | "error", txt: string) { setStorMsgType(t); setStorMsg(txt); setTimeout(() => setStorMsg(""), 3500); }
  function showIntMsg (t: "success" | "error", txt: string) { setIntMsgType(t);  setIntMsg(txt);  setTimeout(() => setIntMsg(""),  3500); }

  const inputStyles = {
    input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
    label: { color: "var(--text-primary)", marginBottom: 6 },
  };

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

  useEffect(() => {
    load();
    getIntegrationConfig()
      .then(setIntegrations)
      .catch(() => {});
  }, []);

  async function handleSaveLimit() {
    setSavingLimit(true);
    try {
      const bytes = limitUnit === "GB" ? limitValue * 1_073_741_824 : limitValue * 1_048_576;
      const updated = await setStorageLimit(bytes);
      setInfo(updated);
      showStorMsg("success", "Limite de armazenamento salvo!");
    } catch { showStorMsg("error", "Erro ao salvar o limite."); }
    finally { setSavingLimit(false); }
  }

  async function handleDeleteRec(recId: number) {
    if (!confirm("Excluir esta gravação permanentemente?")) return;
    await deleteRoomRecording(recId);
    setRecordings((p) => p.filter((r) => r.id !== recId));
    load();
  }

  async function handleSaveIntegrations() {
    setSavingInt(true);
    try {
      await saveIntegrationConfig(integrations);
      showIntMsg("success", "Configurações de integração salvas com sucesso!");
      // Recarrega para refletir as chaves mascaradas
      const updated = await getIntegrationConfig();
      setIntegrations(updated);
    } catch { showIntMsg("error", "Erro ao salvar as configurações."); }
    finally { setSavingInt(false); }
  }

  // Gravações filtradas e paginadas
  const pageSize = Number(recPageSize) || 10;
  const filteredRecs = recordings.filter((r) => {
    const bytes = r.fileSize ?? 0;
    const matchSearch = !recSearch.trim() || r.filename.toLowerCase().includes(recSearch.trim().toLowerCase());
    const matchSize =
      sizeFilter === "all"    ? true :
      sizeFilter === "small"  ? bytes < 1_048_576 :
      sizeFilter === "medium" ? bytes >= 1_048_576 && bytes < 10_485_760 :
      bytes >= 10_485_760;
    return matchSearch && matchSize;
  });
  const totalRecPages = Math.max(1, Math.ceil(filteredRecs.length / pageSize));
  const safePage      = Math.min(recPage, totalRecPages);
  const pagedRecs     = filteredRecs.slice((safePage - 1) * pageSize, safePage * pageSize);
  const totalSize     = recordings.reduce((s, r) => s + (r.fileSize ?? 0), 0);

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

      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>

        <Tabs defaultValue="storage" color="violet">
          <Tabs.List mb="xl">
            <Tabs.Tab value="storage" leftSection={<IconDatabase size={16} />}>
              Armazenamento de Gravações
            </Tabs.Tab>
            <Tabs.Tab value="integrations" leftSection={<IconKey size={16} />}>
              Integrações
            </Tabs.Tab>
            <Tabs.Tab value="chat" leftSection={<IconMessageChatbot size={16} />}>
              Chat
            </Tabs.Tab>
            <Tabs.Tab value="chat-monitor" leftSection={<IconMessages size={16} />}>
              Monitor de Chat
            </Tabs.Tab>
          </Tabs.List>

          {/* ── ABA 1: ARMAZENAMENTO ── */}
          <Tabs.Panel value="storage">
            <Stack gap="24px">

              {info && info.pct >= 90 && (
                <Alert color={info.pct >= 100 ? "red" : "yellow"} radius="xl" variant="light"
                  icon={<IconAlertTriangle size={18} />}>
                  {info.pct >= 100
                    ? <><Text fw={600}>Espaço crítico: 100% utilizado.</Text><Text fz="sm">Exclua gravações ou aumente o limite.</Text></>
                    : `Atenção: ${info.pct}% do espaço de gravações está sendo utilizado.`}
                </Alert>
              )}

              {info ? <StorageBar info={info} /> : <Text c="var(--text-secondary)" fz="sm">Carregando...</Text>}

              <Group align="flex-end" gap="sm">
                <NumberInput label="Limite de armazenamento" description="Espaço máximo para gravações de tela"
                  min={1} step={1} value={limitValue}
                  onChange={(v) => setLimitValue(Number(v) || 1)}
                  radius="xl" size="md" w={180} styles={inputStyles} />
                <Select
                  data={[{ value: "GB", label: "GB" }, { value: "MB", label: "MB" }]}
                  value={limitUnit} onChange={(v) => setLimitUnit((v ?? "GB") as "GB" | "MB")}
                  radius="xl" size="md" w={100} styles={inputStyles} />
                <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }}
                  loading={savingLimit} onClick={handleSaveLimit}>
                  Salvar limite
                </Button>
              </Group>

              {storMsg && (
                <Alert color={storMsgType === "success" ? "green" : "red"} radius="xl" variant="light"
                  icon={storMsgType === "success" ? <IconCheck size={16} /> : <IconX size={16} />}>
                  {storMsg}
                </Alert>
              )}

              {/* Lista de gravações */}
              <Stack gap="12px">
                <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                  <Group gap="sm">
                    <Text fw={700} c="var(--text-primary)">Gravações armazenadas</Text>
                    <Badge variant="light" color="violet" radius="xl">{recordings.length}</Badge>
                  </Group>
                  <Group gap="sm" wrap="wrap">
                    <Text fz="xs" c="var(--text-secondary)">Total: {formatBytes(totalSize)}</Text>
                    <TextInput
                      placeholder="Buscar por nome..."
                      leftSection={<IconSearch size={14} />}
                      rightSection={recSearch ? (
                        <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => { setRecSearch(""); setRecPage(1); }}>
                          <IconX size={12} />
                        </ActionIcon>
                      ) : null}
                      value={recSearch}
                      onChange={(e) => { setRecSearch(e.currentTarget.value); setRecPage(1); }}
                      radius="xl" size="sm" w={200}
                      styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } }}
                    />
                    <Select
                      placeholder="Tamanho"
                      value={sizeFilter}
                      onChange={(v) => { setSizeFilter((v ?? "all") as typeof sizeFilter); setRecPage(1); }}
                      data={[
                        { value: "all",    label: "Todos os tamanhos" },
                        { value: "small",  label: "< 1 MB" },
                        { value: "medium", label: "1 MB – 10 MB" },
                        { value: "large",  label: "> 10 MB" },
                      ]}
                      radius="xl" size="sm" w={160} clearable={false}
                      styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } }}
                    />
                  </Group>
                </Group>

                {pagedRecs.length === 0 ? (
                  <Text ta="center" c="var(--text-secondary)" py="xl">
                    {recSearch ? "Nenhuma gravação encontrada." : "Nenhuma gravação armazenada ainda."}
                  </Text>
                ) : (
                  <Table striped highlightOnHover
                    styles={{ th: { color: "var(--text-secondary)", background: "var(--app-bg)" }, td: { color: "var(--text-primary)" } }}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Arquivo</Table.Th>
                        <Table.Th>Tamanho</Table.Th>
                        <Table.Th>Duração</Table.Th>
                        <Table.Th>Data</Table.Th>
                        <Table.Th w={90}>Ações</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {pagedRecs.map((rec) => (
                        <Table.Tr key={rec.id}>
                          <Table.Td><Text fz="sm" truncate maw={300}>{rec.filename}</Text></Table.Td>
                          <Table.Td><Text fz="sm">{rec.fileSize ? formatBytes(rec.fileSize) : "—"}</Text></Table.Td>
                          <Table.Td>
                            <Text fz="sm">
                              {rec.durationSeconds != null
                                ? `${Math.floor(rec.durationSeconds / 60)}:${String(rec.durationSeconds % 60).padStart(2, "0")}`
                                : "—"}
                            </Text>
                          </Table.Td>
                          <Table.Td><Text fz="sm">{new Date(rec.createdAt).toLocaleString("pt-BR")}</Text></Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Tooltip label="Reproduzir" withArrow>
                                <ActionIcon size="sm" radius="xl" variant="light" color="violet"
                                  component="a" href={getRecordingFileUrl(rec.id)} target="_blank">
                                  <IconPlayerPlay size={12} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Excluir" withArrow>
                                <ActionIcon size="sm" radius="xl" variant="light" color="red"
                                  onClick={() => handleDeleteRec(rec.id)}>
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

                {/* Rodapé — mesmo padrão das listas do sistema */}
                <Group justify="space-between" mt="md">
                  <Pagination
                    value={safePage}
                    onChange={setRecPage}
                    total={totalRecPages}
                    radius="xl"
                  />
                  <Select
                    value={recPageSize}
                    onChange={(v) => { setRecPageSize(v || "10"); setRecPage(1); }}
                    data={["10", "20", "50", "100"]}
                    w={120}
                    radius="xl"
                    styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } }}
                  />
                </Group>
              </Stack>
            </Stack>
          </Tabs.Panel>

          {/* ── ABA 2: INTEGRAÇÕES ── */}
          <Tabs.Panel value="integrations">
            <Stack gap="24px">

              <Alert color="blue" radius="xl" variant="light" icon={<IconInfoCircle size={16} />}>
                <Text fz="sm">
                  As chaves salvas aqui têm <b>prioridade</b> sobre as variáveis de ambiente
                  do servidor (<code>application-local.properties</code>).
                  Chaves configuradas são mascaradas para exibição — clique no <b>×</b> para redefinir.
                </Text>
              </Alert>

              {/* SendGrid */}
              <Paper p="20px" radius="16px"
                style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                <Stack gap="16px">
                  <Group gap="sm">
                    <IconSend size={20} color="#1a82e2" />
                    <Text fw={700} c="var(--text-primary)">SendGrid — E-mail transacional</Text>
                  </Group>

                  <ApiKeyField
                    label="API Key"
                    description="Encontre em SendGrid → Settings → API Keys. Começa com SG."
                    value={integrations.sendgridKey}
                    onChange={(v) => setIntegrations((p) => ({ ...p, sendgridKey: v }))}
                    icon={IconKey}
                    placeholder="SG.xxxxxxxxxxxxx"
                  />

                  <TextInput
                    label="E-mail remetente (verificado no SendGrid)"
                    description="Deve ser um remetente verificado em SendGrid → Settings → Sender Authentication"
                    placeholder="seuemail@dominio.com"
                    value={integrations.mailFrom}
                    onChange={(e) => setIntegrations((p) => ({ ...p, mailFrom: e.currentTarget.value }))}
                    leftSection={<IconMail size={14} />}
                    radius="xl" size="sm"
                    styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }, label: { color: "var(--text-primary)", marginBottom: 4 }, description: { color: "var(--text-secondary)" } }}
                  />
                </Stack>
              </Paper>

              {/* Multi-provedor de IA */}
              <Paper p="20px" radius="16px"
                style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                <Stack gap="16px">
                  <Group gap="sm">
                    <IconRobot size={20} color="#7c3aed" />
                    <Text fw={700} c="var(--text-primary)">Inteligência Artificial — Geração de conteúdo</Text>
                  </Group>
                  <Text fz="xs" c="var(--text-secondary)">
                    Configure quantos provedores quiser. A prioridade é: chave do <strong>usuário</strong> → chave da <strong>empresa</strong> → chave aqui das <strong>Configurações</strong>.
                  </Text>

                  <AIProvidersPanel
                    showLocalProviders
                    activeProvider={integrations.aiActiveProvider}
                    providerKeys={integrations.aiProviderKeys as Record<string, string>}
                    onActiveProviderChange={(v) => setIntegrations((p) => ({ ...p, aiActiveProvider: v }))}
                    onProviderKeyChange={(provider, value) =>
                      setIntegrations((p) => ({
                        ...p,
                        aiProviderKeys: { ...p.aiProviderKeys, [provider]: value },
                      }))
                    }
                  />
                </Stack>
              </Paper>

              {intMsg && (
                <Alert color={intMsgType === "success" ? "green" : "red"} radius="xl" variant="light"
                  icon={intMsgType === "success" ? <IconCheck size={16} /> : <IconX size={16} />}>
                  {intMsg}
                </Alert>
              )}

              <Group justify="flex-end">
                <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }}
                  loading={savingInt} onClick={handleSaveIntegrations}>
                  Salvar integrações
                </Button>
              </Group>

            </Stack>
          </Tabs.Panel>

          {/* ── ABA CHAT ── */}
          <Tabs.Panel value="chat">
            <ChatConfigTab />
          </Tabs.Panel>

          {/* ── ABA MONITOR DE CHAT ── */}
          <Tabs.Panel value="chat-monitor">
            <ChatAdminMonitor />
          </Tabs.Panel>

        </Tabs>
      </Paper>
    </Stack>
  );
}
