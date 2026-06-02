import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  Alert,
  Badge,
  Box,
  Button,
  Card as MantineCard,
  Checkbox,
  Flex,
  Group,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCheck,
  IconInfoCircle,
  IconX,
} from "@tabler/icons-react";

import { FaTrash } from "react-icons/fa";

import Tabs from "../../../components/Tabs/Tabs";
import RichTextEditor from "../../../components/RichTextEditor/RichTextEditor";
import NpsQuestionEditor from "../../../components/Nps/NpsQuestionEditor";
import CardQuizEditor from "../../../components/Quiz/CardQuizEditor";
import type { Card } from "../../../types/Card";
import type { Tab } from "../../../types/Tab";

import {
  deleteCard,
  getCardById,
  saveCard,
  updateCard,
} from "../../../services/cardService";

// ✅ slug adicionado para satisfazer o tipo Card
const EMPTY_CARD: Card = {
  title: "",
  description: "",
  icon: "",
  content: "",
  active: true,
  slug: "",
};

export default function Admin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  const [card, setCard] = useState<Card>(EMPTY_CARD);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const isNewCard = !card.id;

  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  }

  useEffect(() => {
    async function loadCard() {
      if (!id) return;
      try {
        const response = await getCardById(Number(id));
        setCard(response);
      } catch (error) {
        console.error(error);
        showMessage("error", "Erro ao carregar card.");
      }
    }
    loadCard();
  }, [id]);

  function updateField<K extends keyof Card>(field: K, value: Card[K]) {
    setCard((prev) => ({ ...prev, [field]: value }));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    updateField(name as keyof Card, value);
  }

  async function handleToggleActive(checked: boolean) {
    try {
      const updatedCard = { ...card, active: checked };
      setCard(updatedCard);
      await updateCard(updatedCard);
      showMessage("success", checked ? "Card ativado com sucesso." : "Card inativado com sucesso.");
    } catch (error) {
      console.error(error);
      showMessage("error", "Erro ao alterar status.");
    }
  }

  async function handleSave(event?: FormEvent) {
    event?.preventDefault();
    if (card.title.trim() === "") {
      showMessage("error", "Título obrigatório.");
      return;
    }
    try {
      setSaving(true);
      const isEdit = !!card.id;
      const savedCard = await saveCard(card);
      setCard(savedCard);
      showMessage("success", isEdit ? "Card salvo com sucesso." : "Card criado com sucesso.");
      if (!isEdit && savedCard.id) {
        navigate(`/admin/card/${savedCard.id}`);
      }
    } catch (error) {
      console.error(error);
      showMessage("error", "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!card.id) return;
    try {
      await deleteCard(card.id);
      showMessage("success", "Card removido com sucesso.");
      setTimeout(() => navigate("/admin/cards"), 800);
    } catch (error) {
      console.error(error);
      showMessage("error", "Erro ao remover card.");
    }
  }

  const inputStyles = {
    input: {
      background: dark ? "#1f2937" : "#ffffff",
      border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #d1d5db",
      color: dark ? "white" : "#111827",
    },
    label: { color: dark ? "white" : "#111827" },
  };

  const tabs: Tab[] = [
    {
      id: "card",
      label: "Card",
      content: (
        <Stack gap="lg">
          <TextInput label="Título" name="title" value={card.title} onChange={handleChange} placeholder="Digite o título" radius="lg" styles={inputStyles} />
          <TextInput label="Descrição" name="description" value={card.description} onChange={handleChange} placeholder="Digite a descrição" radius="lg" styles={inputStyles} />
          <TextInput label="Ícone" name="icon" value={card.icon} onChange={handleChange} placeholder="Ex.: FaUser" radius="lg" styles={inputStyles} />

          {/* Card interno */}
          <Group gap="sm" align="center">
            <Checkbox
              checked={card.interno ?? false}
              onChange={(e) => { const v = e.currentTarget.checked; setCard((p) => ({ ...p, interno: v })); }}
              label="Card interno"
              color="violet"
              styles={{ label: { color: "var(--text-primary)", cursor: "pointer" } }}
            />
            <Tooltip
              label="Cards internos não aparecem para funcionários externos (clientes). Apenas admins, ISMs e funcionários internos visualizam."
              withArrow multiline w={280} position="right"
            >
              <IconInfoCircle size={15} color="var(--text-secondary)" style={{ cursor: "help", opacity: 0.7 }} />
            </Tooltip>
          </Group>
        </Stack>
      ),
    },
    {
      id: "midias",
      label: "Mídias",
      content: (
        <RichTextEditor
          value={card.content || ""}
          onChange={(value) => updateField("content", value)}
        />
      ),
    },
    {
      id: "configuracoes",
      label: "Configurações",
      content: (
        <Text c={dark ? "dimmed" : "#6b7280"}>
          Configurações futuras do card.
        </Text>
      ),
    },
    ...(!isNewCard && card.id ? [{
      id: "quiz",
      label: "Quiz",
      content: <CardQuizEditor cardId={card.id!} />,
    }] : []),
    ...(!isNewCard && card.id ? [{
      id: "nps",
      label: "Pesquisa NPS",
      content: (
        <NpsQuestionEditor refType="card" refId={card.id!} />
      ),
    }] : []),
  ];

  const paperStyle = {
    background: dark ? "linear-gradient(180deg, #111827 0%, #0f172a 100%)" : "#ffffff",
    border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
    boxShadow: dark ? "0 10px 30px rgba(0,0,0,0.35)" : "0 10px 30px rgba(0,0,0,0.08)",
  };

  return (
    <Box p="lg" bg={dark ? "#111111" : "#f4f4f5"} mih="100vh">
      <Paper p="xl" radius="24px" mb="xl" style={paperStyle}>
        <Flex justify="space-between" align="center">
          <Group>
            <ThemeIcon size={56} radius="xl" variant="gradient" gradient={{ from: "violet", to: "blue" }}>
              <IconInfoCircle size={28} />
            </ThemeIcon>
            <div>
              <Title order={2} c={dark ? "white" : "#111827"}>
                {isNewCard ? "Novo Card" : "Editar Card"}
              </Title>
              <Text c={dark ? "dimmed" : "#6b7280"}>Gerencie os dados do card.</Text>
            </div>
          </Group>

          <Group>
            <Button variant="light" color="gray" radius="xl" leftSection={<IconArrowLeft size={18} />} onClick={() => navigate("/admin/cards")}>
              Voltar
            </Button>
            <Badge color={card.active ? "green" : "red"} radius="xl" size="lg">
              {card.active ? "ATIVO" : "INATIVO"}
            </Badge>
            <Switch
              checked={card.active ?? false}
              onChange={(event) => handleToggleActive(event.currentTarget.checked)}
              size="lg"
              color="violet"
            />
            <Button color="red" radius="xl" leftSection={<FaTrash />} onClick={handleDelete}>
              Remover
            </Button>
            <Button radius="xl" variant="gradient" gradient={{ from: "violet", to: "blue" }} loading={saving} onClick={handleSave}>
              Salvar
            </Button>
          </Group>
        </Flex>
      </Paper>

      {message && (
        <Alert mb="lg" radius="xl" color={messageType === "success" ? "green" : "red"} icon={messageType === "success" ? <IconCheck /> : <IconX />}>
          {message}
        </Alert>
      )}

      <MantineCard radius="24px" p="xl" style={paperStyle}>
        <Tabs tabs={tabs} />
      </MantineCard>
    </Box>
  );
}
