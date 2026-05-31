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
  Badge,
  Button,
  Collapse,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Switch,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import {
  IconBuilding,
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconGripVertical,
  IconPlus,
  IconTrash,
  IconUser,
} from "@tabler/icons-react";

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

import type { Trail } from "../../types/Trail";

/* ── Ícone de certificado SVG ── */
function CertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: "inline", verticalAlign: "middle" }}>
      <circle cx="12" cy="8" r="5" fill="#7c3aed" opacity="0.9" />
      <path d="M8 13l-2 7 6-3 6 3-2-7" fill="#7c3aed" opacity="0.7" />
      <path d="M12 5l1.5 3 3.5.5-2.5 2.5.5 3.5L12 13l-3 1.5.5-3.5L7 8.5l3.5-.5z" fill="white" />
    </svg>
  );
}

/* ── Linha de empresa dentro do card ── */
function CompanyRow({ entry }: { entry: KanbanCompanyEntry }) {

  const [expanded, setExpanded] = useState(false);

  const dataText = entry.dataInicio
    ? new Date(entry.dataInicio + "T00:00:00").toLocaleDateString("pt-BR")
    : "—";

  return (
    <div>
      <Group
        gap={6}
        align="center"
        wrap="nowrap"
        style={{ cursor: "pointer", padding: "3px 0" }}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <IconChevronDown size={12} color="var(--text-secondary)" /> : <IconChevronRight size={12} color="var(--text-secondary)" />}
        <IconBuilding size={12} color="var(--text-secondary)" />
        <Text fz="xs" c="var(--text-secondary)" style={{ flex: 1, minWidth: 0 }} truncate>
          {entry.companyName}
        </Text>
        <Text fz="xs" c="var(--text-secondary)">{dataText}</Text>
        {entry.aprovado && (
          <Tooltip label="Empresa aprovada" withArrow>
            <span><CertIcon /></span>
          </Tooltip>
        )}
      </Group>

      <Collapse in={expanded}>
        <Stack gap={2} pl="20px" pt={4}>
          {entry.funcionarios.length === 0 ? (
            <Text fz="xs" c="var(--text-secondary)">Nenhum funcionário registrado</Text>
          ) : (
            entry.funcionarios.map((f) => (
              <Group key={f.employeeId} gap={6} align="center" wrap="nowrap">
                <IconUser size={11} color="var(--text-secondary)" />
                <Text fz="xs" c="var(--text-secondary)" style={{ flex: 1 }} truncate>
                  {f.employeeName}
                </Text>
                {f.notaObtida != null && (
                  <Text fz="xs" c="var(--text-secondary)">{f.notaObtida.toFixed(1)}</Text>
                )}
                {f.aprovado && (
                  <Tooltip label="Funcionário aprovado" withArrow>
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
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

function TrailKanbanCard({ trail, removeDuplicates, onEdit, onDelete }: TrailCardProps) {

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: trail.id! });

  const [companies, setCompanies] = useState<KanbanCompanyEntry[]>([]);

  useEffect(() => {
    if (trail.id) {
      getKanbanData(trail.id).then(setCompanies).catch(() => {});
    }
  }, [trail.id]);

  // Remove duplicatas: mantém só a ocorrência mais recente por empresa
  const displayCompanies = removeDuplicates
    ? Object.values(
        companies.reduce((acc, entry) => {
          const key = String(entry.companyId);
          if (!acc[key] || (entry.dataInicio && (!acc[key].dataInicio || entry.dataInicio > acc[key].dataInicio))) {
            acc[key] = entry;
          }
          return acc;
        }, {} as Record<string, KanbanCompanyEntry>)
      )
    : companies;

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
          <ActionIcon variant="subtle" color="gray" size="sm"
            style={{ cursor: "grab", touchAction: "none" }} {...attributes} {...listeners}>
            <IconGripVertical size={16} />
          </ActionIcon>
          <Badge variant="light" color="violet" radius="xl" size="sm">#{trail.sortOrder}</Badge>
        </Group>
        <Group gap={4} wrap="nowrap">
          <Tooltip label="Editar" withArrow>
            <ActionIcon size="sm" radius="xl" color="blue" variant="light" onClick={() => onEdit(trail.id!)}>
              <IconEdit size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Remover" withArrow>
            <ActionIcon size="sm" radius="xl" color="red" variant="light" onClick={() => onDelete(trail.id!)}>
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
              <CompanyRow key={`${entry.companyId}-${entry.trainingId}`} entry={entry} />
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

  const [opened, { open, close }] = useDisclosure(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function loadTrails() {
    const response = await getTrails({ size: 100 });
    const sorted = [...response.content].sort((a, b) => a.sortOrder - b.sortOrder);
    setTrails(sorted);
  }

  useEffect(() => { loadTrails(); }, []);

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
    await deleteTrail(selectedId);
    close();
    loadTrails();
  }

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Modal opened={opened} onClose={close} centered radius="xl" title="Remover trilha">
        <Text mb="lg">Deseja remover esta trilha?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button color="red" onClick={handleDelete}>Remover</Button>
        </Group>
      </Modal>

      {/* Header */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} c="var(--text-primary)" fw={700}>Kanban de Trilhas</Title>
            <Text c="var(--text-secondary)" mt={4}>Arraste os cards para reordenar as trilhas</Text>
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
          <ScrollArea type="scroll" offsetScrollbars scrollbarSize={8}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={trails.map((t) => t.id!)} strategy={horizontalListSortingStrategy}>
                <Group wrap="nowrap" align="flex-start" gap="md" pb="12px">
                  {trails.map((trail) => (
                    <TrailKanbanCard
                      key={trail.id}
                      trail={trail}
                      removeDuplicates={removeDuplicates}
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
