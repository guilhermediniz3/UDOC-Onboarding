import {
  ActionIcon, Badge, Group, Loader, Pagination,
  Select, Stack, Table, Text, TextInput, Tooltip,
} from "@mantine/core";
import { IconInfoCircle, IconSearch, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import type { AuditLogEntry } from "../../services/auditoriaService";
import { getAuditoriaSistema } from "../../services/auditoriaService";

const ACTION_COLORS: Record<string, string> = {
  CREATED: "green", UPDATED: "blue", DELETED: "red",
};

const ACTION_OPTIONS = [
  { value: "",        label: "Todas as ações" },
  { value: "CREATED", label: "Criação" },
  { value: "UPDATED", label: "Edição" },
  { value: "DELETED", label: "Exclusão" },
];

export default function AbaSistema() {
  const [module, setModule]           = useState("");
  const [action, setAction]           = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [startDate, setStartDate]     = useState("");
  const [endDate, setEndDate]         = useState("");
  const [logs, setLogs]               = useState<AuditLogEntry[]>([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [expandido, setExpandido]     = useState<number | null>(null);

  useEffect(() => { carregar(); }, [module, action, performedBy, startDate, endDate, page]);

  async function carregar() {
    setLoading(true);
    try {
      const r = await getAuditoriaSistema({
        module:      module      || undefined,
        action:      action      || undefined,
        performedBy: performedBy || undefined,
        startDate:   startDate   || undefined,
        endDate:     endDate     || undefined,
        page: page - 1, size: 30,
      });
      setLogs(r.content);
      setTotal(r.totalElements);
      setTotalPages(r.totalPages);
    } catch {} finally { setLoading(false); }
  }

  const inputSm = { input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } };

  return (
    <Stack gap="16px">
      {/* Filtros */}
      <Group gap="sm" wrap="wrap">
        <TextInput placeholder="Módulo..." leftSection={<IconSearch size={14} />}
          rightSection={module ? <ActionIcon size="xs" variant="subtle" onClick={() => { setModule(""); setPage(1); }}><IconX size={12} /></ActionIcon> : null}
          value={module} onChange={(e) => { setModule(e.currentTarget.value); setPage(1); }}
          radius="xl" size="sm" w={160} styles={inputSm} />
        <Select value={action || ""} onChange={(v) => { setAction(v ?? ""); setPage(1); }}
          data={ACTION_OPTIONS} w={160} radius="xl" size="sm" styles={inputSm} />
        <TextInput placeholder="Usuário..." leftSection={<IconSearch size={14} />}
          rightSection={performedBy ? <ActionIcon size="xs" variant="subtle" onClick={() => { setPerformedBy(""); setPage(1); }}><IconX size={12} /></ActionIcon> : null}
          value={performedBy} onChange={(e) => { setPerformedBy(e.currentTarget.value); setPage(1); }}
          radius="xl" size="sm" w={200} styles={inputSm} />
        <TextInput type="date" placeholder="Data início"
          value={startDate} onChange={(e) => { setStartDate(e.currentTarget.value); setPage(1); }}
          radius="xl" size="sm" w={150} styles={inputSm} />
        <TextInput type="date" placeholder="Data fim"
          value={endDate} onChange={(e) => { setEndDate(e.currentTarget.value); setPage(1); }}
          radius="xl" size="sm" w={150} styles={inputSm} />
        <Text fz="xs" c="var(--text-secondary)" style={{ marginLeft: "auto", alignSelf: "center" }}>
          {total} registro{total !== 1 ? "s" : ""}
        </Text>
      </Group>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 32 }}><Loader size="sm" color="violet" /></div>
      ) : logs.length === 0 ? (
        <Text ta="center" c="var(--text-secondary)" fz="sm" py="xl">Nenhum registro encontrado.</Text>
      ) : (
        <Table striped highlightOnHover
          styles={{ th: { color: "var(--text-secondary)", background: "var(--app-bg)" }, td: { color: "var(--text-primary)" } }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Data/Hora</Table.Th>
              <Table.Th>Módulo</Table.Th>
              <Table.Th>Ação</Table.Th>
              <Table.Th>Alvo</Table.Th>
              <Table.Th>Usuário</Table.Th>
              <Table.Th w={40}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {logs.map((log) => (
              <>
                <Table.Tr key={log.id}>
                  <Table.Td>
                    <Text fz="xs">{new Date(log.timestamp).toLocaleString("pt-BR")}</Text>
                  </Table.Td>
                  <Table.Td>
                    {log.module
                      ? <Badge size="xs" variant="light" color="violet">{log.module}</Badge>
                      : <Text fz="xs" c="var(--text-secondary)">—</Text>}
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" color={ACTION_COLORS[log.action] ?? "gray"} variant="light">
                      {log.action}
                    </Badge>
                  </Table.Td>
                  <Table.Td><Text fz="xs" truncate maw={200}>{log.target}</Text></Table.Td>
                  <Table.Td><Text fz="xs">{log.performedBy ?? "—"}</Text></Table.Td>
                  <Table.Td>
                    {log.details && (
                      <Tooltip label={expandido === log.id ? "Fechar" : "Ver detalhes"} withArrow>
                        <ActionIcon size="xs" radius="xl" variant="subtle" color="gray"
                          onClick={() => setExpandido(expandido === log.id ? null : log.id)}>
                          <IconInfoCircle size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Table.Td>
                </Table.Tr>
                {expandido === log.id && log.details && (
                  <Table.Tr key={`${log.id}-detail`}>
                    <Table.Td colSpan={6}>
                      <Text fz="xs" c="var(--text-secondary)" p="xs"
                        style={{ background: "var(--app-bg)", borderRadius: 8, fontFamily: "monospace" }}>
                        {log.details}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {totalPages > 1 && <Pagination value={page} onChange={setPage} total={totalPages} radius="xl" size="sm" />}
    </Stack>
  );
}
