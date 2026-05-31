import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Text,
} from "@mantine/core";

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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
  IconCheck,
  IconFileText,
  IconGripVertical,
  IconPlus,
  IconSchool,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";

import {
  getTrailContent,
  replaceTrailContent,
  type TrailContentItem,
} from "../../services/trailContentService";

import { getCards } from "../../services/cardService";
import { getTrainingRooms } from "../../services/trainingRoomService";

interface Props {
  trailId: number;
}

interface SelectOption {
  value: string;
  label: string;
}

/* ── Item drag-and-drop ── */
function SortableItem({
  item,
  onRemove,
}: {
  item: TrailContentItem;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${item.tipo}-${item.referenciaId}-${item.ordem}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Paper
        px="16px" py="12px" radius="12px"
        style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 12 }}
      >
        <ActionIcon variant="subtle" color="gray" size="sm" style={{ cursor: "grab", touchAction: "none" }} {...attributes} {...listeners}>
          <IconGripVertical size={16} />
        </ActionIcon>

        {item.tipo === "card"
          ? <IconFileText size={18} color="var(--mantine-color-violet-5)" />
          : <IconSchool size={18} color="var(--mantine-color-blue-5)" />
        }

        <Badge variant="light" color={item.tipo === "card" ? "violet" : "blue"} radius="xl" size="sm">
          {item.tipo === "card" ? "Card" : "Sala"}
        </Badge>

        <Text fz="sm" fw={500} c="var(--text-primary)" style={{ flex: 1 }}>
          {item.nome || `ID ${item.referenciaId}`}
        </Text>

        <ActionIcon size="sm" radius="xl" color="red" variant="light" onClick={onRemove}>
          <IconTrash size={14} />
        </ActionIcon>
      </Paper>
    </div>
  );
}

/* ── Aba principal ── */
export default function TrailContentTab({ trailId }: Props) {

  const [items, setItems] = useState<TrailContentItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const [addType, setAddType] = useState<"card" | "sala">("card");
  const [addId, setAddId] = useState<string | null>(null);

  const [cardOptions, setCardOptions] = useState<SelectOption[]>([]);
  const [roomOptions, setRoomOptions] = useState<SelectOption[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type); setMessage(text); setTimeout(() => setMessage(""), 3500);
  }

  useEffect(() => {
    getTrailContent(trailId).then(setItems).catch(() => {});
    getCards({ size: 1000, active: true }).then((r) =>
      setCardOptions(r.content.map((c) => ({ value: String(c.id), label: c.title })))
    );
    getTrainingRooms({ size: 1000, active: true }).then((r) =>
      setRoomOptions(r.content.map((rm) => ({ value: String(rm.id), label: rm.title })))
    );
  }, [trailId]);

  function handleAdd() {
    if (!addId) return;
    const id = Number(addId);
    const label = addType === "card"
      ? cardOptions.find((o) => o.value === addId)?.label || `Card ${id}`
      : roomOptions.find((o) => o.value === addId)?.label || `Sala ${id}`;

    const newItem: TrailContentItem = {
      tipo: addType,
      referenciaId: id,
      ordem: items.length,
      nome: label,
    };
    setItems((prev) => [...prev, newItem]);
    setAddId(null);
  }

  function handleRemove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index).map((it, i) => ({ ...it, ordem: i })));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((it) => `${it.tipo}-${it.referenciaId}-${it.ordem}` === active.id);
      const newIndex = prev.findIndex((it) => `${it.tipo}-${it.referenciaId}-${it.ordem}` === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((it, i) => ({ ...it, ordem: i }));
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = items.map((it, i) => ({
        tipo: it.tipo,
        referenciaId: it.referenciaId,
        ordem: i,
      }));
      const saved = await replaceTrailContent(trailId, payload);
      // Preserva nomes na lista local
      setItems(saved.map((s, i) => ({ ...s, nome: items[i]?.nome || s.nome })));
      showMessage("success", "Conteúdo salvo com sucesso!");
    } catch {
      showMessage("error", "Erro ao salvar o conteúdo da trilha.");
    } finally { setSaving(false); }
  }

  const typeOptions: SelectOption[] = [
    { value: "card", label: "Card (documento)" },
    { value: "sala", label: "Sala de Treinamento" },
  ];

  const currentOptions = addType === "card" ? cardOptions : roomOptions;

  return (
    <Stack gap="20px">

      {message && (
        <Alert color={messageType === "success" ? "green" : "red"}
          icon={messageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />} radius="xl">
          {message}
        </Alert>
      )}

      {/* Adicionar item */}
      <Paper px="20px" py="16px" radius="16px"
        style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
        <Group gap="md" wrap="nowrap">
          <Select
            label="Tipo"
            data={typeOptions}
            value={addType}
            onChange={(v) => { setAddType((v as "card" | "sala") || "card"); setAddId(null); }}
            radius="xl" size="sm" w={180}
            styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }, label: { color: "var(--text-primary)", marginBottom: 4 } }}
          />
          <Select
            label={addType === "card" ? "Selecionar card" : "Selecionar sala"}
            data={currentOptions}
            value={addId}
            onChange={setAddId}
            searchable clearable
            radius="xl" size="sm"
            style={{ flex: 1 }}
            styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }, label: { color: "var(--text-primary)", marginBottom: 4 } }}
          />
          <Button leftSection={<IconPlus size={16} />} radius="xl" size="sm"
            variant="gradient" gradient={{ from: "violet", to: "blue" }}
            onClick={handleAdd} disabled={!addId}
            style={{ marginTop: 24 }}>
            Adicionar
          </Button>
        </Group>
      </Paper>

      {/* Lista com DnD */}
      {items.length === 0 ? (
        <Text ta="center" c="var(--text-secondary)" py="xl">
          Nenhum item adicionado. Use o campo acima para adicionar Cards ou Salas.
        </Text>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={items.map((it) => `${it.tipo}-${it.referenciaId}-${it.ordem}`)}
            strategy={verticalListSortingStrategy}
          >
            <Stack gap="8px">
              {items.map((item, index) => (
                <SortableItem
                  key={`${item.tipo}-${item.referenciaId}-${index}`}
                  item={item}
                  onRemove={() => handleRemove(index)}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}

      {items.length > 0 && (
        <Group justify="flex-end">
          <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }}
            loading={saving} onClick={handleSave}>
            Salvar Conteúdo
          </Button>
        </Group>
      )}

    </Stack>
  );
}
