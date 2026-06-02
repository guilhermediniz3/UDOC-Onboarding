import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Collapse,
  Group,
  Modal,
  Paper,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

import {
  IconBuilding,
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconFilter,
  IconGripVertical,
  IconPlus,
  IconTrash,
  IconUser,
  IconX,
} from "@tabler/icons-react";

// PDF
import html2pdf from "html2pdf.js";

// Excel
import * as XLSX from "xlsx";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  deleteTrail,
  getTrails,
  swapTrailOrder,
} from "../../services/trailService";

import {
  getKanbanData,
  type KanbanCompanyEntry,
} from "../../services/trainingService";

import { getAllCompaniesSimple } from "../../services/companyService";
import { getEmployees } from "../../services/employeeService";

import type { Trail } from "../../types/Trail";
import type { Company } from "../../types/Company";
import type { Employee } from "../../types/Employee";

/* ── Ícone de conclusão (círculo verde com check) ── */
function DoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ display: "inline", verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="11" fill="#22c55e" />
      <path d="M6.5 12l4 4 7-8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Ícone de certificado — estilo badge/medalha ── */
function CertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ display: "inline", verticalAlign: "middle" }}>
      {/* Medalha circular */}
      <circle cx="12" cy="10" r="8" fill="#4f46e5" />
      <circle cx="12" cy="10" r="6.5" fill="#6366f1" />
      {/* Check branco no centro */}
      <path d="M8.5 10l2.5 2.5 4.5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Fita esquerda */}
      <path d="M8 17.5 L7 22 L12 20" fill="#3730a3" />
      {/* Fita direita */}
      <path d="M16 17.5 L17 22 L12 20" fill="#3730a3" />
    </svg>
  );
}

