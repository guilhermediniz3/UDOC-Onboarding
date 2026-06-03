import {
  ActionIcon, Badge, Group, Loader, Pagination,
  ScrollArea, Select, Stack, Text, Tooltip,
} from "@mantine/core";
import { IconArrowLeft, IconEye } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { getAllIsmsSimple } from "../../services/ismService";
import type { ISM } from "../../types/ISM";
import type { ChatConversa, ChatMensagem } from "../../services/chatApiService";
import { getAdminConversa, getAdminConversas } from "../../services/chatApiService";

const STATUS_OPTIONS = [
  { value: "",           label: "Todos os status" },
  { value: "ABERTA",     label: "Abertas" },
  { value: "ENCERRADA",  label: "Encerradas" },
];

const TIPO_COR: Record<string, string> = {
  CLIENTE:  "linear-gradient(135deg,#7c3aed,#2563eb)",
  ISM:      "linear-gradient(135deg,#059669,#0284c7)",
  IA:       "linear-gradient(135deg,#d97706,#b45309)",
  SISTEMA:  "transparent",
};
const TIPO_TEXT: Record<string, string> = {
  CLIENTE: "#fff", ISM: "#fff", IA: "#fff", SISTEMA: "#16a34a",
};

function Mensagem({ m }: { m: ChatMensagem }) {
  const isCliente = m.tipo === "CLIENTE";
  const isSistema = m.tipo === "SISTEMA";
  return (
    <div style={{
      alignSelf: isCliente ? "flex-end" : isSistema ? "center" : "flex-start",
      maxWidth: isSistema ? "90%" : "78%",
    }}>
      {!isCliente && !isSistema && (
        <Text fz="xs" fw={700} mb={2} c="var(--text-secondary)"
          style={{ paddingLeft: 4 }}>
          {m.tipo === "ISM" ? "ISM" : "IA"}
        </Text>
      )}
      <div style={{
        background: TIPO_COR[m.tipo] ?? "var(--app-bg)",
        color: TIPO_TEXT[m.tipo] ?? "var(--text-primary)",
        padding: "8px 12px", borderRadius: 14,
        fontSize: 13, lineHeight: 1.6,
        border: (!isCliente && !isSistema) ? "1px solid var(--border-color)" : "none",
        fontStyle: isSistema ? "italic" : "normal",
      }}>
        {m.conteudo}
      </div>
      <Text fz="10px" c="var(--text-secondary)" ta={isCliente ? "right" : "left"}
        mt={2} style={{ paddingLeft: 4 }}>
        {new Date(m.dataHora).toLocaleString("pt-BR")}
      </Text>
    </div>
  );
}

