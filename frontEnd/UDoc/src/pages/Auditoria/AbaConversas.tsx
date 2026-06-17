import {
  ActionIcon, Badge, Group, Loader, Pagination,
  ScrollArea, Select, Stack, Text, TextInput, Tooltip,
} from "@mantine/core";
import { IconArrowLeft, IconEye, IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getAllIsmsSimple } from "../../services/ismService";
import type { ISM } from "../../types/ISM";
import type { ConversaDetalhe, ConversaResumo, MensagemDetalhe } from "../../services/auditoriaService";
import { getAuditoriaConversa, getAuditoriaConversas } from "../../services/auditoriaService";

const STATUS_OPTIONS = [
  { value: "",          label: "Todos os status" },
  { value: "ABERTA",    label: "Abertas" },
  { value: "ENCERRADA", label: "Encerradas" },
];

const TIPO_BG: Record<string, string> = {
  CLIENTE: "linear-gradient(135deg,#7c3aed,#2563eb)",
  ISM:     "linear-gradient(135deg,#059669,#0284c7)",
  IA:      "linear-gradient(135deg,#d97706,#b45309)",
  SISTEMA: "transparent",
};
const TIPO_COLOR: Record<string, string> = {
  CLIENTE: "#fff", ISM: "#fff", IA: "#fff", SISTEMA: "#16a34a",
};

function MsgBubble({ m, clienteNome: _clienteNome, ismNome }: { m: MensagemDetalhe; clienteNome: string; ismNome?: string }) {
  const isCliente = m.tipo === "CLIENTE";
  const isSistema = m.tipo === "SISTEMA";
  return (
    <div style={{ alignSelf: isCliente ? "flex-end" : isSistema ? "center" : "flex-start", maxWidth: isSistema ? "90%" : "78%" }}>
      {!isCliente && !isSistema && (
        <Text fz="10px" fw={700} c="var(--text-secondary)" mb={2} style={{ paddingLeft: 4 }}>
          {m.tipo === "ISM" ? (ismNome ?? "ISM") : "Assistente IA"}
        </Text>
      )}
      <div style={{
        background: TIPO_BG[m.tipo] ?? "var(--app-bg)",
        color: TIPO_COLOR[m.tipo] ?? "var(--text-primary)",
        padding: "8px 12px", borderRadius: 14, fontSize: 13, lineHeight: 1.6,
        border: (!isCliente && !isSistema) ? "1px solid var(--border-color)" : "none",
        fontStyle: isSistema ? "italic" : "normal",
      }}>
        {m.conteudo}
      </div>
      <Text fz="10px" c="var(--text-secondary)" ta={isCliente ? "right" : "left"} mt={2} style={{ paddingLeft: 4 }}>
        {new Date(m.dataHora).toLocaleString("pt-BR")}
      </Text>
    </div>
  );
}