/* ── Linha de empresa dentro do card ── */
function CompanyRow({
  entry,
  filterEmployeeId,
}: {
  entry: KanbanCompanyEntry;
  filterEmployeeId: number | null;
}) {
  const [expanded, setExpanded] = useState(false);

  // Se há filtro de funcionário, expande automaticamente para mostrar o match
  const shouldAutoExpand = filterEmployeeId != null;

  const dataText = entry.dataInicio
    ? new Date(entry.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")
    : "—";

  // Filtra funcionários se houver filtro de funcionário
  const displayFuncionarios = filterEmployeeId != null
    ? entry.funcionarios.filter((f) => f.employeeId === filterEmployeeId)
    : entry.funcionarios;

  return (
    <div>
      <Group
        gap={6}
        align="center"
        wrap="nowrap"
        style={{ cursor: "pointer", padding: "3px 0" }}
        onClick={() => setExpanded((v) => !v)}
      >
        {(expanded || shouldAutoExpand)
          ? <IconChevronDown size={12} color="var(--text-secondary)" />
          : <IconChevronRight size={12} color="var(--text-secondary)" />
        }
        <IconBuilding size={12} color="var(--text-secondary)" />
        <Text fz="xs" c="var(--text-secondary)" style={{ flex: 1, minWidth: 0 }} truncate>
          {entry.companyName}
        </Text>
        <Text fz="xs" c="var(--text-secondary)">{dataText}</Text>

        {/* ✅ Todos concluíram */}
        {entry.allCompleted && (
          <Tooltip label="Todos os funcionários concluíram a trilha" withArrow>
            <span style={{ lineHeight: 0 }}><DoneIcon /></span>
          </Tooltip>
        )}

        {/* 🏆 Ao menos um certificado */}
        {entry.anyCertified && (
          <Tooltip label="Ao menos um funcionário foi certificado" withArrow>
            <span><CertIcon /></span>
          </Tooltip>
        )}
      </Group>

      <Collapse in={expanded || shouldAutoExpand}>
        <Stack gap={2} pl="20px" pt={4}>
          {displayFuncionarios.length === 0 ? (
            <Text fz="xs" c="var(--text-secondary)">Nenhum funcionário registrado</Text>
          ) : (
            displayFuncionarios.map((f) => (
              <Group key={f.employeeId} gap={6} align="center" wrap="nowrap">
                <IconUser size={11} color="var(--text-secondary)" />
                <Text fz="xs" c="var(--text-secondary)" style={{ flex: 1 }} truncate>
                  {f.employeeName}
                </Text>
                {f.notaObtida != null && (
                  <Text fz="xs" c="var(--text-secondary)">{f.notaObtida.toFixed(1)}</Text>
                )}

                {/* ✅ Funcionário concluiu */}
                {f.completedTrail && (
                  <Tooltip label="Concluiu a trilha" withArrow>
                    <span style={{ lineHeight: 0 }}><DoneIcon /></span>
                  </Tooltip>
                )}

                {/* 🏆 Funcionário certificado */}
                {f.certifiedTrail && (
                  <Tooltip label="Certificado na trilha" withArrow>
                    <span><CertIcon /></span>
                  </Tooltip>
                )}
              </Group>
            ))
          )}
        </Stack>
      </Collapse>
    </div>
  );
}

/* ── Card individual do kanban ── */
interface TrailCardProps {
  trail: Trail;
  removeDuplicates: boolean;
  filterCompanyId: number | null;
  filterEmployeeId: number | null;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

function TrailKanbanCard({
  trail,
  removeDuplicates,
  filterCompanyId,
  filterEmployeeId,
  onEdit,
  onDelete,
}: TrailCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: trail.id!,
  });

  const [companies, setCompanies] = useState<KanbanCompanyEntry[]>([]);

  useEffect(() => {
    if (trail.id) {
      getKanbanData(trail.id).then(setCompanies).catch(() => {});
    }
  }, [trail.id]);

  // Aplica filtros na ordem certa
  let displayCompanies = companies;

  // 1. Remove duplicatas (mantém só a ocorrência mais recente por empresa)
  if (removeDuplicates) {
    displayCompanies = Object.values(
      displayCompanies.reduce((acc, entry) => {
        const key = String(entry.companyId);
        if (!acc[key] || (entry.dataInicio && (!acc[key].dataInicio || entry.dataInicio > acc[key].dataInicio))) {
          acc[key] = entry;
        }
        return acc;
      }, {} as Record<string, KanbanCompanyEntry>)
    );
  }

  // 2. Filtro por empresa
  if (filterCompanyId != null) {
    displayCompanies = displayCompanies.filter((e) => e.companyId === filterCompanyId);
  }

  // 3. Filtro por funcionário — mantém só empresas que têm aquele funcionário
  if (filterEmployeeId != null) {
    displayCompanies = displayCompanies.filter((e) =>
      e.funcionarios.some((f) => f.employeeId === filterEmployeeId)
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    cursor: isDragging ? "grabbing" : "default",
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      p="md"
      radius="16px"
      w={280}
      miw={280}
      maw={280}
      styles={{
        root: {
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          boxShadow: isDragging ? "0 16px 40px var(--shadow-color)" : "0 4px 16px var(--shadow-color)",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        },
      }}
    >
      {/* Header */}
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap={6} align="center" wrap="nowrap">
          <ActionIcon
            variant="subtle" color="gray" size="sm"
            style={{ cursor: "grab", touchAction: "none" }}
            {...attributes} {...listeners}
          >
            <IconGripVertical size={16} />
          </ActionIcon>
          <Badge variant="light" color="violet" radius="xl" size="sm">
            #{trail.sortOrder}
          </Badge>
        </Group>
        <Group gap={4} wrap="nowrap">
          <Tooltip label="Editar" withArrow>
            <ActionIcon size="sm" radius="xl" color="blue" variant="light"
              onClick={() => onEdit(trail.id!)}>
              <IconEdit size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Remover" withArrow>
            <ActionIcon size="sm" radius="xl" color="red" variant="light"
              onClick={() => onDelete(trail.id!)}>
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Nome */}
      <Text fw={700} fz="md" c="var(--text-primary)" lineClamp={2} style={{ lineHeight: 1.35 }}>
        {trail.name}
      </Text>

      {/* Descrição */}
      <Text fz="sm" c="var(--text-secondary)" lineClamp={2} style={{ lineHeight: 1.5 }}>
        {trail.description || "—"}
      </Text>

      {/* Status */}
      <Badge color={trail.active ? "green" : "red"} radius="xl" size="sm" variant="light">
        {trail.active ? "ATIVA" : "INATIVA"}
      </Badge>

      {/* Empresas */}
      {displayCompanies.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 8 }}>
          <Text fz="xs" c="var(--text-secondary)" fw={600} mb={6}>
            EMPRESAS ({displayCompanies.length})
          </Text>
          <Stack gap={2}>
            {displayCompanies.map((entry) => (
              <CompanyRow
                key={`${entry.companyId}-${entry.trainingId}`}
                entry={entry}
                filterEmployeeId={filterEmployeeId}
              />
            ))}
          </Stack>
        </div>
      )}
    </Paper>
  );
}