export default function ChatAdminMonitor() {
  const [ismsData, setIsmsData]         = useState<ISM[]>([]);
  const [ismFiltro, setIsmFiltro]       = useState<string>("");
  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [conversas, setConversas]       = useState<ChatConversa[]>([]);
  const [total, setTotal]               = useState(0);
  const [totalPages, setTotalPages]     = useState(1);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(false);
  const [detalhe, setDetalhe]           = useState<ChatConversa | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  useEffect(() => {
    getAllIsmsSimple().then(setIsmsData).catch(() => {});
  }, []);

  useEffect(() => {
    carregar();
  }, [ismFiltro, statusFiltro, page]);

  async function carregar() {
    setLoading(true);
    try {
      const res = await getAdminConversas({
        ismId:  ismFiltro  ? Number(ismFiltro)  : undefined,
        status: statusFiltro || undefined,
        page:   page - 1,
        size:   15,
      });
      setConversas(res.content);
      setTotal(res.totalElements);
      setTotalPages(res.totalPages);
    } catch {}
    finally { setLoading(false); }
  }

  async function abrirDetalhe(id: number) {
    setLoadingDetalhe(true);
    try { setDetalhe(await getAdminConversa(id)); }
    catch {} finally { setLoadingDetalhe(false); }
  }

  const inputStyles = {
    input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
  };

  // ── Detalhe da conversa ────────────────────────────────────────────────────
  if (detalhe) {
    return (
      <Stack gap="12px" style={{ height: "100%" }}>
        <Group gap="sm" align="center">
          <ActionIcon variant="light" radius="xl" onClick={() => setDetalhe(null)}>
            <IconArrowLeft size={16} />
          </ActionIcon>
          <Stack gap={0}>
            <Text fw={700} fz="sm" c="var(--text-primary)">
              {detalhe.clienteNome} → {detalhe.ismNome ?? "Sem ISM"}
            </Text>
            <Text fz="xs" c="var(--text-secondary)">
              {new Date(detalhe.criadaEm).toLocaleString("pt-BR")}
              {" · "}
              <Badge size="xs" color={detalhe.status === "ABERTA" ? "green" : "gray"} variant="light">
                {detalhe.status}
              </Badge>
            </Text>
          </Stack>
        </Group>

        {loadingDetalhe ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 32 }}>
            <Loader size="sm" color="violet" />
          </div>
        ) : (
          <ScrollArea style={{ flex: 1 }} scrollbarSize={4}>
            <Stack gap="sm" style={{ paddingBottom: 8 }}>
              {(detalhe.mensagens ?? []).length === 0 ? (
                <Text ta="center" c="var(--text-secondary)" fz="sm" py="xl">
                  Nenhuma mensagem nesta conversa.
                </Text>
              ) : (
                (detalhe.mensagens ?? []).map((m) => (
                  <Mensagem key={m.id} m={m} />
                ))
              )}
            </Stack>
          </ScrollArea>
        )}
      </Stack>
    );
  }

  // ── Lista de conversas ─────────────────────────────────────────────────────
  return (
    <Stack gap="16px">
      <Group gap="xs" wrap="wrap">
        <Select
          placeholder="Todos os ISMs"
          clearable
          searchable
          value={ismFiltro || null}
          onChange={(v) => { setIsmFiltro(v ?? ""); setPage(1); }}
          data={ismsData.map((i) => ({ value: String(i.id), label: i.name }))}
          style={{ flex: 1, minWidth: 130 }} radius="xl" size="xs"
          styles={inputStyles}
        />
        <Select
          value={statusFiltro || ""}
          onChange={(v) => { setStatusFiltro(v ?? ""); setPage(1); }}
          data={STATUS_OPTIONS}
          style={{ flex: 1, minWidth: 110 }} radius="xl" size="xs"
          styles={inputStyles}
        />
        <Text fz="xs" c="var(--text-secondary)" style={{ whiteSpace: "nowrap", alignSelf: "center" }}>
          {total} conv.
        </Text>
      </Group>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 24 }}>
          <Loader size="sm" color="violet" />
        </div>
      ) : conversas.length === 0 ? (
        <Text ta="center" c="var(--text-secondary)" fz="sm" py="xl">
          Nenhuma conversa encontrada.
        </Text>
      ) : (
        <Stack gap="6px">
          {conversas.map((c) => (
            <div
              key={c.id}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                background: "var(--app-bg)",
                border: "1px solid var(--border-color)",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,58,237,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--app-bg)")}
              onClick={() => abrirDetalhe(c.id)}
            >
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs">
                    <Text fz="sm" fw={600} c="var(--text-primary)" truncate>
                      {c.clienteNome}
                    </Text>
                    <Text fz="xs" c="var(--text-secondary)">→</Text>
                    <Text fz="xs" c="var(--text-secondary)" truncate>
                      {c.ismNome ?? "Sem ISM"}
                    </Text>
                  </Group>
                  <Text fz="xs" c="var(--text-secondary)">
                    {new Date(c.criadaEm).toLocaleString("pt-BR")}
                  </Text>
                </Stack>
                <Group gap="xs" style={{ flexShrink: 0 }}>
                  <Badge
                    size="xs"
                    color={c.status === "ABERTA" ? "green" : "gray"}
                    variant="light"
                  >
                    {c.status}
                  </Badge>
                  {c.naoLidas > 0 && (
                    <Badge size="xs" color="red" radius="xl">{c.naoLidas}</Badge>
                  )}
                  <Tooltip label="Ver mensagens" withArrow>
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

      {totalPages > 1 && (
        <Pagination
          value={page}
          onChange={setPage}
          total={totalPages}
          radius="xl"
          size="sm"
        />
      )}
    </Stack>
  );
}
