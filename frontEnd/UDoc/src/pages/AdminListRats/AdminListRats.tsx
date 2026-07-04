import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import {
  IconCheck,
  IconDownload,
  IconFileText,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getRats, deleteRat } from "../../services/ratService";
import { getAllCompaniesSimple } from "../../services/companyService";
import { getAllIsmsSimple } from "../../services/ismService";

import type { Rat } from "../../types/Rat";
import type { Company } from "../../types/Company";
import type { ISM } from "../../types/ISM";

const inputStyles = {
  input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
  label: { color: "var(--text-primary)", marginBottom: 6 },
};

function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent ?? tmp.innerText ?? "";
}

export default function AdminListRats() {
  const navigate = useNavigate();

  const [rats, setRats] = useState<Rat[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [ismsData, setIsmsData] = useState<ISM[]>([]);

  const [filterCompany, setFilterCompany] = useState<string | null>(null);
  const [filterIsm, setFilterIsm] = useState<string | null>(null);
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");

  const SIZE = 10;

  useEffect(() => {
    getAllCompaniesSimple().then(setCompanies).catch((e) => console.error("[AdminListRats] companies:", e?.response?.status, e?.message));
    getAllIsmsSimple().then(setIsmsData).catch((e) => console.error("[AdminListRats] ISMs:", e?.response?.status, e?.message));
  }, []);

  useEffect(() => { load(); }, [page, filterCompany, filterIsm, filterDataInicio, filterDataFim]);

  async function load() {
    setLoading(true);
    try {
      const result = await getRats({
        page,
        size: SIZE,
        companyId: filterCompany ? Number(filterCompany) : null,
        ismId: filterIsm ? Number(filterIsm) : null,
        dataInicio: filterDataInicio || undefined,
        dataFim: filterDataFim || undefined,
      });
      setRats(result.content);
      setTotal(result.totalElements);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || "Erro desconhecido";
      console.error("[AdminListRats] load() falhou:", status, msg, err);
      showMsg("error", `Erro ao carregar RATs (${status ?? "rede"}): ${msg}`);
    } finally { setLoading(false); }
  }

  function showMsg(type: "success" | "error", text: string) {
    setMsg({ type, text }); setTimeout(() => setMsg(null), 4000);
  }

  async function handleDelete(id: number, titulo: string) {
    if (!confirm(`Excluir o RAT "${titulo}"?`)) return;
    try {
      await deleteRat(id);
      showMsg("success", "RAT excluído.");
      load();
    } catch {
      showMsg("error", "Erro ao excluir o RAT.");
    }
  }

  function handleDownloadTxt(rat: Rat) {
    const texto = stripHtml(rat.conteudo ?? "");
    const blob = new Blob([`${rat.titulo}\n${new Date(rat.dataCriacao).toLocaleString("pt-BR")}\n\n${texto}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rat-${rat.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadPdf(rat: Rat) {
    const html2pdf = (await import("html2pdf.js")).default;

    // ID único para escopo do CSS — evita afetar o resto da página
    const scopeId = `rat-pdf-${Date.now()}`;
    const el = document.createElement("div");
    el.id = scopeId;
    // Posicionado fora da tela para que o html2canvas resolva os estilos no DOM
    el.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:#ffffff;font-family:Arial,sans-serif;padding:20px;";

    el.innerHTML = `
      <style>
        #${scopeId} * { color: #111111 !important; background-color: transparent !important; }
        #${scopeId} h2, #${scopeId} h3 { font-weight: bold; margin: 0.8em 0 0.3em; }
        #${scopeId} ul { padding-left: 1.4em; }
      </style>
      <h2 style="margin-bottom:4px">${rat.titulo}</h2>
      <p style="color:#555555;margin-bottom:4px">
        Sala: ${rat.trainingRoomTitle ?? "—"} &nbsp;|&nbsp;
        ISM: ${rat.ismName ?? "—"} &nbsp;|&nbsp;
        Empresa: ${rat.companyName ?? "—"}
      </p>
      <p style="color:#555555;margin-bottom:20px">
        Data: ${new Date(rat.dataCriacao).toLocaleString("pt-BR")}
      </p>
      ${rat.conteudo ?? ""}
    `;

    document.body.appendChild(el);

    try {
      await html2pdf().set({
        margin: [15, 15, 15, 15],
        filename: `rat-${rat.id}.pdf`,
        html2canvas: { scale: 2, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(el).save();
    } finally {
      document.body.removeChild(el);
    }
  }

  const totalPages = Math.ceil(total / SIZE);

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      {/* Header */}
      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} c="var(--text-primary)">Meus RATs</Title>
            <Text c="var(--text-secondary)" mt={4}>Relatórios de Atendimento Técnico salvos</Text>
          </div>
        </Group>
      </Paper>

      {msg && (
        <Alert
          color={msg.type === "success" ? "green" : "red"}
          icon={msg.type === "success" ? <IconCheck size={18} /> : <IconX size={18} />}
          radius="xl"
        >
          {msg.text}
        </Alert>
      )}

      {/* Filtros */}
      <Paper p="20px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
        <Group gap="md" align="flex-end" wrap="wrap">
          <Select
            label="Empresa"
            placeholder="Todas"
            clearable
            searchable
            radius="xl"
            size="sm"
            style={{ minWidth: 200 }}
            data={companies.map((c) => ({ value: String(c.id), label: c.name }))}
            value={filterCompany}
            onChange={(v) => { setFilterCompany(v); setPage(0); }}
            styles={inputStyles}
          />
          <Select
            label="ISM"
            placeholder="Todos"
            clearable
            searchable
            radius="xl"
            size="sm"
            style={{ minWidth: 200 }}
            data={ismsData.map((i) => ({ value: String(i.id), label: i.name }))}
            value={filterIsm}
            onChange={(v) => { setFilterIsm(v); setPage(0); }}
            styles={inputStyles}
          />
          <div>
            <Text fz="sm" c="var(--text-primary)" mb={6}>Data início</Text>
            <input
              type="date"
              value={filterDataInicio}
              onChange={(e) => { setFilterDataInicio(e.currentTarget.value); setPage(0); }}
              style={{
                padding: "7px 14px", borderRadius: 20, border: "1px solid var(--border-color)",
                background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, outline: "none",
              }}
            />
          </div>
          <div>
            <Text fz="sm" c="var(--text-primary)" mb={6}>Data fim</Text>
            <input
              type="date"
              value={filterDataFim}
              onChange={(e) => { setFilterDataFim(e.currentTarget.value); setPage(0); }}
              style={{
                padding: "7px 14px", borderRadius: 20, border: "1px solid var(--border-color)",
                background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, outline: "none",
              }}
            />
          </div>
          <Button
            size="sm" radius="xl" variant="light" color="violet"
            leftSection={<IconSearch size={14} />}
            onClick={() => { setPage(0); load(); }}
          >
            Buscar
          </Button>
        </Group>
      </Paper>

      {/* Tabela */}
      <Paper p="20px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
        {loading ? (
          <Group justify="center" py="xl"><Loader size="md" color="violet" /></Group>
        ) : rats.length === 0 ? (
          <Text c="var(--text-secondary)" ta="center" py="xl">Nenhum RAT encontrado.</Text>
        ) : (
          <Stack gap="md">
            <div style={{ overflowX: "auto" }}>
              <Table verticalSpacing="md" horizontalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th c="var(--text-primary)">Título</Table.Th>
                    <Table.Th c="var(--text-primary)">Sala</Table.Th>
                    <Table.Th c="var(--text-primary)">ISM</Table.Th>
                    <Table.Th c="var(--text-primary)">Empresa</Table.Th>
                    <Table.Th c="var(--text-primary)">Data</Table.Th>
                    <Table.Th c="var(--text-primary)">Ações</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rats.map((rat) => (
                    <Table.Tr key={rat.id}>
                      <Table.Td>
                        <Text fw={600} fz="sm" c="var(--text-primary)">{rat.titulo}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fz="sm" c="var(--text-secondary)">{rat.trainingRoomTitle ?? "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        {rat.ismName
                          ? <Badge variant="light" color="violet" radius="xl">{rat.ismName}</Badge>
                          : <Text fz="sm" c="var(--text-secondary)">—</Text>}
                      </Table.Td>
                      <Table.Td>
                        <Text fz="sm" c="var(--text-secondary)">{rat.companyName ?? "—"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fz="sm" c="var(--text-secondary)">
                          {new Date(rat.dataCriacao).toLocaleString("pt-BR")}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Button
                            size="xs" radius="xl" variant="light" color="red"
                            leftSection={<IconDownload size={12} />}
                            onClick={() => handleDownloadPdf(rat)}
                          >
                            PDF
                          </Button>
                          <Button
                            size="xs" radius="xl" variant="light" color="blue"
                            leftSection={<IconFileText size={12} />}
                            onClick={() => handleDownloadTxt(rat)}
                          >
                            TXT
                          </Button>
                          <Button
                            size="xs" radius="xl" variant="light" color="gray"
                            leftSection={<IconTrash size={12} />}
                            onClick={() => handleDelete(rat.id, rat.titulo)}
                          >
                            Excluir
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            {/* Paginação simples */}
            {totalPages > 1 && (
              <Group justify="center" gap="sm">
                <Button size="xs" radius="xl" variant="light" disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}>
                  ← Anterior
                </Button>
                <Text fz="sm" c="var(--text-secondary)">
                  Página {page + 1} de {totalPages}
                </Text>
                <Button size="xs" radius="xl" variant="light" disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}>
                  Próxima →
                </Button>
              </Group>
            )}
          </Stack>
        )}
      </Paper>

    </Stack>
  );
}
