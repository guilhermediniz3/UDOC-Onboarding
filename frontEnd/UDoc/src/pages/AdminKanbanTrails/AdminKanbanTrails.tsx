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
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import {
  IconEdit,
  IconGripVertical,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  deleteTrail,
  getTrails,
  swapTrailOrder,
} from "../../services/trailService";

import type { Trail } from "../../types/Trail";

/* ── Card individual do kanban ── */

interface TrailCardProps {
  trail: Trail;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

function TrailKanbanCard({ trail, onEdit, onDelete }: TrailCardProps) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: trail.id! });

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
      w={260}
      miw={260}
      maw={260}
      styles={{
        root: {
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          boxShadow: isDragging
            ? "0 16px 40px var(--shadow-color)"
            : "0 4px 16px var(--shadow-color)",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        },
      }}
    >

      <Group justify="space-between" align="center" wrap="nowrap">

        <Group gap={6} align="center" wrap="nowrap">

          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            style={{ cursor: "grab", touchAction: "none" }}
            {...attributes}
            {...listeners}
          >
            <IconGripVertical size={16} />
          </ActionIcon>

          <Badge
            variant="light"
            color="violet"
            radius="xl"
            size="sm"
          >
            #{trail.sortOrder}
          </Badge>

        </Group>

        <Group gap={4} wrap="nowrap">

          <Tooltip label="Editar" withArrow>
            <ActionIcon
              size="sm"
              radius="xl"
              color="blue"
              variant="light"
              onClick={() => onEdit(trail.id!)}
            >
              <IconEdit size={14} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Remover" withArrow>
            <ActionIcon
              size="sm"
              radius="xl"
              color="red"
              variant="light"
              onClick={() => onDelete(trail.id!)}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>

        </Group>

      </Group>

      <Text
        fw={700}
        fz="md"
        c="var(--text-primary)"
        lineClamp={2}
        style={{ lineHeight: 1.35 }}
      >
        {trail.name}
      </Text>

      <Text
        fz="sm"
        c="var(--text-secondary)"
        lineClamp={3}
        style={{ flexGrow: 1, lineHeight: 1.5 }}
      >
        {trail.description || "—"}
      </Text>

      <Badge
        color={trail.active ? "green" : "red"}
        radius="xl"
        size="sm"
        variant="light"
      >
        {trail.active ? "ATIVA" : "INATIVA"}
      </Badge>

    </Paper>
  );
}

/* ── Página ── */

export default function AdminKanbanTrails() {

  const navigate = useNavigate();

  const [trails, setTrails] = useState<Trail[]>([]);
  const [swapping, setSwapping] = useState(false);

  const [opened, { open, close }] = useDisclosure(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  async function loadTrails() {
    const response = await getTrails({ size: 100 });
    const sorted = [...response.content].sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
    setTrails(sorted);
  }

  useEffect(() => {
    loadTrails();
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
    try {
      await swapTrailOrder(id1, id2);
    } catch {
      await loadTrails();
    } finally {
      setSwapping(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    await deleteTrail(selectedId);
    close();
    loadTrails();
  }

  return (

    <Stack
      p="30px"
      gap="20px"
      bg="var(--app-bg)"
      mih="100vh"
    >

      <Modal
        opened={opened}
        onClose={close}
        centered
        radius="xl"
        title="Remover trilha"
      >
        <Text mb="lg">Deseja remover esta trilha?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button color="red" onClick={handleDelete}>Remover</Button>
        </Group>
      </Modal>

      {/* Header */}
      <Paper
        p="30px"
        radius="24px"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 30px var(--shadow-color)",
        }}
      >

        <Group justify="space-between" align="center">

          <div>
            <Title order={2} c="var(--text-primary)" fw={700}>
              Kanban de Trilhas
            </Title>
            <Text c="var(--text-secondary)" mt={4}>
              Arraste os cards para reordenar as trilhas
            </Text>
          </div>

          <Button
            leftSection={<IconPlus size={18} />}
            radius="xl"
            size="md"
            variant="gradient"
            gradient={{ from: "violet", to: "blue" }}
            onClick={() => navigate("/admin/trail")}
          >
            Nova Trilha
          </Button>

        </Group>

      </Paper>

      {/* Kanban board */}
      <Paper
        p="24px"
        radius="24px"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 30px var(--shadow-color)",
        }}
      >

        {trails.length === 0 ? (

          <Stack align="center" py="60px" gap="md">
            <Text c="var(--text-secondary)" fz="lg">
              Nenhuma trilha cadastrada ainda.
            </Text>
            <Button
              leftSection={<IconPlus size={16} />}
              variant="gradient"
              gradient={{ from: "violet", to: "blue" }}
              radius="xl"
              onClick={() => navigate("/admin/trail")}
            >
              Criar primeira trilha
            </Button>
          </Stack>

        ) : (

          <ScrollArea
            type="scroll"
            offsetScrollbars
            scrollbarSize={8}
          >

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >

              <SortableContext
                items={trails.map((t) => t.id!)}
                strategy={horizontalListSortingStrategy}
              >

                <Group
                  wrap="nowrap"
                  align="flex-start"
                  gap="md"
                  pb="12px"
                >

                  {trails.map((trail) => (
                    <TrailKanbanCard
                      key={trail.id}
                      trail={trail}
                      onEdit={(id) => navigate(`/admin/trail/${id}`)}
                      onDelete={(id) => {
                        setSelectedId(id);
                        open();
                      }}
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