export default function AbaConversas() {
  const [ismsData, setIsmsData]     = useState<ISM[]>([]);
  const [ismFiltro, setIsmFiltro]   = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [conversas, setConversas]   = useState<ConversaResumo[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [detalhe, setDetalhe]       = useState<ConversaDetalhe | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [busca, setBusca]           = useState("");

  useEffect(() => { getAllIsmsSimple().then(setIsmsData).catch(() => {}); }, []);
  useEffect(() => { carregar(); }, [ismFiltro, statusFiltro, page]);

  async function carregar() {
    setLoading(true);
    try {
      const r = await getAuditoriaConversas({
        ismId:  ismFiltro ? Number(ismFiltro) : undefined,
        status: statusFiltro || undefined,
        page: page - 1, size: 20,
      });
      setConversas(r.content);
      setTotal(r.totalElements);
      setTotalPages(r.totalPages);
    } catch {} finally { setLoading(false); }
  }

  async function abrirDetalhe(id: number) {
    setLoadingDetalhe(true); setBusca("");
    try { setDetalhe(await getAuditoriaConversa(id)); }
    catch {} finally { setLoadingDetalhe(false); }
  }

  const inputSm = { input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } };

  const mensagensFiltradas = detalhe
    ? detalhe.mensagens.filter(m =>
        !busca.trim() || m.conteudo.toLowerCase().includes(busca.trim().toLowerCase()))
    : [];

  // ── Detalhe da conversa ──────────────────────────────────────────────────
  if (detalhe) {
    return (
      <Stack gap="12px">
        <Group gap="sm" align="center">
          <ActionIcon variant="light" radius="xl" onClick={() => setDetalhe(null)}>
            <IconArrowLeft size={16} />
          </ActionIcon>
          <Stack gap={0}>
            <Text fw={700} fz="sm" c="var(--text-primary)">
              {detalhe.clienteNome} → {detalhe.ismNome ?? "Sem ISM"}
            </Text>
            <Group gap="xs">
              <Text fz="xs" c="var(--text-secondary)">{new Date(detalhe.criadaEm).toLocaleString("pt-BR")}</Text>
              <Badge size="xs" color={detalhe.status === "ABERTA" ? "green" : "gray"} variant="light">{detalhe.status}</Badge>
              <Text fz="xs" c="var(--text-secondary)">{detalhe.mensagens.length} mensagens</Text>
            </Group>
          </Stack>
        </Group>

        <TextInput
          placeholder="Buscar por texto na conversa..."
          leftSection={<IconSearch size={14} />}
          rightSection={busca ? <ActionIcon size="xs" variant="subtle" onClick={() => setBusca("")}><IconX size={12} /></ActionIcon> : null}
          value={busca} onChange={(e) => setBusca(e.currentTarget.value)}
          radius="xl" size="sm" styles={inputSm}
        />

        {loadingDetalhe ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Loader size="sm" color="violet" /></div>
        ) : (
          <ScrollArea h={480} scrollbarSize={4}>
            <Stack gap="sm" pb="sm">
              {mensagensFiltradas.length === 0 ? (
                <Text ta="center" c="var(--text-secondary)" fz="sm" py="xl">
                  {busca ? "Nenhuma mensagem encontrada." : "Sem mensagens."}
                </Text>
              ) : mensagensFiltradas.map((m) => (
                <MsgBubble key={m.id} m={m} clienteNome={detalhe.clienteNome} ismNome={detalhe.ismNome} />
              ))}
            </Stack>
          </ScrollArea>
        )}
      </Stack>
    );
  }

  // ── Lista de conversas ────────────────────────────────────────────────────
  return (
    <Stack gap="16px">
      <Group gap="sm" wrap="wrap">
        <Select placeholder="Todos os ISMs" clearable searchable
          value={ismFiltro || null} onChange={(v) => { setIsmFiltro(v ?? ""); setPage(1); }}
          data={ismsData.map((i) => ({ value: String(i.id), label: i.name }))}
          w={220} radius="xl" size="sm" styles={inputSm} />
        <Select value={statusFiltro || ""} onChange={(v) => { setStatusFiltro(v ?? ""); setPage(1); }}
          data={STATUS_OPTIONS} w={170} radius="xl" size="sm" styles={inputSm} />
        <Text fz="xs" c="var(--text-secondary)" style={{ marginLeft: "auto", alignSelf: "center" }}>
          {total} conversa{total !== 1 ? "s" : ""}
        </Text>
      </Group>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Loader size="sm" color="violet" /></div>
      ) : conversas.length === 0 ? (
        <Text ta="center" c="var(--text-secondary)" fz="sm" py="xl">Nenhuma conversa encontrada.</Text>
      ) : (
        <Stack gap="6px">
          {conversas.map((c) => (
            <div key={c.id} onClick={() => abrirDetalhe(c.id)}
              style={{ padding: "12px 16px", borderRadius: 12, background: "var(--app-bg)",
                border: "1px solid var(--border-color)", cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,58,237,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--app-bg)")}>
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs">
                    <Text fz="sm" fw={600} c="var(--text-primary)" truncate>{c.clienteNome}</Text>
                    <Text fz="xs" c="var(--text-secondary)">→</Text>
                    <Text fz="xs" c="var(--text-secondary)" truncate>{c.ismNome ?? "Sem ISM"}</Text>
                  </Group>
                  <Text fz="xs" c="var(--text-secondary)">{new Date(c.criadaEm).toLocaleString("pt-BR")}</Text>
                </Stack>
                <Group gap="xs" style={{ flexShrink: 0 }}>
                  <Badge size="xs" color={c.status === "ABERTA" ? "green" : "gray"} variant="light">{c.status}</Badge>
                  <Tooltip label="Ver conversa" withArrow>
                    <ActionIcon size="sm" radius="xl" variant="light" color="violet">
                      <IconEye size={13} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </div>
          ))}
        </Stack>
      )}

      {totalPages > 1 && <Pagination value={page} onChange={setPage} total={totalPages} radius="xl" size="sm" />}
    </Stack>
  );
}