/* ── Página principal ── */
export default function AdminKanbanTrails() {
  const navigate = useNavigate();

  const [trails, setTrails] = useState<Trail[]>([]);
  const [swapping, setSwapping] = useState(false);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);

  // Filtros
  const [filterCompanyId, setFilterCompanyId] = useState<number | null>(null);
  const [filterEmployeeId, setFilterEmployeeId] = useState<number | null>(null);
  const [filterActive, setFilterActive] = useState<"active" | "inactive" | "all">("active");
  const [companyOptions, setCompanyOptions] = useState<Company[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);

  const [opened, { open, close }] = useDisclosure(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function loadTrails() {
    const response = await getTrails({ size: 100 });
    setTrails([...response.content].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  useEffect(() => {
    loadTrails();
    getAllCompaniesSimple().then(setCompanyOptions);
    getEmployees({ size: 1000 }).then((r) => setEmployeeOptions(r.content));
  }, []);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || swapping) return;
    const id1 = active.id as number;
    const id2 = over.id as number;
    setTrails((prev) => {
      const next = [...prev];
      const i1 = next.findIndex((t) => t.id === id1);
      const i2 = next.findIndex((t) => t.id === id2);
      if (i1 === -1 || i2 === -1) return prev;
      const tmp = next[i1].sortOrder;
      next[i1] = { ...next[i1], sortOrder: next[i2].sortOrder };
      next[i2] = { ...next[i2], sortOrder: tmp };
      return next.sort((a, b) => a.sortOrder - b.sortOrder);
    });
    setSwapping(true);
    try { await swapTrailOrder(id1, id2); }
    catch { await loadTrails(); }
    finally { setSwapping(false); }
  }

  async function handleDelete() {
    if (!selectedId) return;
    setDeleteError(null);
    try {
      await deleteTrail(selectedId);
      close();
      loadTrails();
      // Toast apenas para sucesso — ação concluída, não requer atenção do usuário
      notifications.show({
        title: "Trilha removida",
        message: "A trilha foi excluída com sucesso.",
        color: "green",
        autoClose: 3000,
      });
    } catch (err: any) {
      // Erro de validação → inline no modal, usuário precisa ler e decidir o que fazer
      const msg = err?.response?.data?.message || "Erro ao excluir a trilha.";
      setDeleteError(msg);
    }
  }

  const hasFilter = filterCompanyId != null || filterEmployeeId != null || filterActive !== "all";

  // Trilhas filtradas por status
  const visibleTrails = trails.filter((t) => {
    if (filterActive === "active")   return t.active === true;
    if (filterActive === "inactive") return t.active === false;
    return true;
  });

  /* ── Coleta dados filtrados de todas as trilhas para exportação ── */
  async function collectExportData() {
    type Row = {
      trilha: string;
      empresa: string;
      data: string;
      empresaAprovada: string;
      funcionario: string;
      nota: string;
      funcAprovado: string;
    };

    const rows: Row[] = [];

    for (const trail of trails) {
      let companies = await getKanbanData(trail.id!);

      // Aplica mesmos filtros do kanban
      if (removeDuplicates) {
        companies = Object.values(
          companies.reduce((acc, entry) => {
            const key = String(entry.companyId);
            if (!acc[key] || (entry.dataInicio && (!acc[key].dataInicio || entry.dataInicio > acc[key].dataInicio))) {
              acc[key] = entry;
            }
            return acc;
          }, {} as Record<string, typeof companies[0]>)
        );
      }
      if (filterCompanyId != null) {
        companies = companies.filter((e) => e.companyId === filterCompanyId);
      }
      if (filterEmployeeId != null) {
        companies = companies.filter((e) =>
          e.funcionarios.some((f) => f.employeeId === filterEmployeeId)
        );
      }

      for (const entry of companies) {
        const employees = filterEmployeeId != null
          ? entry.funcionarios.filter((f) => f.employeeId === filterEmployeeId)
          : entry.funcionarios;

        const dataFmt = entry.dataInicio
          ? new Date(entry.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")
          : "—";

        if (employees.length === 0) {
          rows.push({
            trilha: trail.name,
            empresa: entry.companyName,
            data: dataFmt,
            empresaAprovada: entry.aprovado ? "Sim" : "Não",
            funcionario: "—",
            nota: "—",
            funcAprovado: "—",
          });
        } else {
          for (const f of employees) {
            rows.push({
              trilha: trail.name,
              empresa: entry.companyName,
              data: dataFmt,
              empresaAprovada: entry.aprovado ? "Sim" : "Não",
              funcionario: f.employeeName,
              nota: f.notaObtida != null ? f.notaObtida.toFixed(1) : "—",
              funcAprovado: f.aprovado ? "Sim" : "Não",
            });
          }
        }
      }
    }

    return rows;
  }

  async function handleExportExcel() {
    setExporting("excel");
    try {
      const rows = await collectExportData();

      // ── Linhas de cabeçalho com informações do relatório ──────────────
      const sheetData: (string | null)[][] = [];

      sheetData.push(["UDoc — Kanban de Trilhas", null, null, null, null, null, null]);
      sheetData.push(["Data:", new Date().toLocaleDateString("pt-BR"), null, null, null, null, null]);

      if (filterCompanyId != null) {
        sheetData.push([
          "Empresa filtrada:",
          companyOptions.find((c) => c.id === filterCompanyId)?.name || "",
          null, null, null, null, null,
        ]);
      }
      if (filterEmployeeId != null) {
        sheetData.push([
          "Funcionário filtrado:",
          employeeOptions.find((e) => e.id === filterEmployeeId)?.name || "",
          null, null, null, null, null,
        ]);
      }
      if (removeDuplicates) {
        sheetData.push(["Modo:", "Sem duplicatas", null, null, null, null, null]);
      }

      sheetData.push([]); // linha em branco

      // ── Cabeçalho da tabela ───────────────────────────────────────────
      const headers = [
        "Trilha", "Empresa", "Data",
        "Empresa Aprovada", "Funcionário", "Nota", "Func. Aprovado",
      ];
      sheetData.push(headers);

      // ── Linhas de dados ───────────────────────────────────────────────
      if (rows.length === 0) {
        sheetData.push(["Nenhum dado para os filtros aplicados", null, null, null, null, null, null]);
      } else {
        for (const r of rows) {
          sheetData.push([
            r.trilha, r.empresa, r.data, r.empresaAprovada,
            r.funcionario, r.nota, r.funcAprovado,
          ]);
        }
      }

      // ── Cria worksheet e workbook ─────────────────────────────────────
      const ws = XLSX.utils.aoa_to_sheet(sheetData);

      // Largura de cada coluna baseada no conteúdo
      const colWidths = headers.map((h, ci) => {
        const maxLen = sheetData.reduce((max, row) => {
          const v = row[ci] ? String(row[ci]).length : 0;
          return Math.max(max, v);
        }, h.length);
        return { wch: Math.min(maxLen + 2, 55) };
      });
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Kanban Trilhas");

      XLSX.writeFile(wb, `kanban_trilhas_${new Date().toISOString().split("T")[0]}.xlsx`);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportPdf() {
    setExporting("pdf");
    try {
      const rows = await collectExportData();

      const filterDesc = [
        filterCompanyId != null ? `Empresa: ${companyOptions.find((c) => c.id === filterCompanyId)?.name}` : "",
        filterEmployeeId != null ? `Funcionário: ${employeeOptions.find((e) => e.id === filterEmployeeId)?.name}` : "",
      ].filter(Boolean).join(" | ");

      const tableRows = rows
        .map(
          (r, i) => `
          <tr style="background:${i % 2 === 0 ? "#f5f3ff" : "#ffffff"}">
            <td>${r.trilha}</td><td>${r.empresa}</td><td>${r.data}</td>
            <td style="text-align:center">${r.empresaAprovada}</td>
            <td>${r.funcionario}</td>
            <td style="text-align:center">${r.nota}</td>
            <td style="text-align:center">${r.funcAprovado}</td>
          </tr>`
        )
        .join("");

      const html = `
        <div style="font-family:Arial,sans-serif;padding:20px;color:#1e1b4b">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <h2 style="margin:0;color:#7c3aed">UDoc — Kanban de Trilhas</h2>
            <span style="font-size:12px;color:#64748b">${new Date().toLocaleDateString("pt-BR")}</span>
          </div>
          ${filterDesc ? `<p style="font-size:12px;color:#64748b;margin:0 0 12px">Filtros: ${filterDesc}</p>` : ""}
          ${removeDuplicates ? `<p style="font-size:12px;color:#64748b;margin:0 0 12px">Modo: Sem duplicatas</p>` : ""}
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead>
              <tr style="background:#7c3aed;color:white">
                <th style="padding:8px;text-align:left">Trilha</th>
                <th style="padding:8px;text-align:left">Empresa</th>
                <th style="padding:8px;text-align:left">Data</th>
                <th style="padding:8px;text-align:center">Emp. Aprovada</th>
                <th style="padding:8px;text-align:left">Funcionário</th>
                <th style="padding:8px;text-align:center">Nota</th>
                <th style="padding:8px;text-align:center">Func. Aprovado</th>
              </tr>
            </thead>
            <tbody style="border:1px solid #e2e8f0">
              ${tableRows || "<tr><td colspan='7' style='text-align:center;padding:20px;color:#94a3b8'>Nenhum dado encontrado para os filtros aplicados</td></tr>"}
            </tbody>
          </table>
          <p style="font-size:10px;color:#94a3b8;margin-top:16px;text-align:right">Gerado pelo UDoc</p>
        </div>`;

      const el = document.createElement("div");
      el.innerHTML = html;
      document.body.appendChild(el);

      await html2pdf()
        .set({
          margin: 10,
          filename: `kanban_trilhas_${new Date().toISOString().split("T")[0]}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        })
        .from(el)
        .save();

      document.body.removeChild(el);
    } finally {
      setExporting(null);
    }
  }

  const inputS = {
    input: {
      background: "var(--input-bg)",
      border: "1px solid var(--border-color)",
      color: "var(--text-primary)",
    },
  };

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Modal
        opened={opened}
        onClose={() => { close(); setDeleteError(null); }}
        centered radius="xl"
        title="Remover trilha"
        styles={{ header: { background: "var(--card-bg)" }, body: { background: "var(--card-bg)" }, content: { background: "var(--card-bg)" } }}
      >
        <Stack gap="md">
          {/* Erro inline — validação que bloqueia a ação, usuário precisa entender antes de decidir */}
          {deleteError ? (
            <Alert color="red" radius="xl" variant="light" icon={<IconX size={16} />}>
              {deleteError}
            </Alert>
          ) : (
            <Text c="var(--text-secondary)">
              Deseja remover esta trilha permanentemente? Esta ação não pode ser desfeita.
            </Text>
          )}
          <Group justify="flex-end">
            <Button variant="default" radius="xl" onClick={() => { close(); setDeleteError(null); }}>
              {deleteError ? "Fechar" : "Cancelar"}
            </Button>
            {!deleteError && (
              <Button color="red" radius="xl" onClick={handleDelete}>Remover</Button>
            )}
          </Group>
        </Stack>
      </Modal>

      {/* Header */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} c="var(--text-primary)" fw={700}>Kanban de Trilhas</Title>
            <Text c="var(--text-secondary)" mt={4}>
              Arraste os cards para reordenar · use os filtros para focar em empresa ou funcionário
            </Text>
          </div>
          <Group gap="md">
            <Switch
              label="Remover duplicatas"
              checked={removeDuplicates}
              onChange={(e) => setRemoveDuplicates(e.currentTarget.checked)}
              size="sm" color="violet"
              styles={{ label: { color: "var(--text-secondary)", cursor: "pointer", fontSize: 13 } }}
            />
            <Button leftSection={<IconPlus size={18} />} radius="xl" size="md"
              variant="gradient" gradient={{ from: "violet", to: "blue" }}
              onClick={() => navigate("/admin/trail")}>
              Nova Trilha
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Filtros */}
      <Paper px="24px" py="16px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 16px var(--shadow-color)" }}>
        <Group gap="md" align="flex-end" wrap="wrap">
          <Group gap={6} align="center">
            <IconFilter size={16} color="var(--text-secondary)" />
            <Text fz="sm" c="var(--text-secondary)">Filtros:</Text>
          </Group>

          {/* Filtro de status — padrão: Ativa */}
          <SegmentedControl
            size="sm"
            radius="xl"
            value={filterActive}
            onChange={(v) => setFilterActive(v as "all" | "active" | "inactive")}
            data={[
              { label: "Ativas", value: "active" },
              { label: "Inativas", value: "inactive" },
              { label: "Todas", value: "all" },
            ]}
            styles={{
              root: { background: "var(--app-bg)", border: "1px solid var(--border-color)" },
              label: { color: "var(--text-primary)", fontSize: 13 },
            }}
          />

          <Select
            placeholder="Filtrar por empresa"
            clearable searchable
            radius="xl" size="sm"
            w={220}
            data={companyOptions.map((c) => ({ value: String(c.id), label: c.name }))}
            value={filterCompanyId != null ? String(filterCompanyId) : null}
            onChange={(v) => setFilterCompanyId(v ? Number(v) : null)}
            styles={inputS}
          />

          <Select
            placeholder="Filtrar por funcionário"
            clearable searchable
            radius="xl" size="sm"
            w={220}
            data={employeeOptions.map((e) => ({ value: String(e.id), label: e.name }))}
            value={filterEmployeeId != null ? String(filterEmployeeId) : null}
            onChange={(v) => setFilterEmployeeId(v ? Number(v) : null)}
            styles={inputS}
          />

          {hasFilter && (
            <Button
              leftSection={<IconX size={14} />}
              variant="subtle" color="gray" radius="xl" size="sm"
              onClick={() => { setFilterCompanyId(null); setFilterEmployeeId(null); setFilterActive("active"); }}
            >
              Limpar filtros
            </Button>
          )}

          <Group gap={6} ml="auto">
            <Tooltip label="Exportar Excel (.csv)" withArrow>
              <ActionIcon
                radius="xl" size="lg"
                variant="light" color="teal"
                loading={exporting === "excel"}
                onClick={handleExportExcel}
              >
                <IconFileSpreadsheet size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Exportar PDF" withArrow>
              <ActionIcon
                radius="xl" size="lg"
                variant="light" color="red"
                loading={exporting === "pdf"}
                onClick={handleExportPdf}
              >
                <IconFileTypePdf size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Paper>

      {/* Kanban board */}
      <Paper p="24px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>

        {trails.length === 0 ? (
          <Stack align="center" py="60px" gap="md">
            <Text c="var(--text-secondary)" fz="lg">Nenhuma trilha cadastrada ainda.</Text>
            <Button leftSection={<IconPlus size={16} />} variant="gradient"
              gradient={{ from: "violet", to: "blue" }} radius="xl"
              onClick={() => navigate("/admin/trail")}>
              Criar primeira trilha
            </Button>
          </Stack>
        ) : (
          <ScrollArea
            type="auto"
            scrollbarSize={8}
            style={{ height: "calc(100vh - 320px)", minHeight: 400 }}
            styles={{
              root: { overflow: "hidden" },
              viewport: { overflowX: "auto", overflowY: "auto" },
              scrollbar: { zIndex: 10 },
            }}
          >
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visibleTrails.map((t) => t.id!)} strategy={horizontalListSortingStrategy}>
                <Group wrap="nowrap" align="flex-start" gap="md" pb="12px">
                  {visibleTrails.map((trail) => (
                    <TrailKanbanCard
                      key={trail.id}
                      trail={trail}
                      removeDuplicates={removeDuplicates}
                      filterCompanyId={filterCompanyId}
                      filterEmployeeId={filterEmployeeId}
                      onEdit={(id) => navigate(`/admin/trail/${id}`)}
                      onDelete={(id) => { setSelectedId(id); open(); }}
                    />
                  ))}
                </Group>
              </SortableContext>
            </DndContext>
          </ScrollArea>
        )}

      </Paper>

    </Stack>
  );
}
