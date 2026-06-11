import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ActionIcon,
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

import { Tabs as MantineTabs } from "@mantine/core";
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
};

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  const [card, setCard] = useState<Card>(() => {
    const prefill = (location.state as any)?.prefill;
    if (prefill && !id) {
      return { ...EMPTY_CARD, title: prefill.title ?? "", content: prefill.content ?? "" };
    }
    return EMPTY_CARD;
  });
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
          <TextInput
            label={
              <Group gap={4} align="center">
                <span>Ícone</span>
                <Tooltip label="Ver catálogo de ícones do React Icons" withArrow position="right">
                  <ActionIcon
                    component="a"
                    href="https://react-icons.github.io/react-icons/"
                    target="_blank"
                    rel="noopener noreferrer"
                    size="xs"
                    variant="subtle"
                    color="blue"
                  >
                    <IconInfoCircle size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            }
            name="icon"
            value={card.icon}
            onChange={handleChange}
            placeholder="Ex.: FaUser"
            radius="lg"
            styles={inputStyles}
          />

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
        <div style={{
          height: "calc(100vh - 430px)",
          minHeight: 500,
          overflowY: "auto",
        }}>
          <RichTextEditor
            value={card.content || ""}
            onChange={(value) => updateField("content", value)}
          />
        </div>
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

  const bg = dark ? "#111111" : "#f4f4f5";

  const tabListStyles = {
    list: {
      display: "flex" as const,
      flexWrap: "wrap" as const,
      alignItems: "center" as const,
      background: dark ? "linear-gradient(180deg, #111827 0%, #0f172a 100%)" : "#ffffff",
      border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #d1d5db",
      borderRadius: "18px",
      padding: "8px",
      gap: "8px",
      boxShadow: dark ? "0 10px 40px rgba(0,0,0,0.25)" : "0 10px 30px rgba(0,0,0,0.08)",
    },
    tab: {
      flex: "0 0 auto" as const,
      color: dark ? "#94a3b8" : "#374151",
      fontWeight: 600,
      borderRadius: "12px",
      transition: "all 0.2s ease",
      paddingInline: "18px",
      height: "42px",
      whiteSpace: "nowrap" as const,
      background: "transparent",
    },
    tabLabel: { fontSize: "14px" },
    panel: { paddingTop: "12px", width: "100%" },
  };

  return (
    <Box bg={bg} mih="100vh">
      <MantineTabs defaultValue={tabs[0]?.id} variant="outline" radius="lg" keepMounted={false} styles={tabListStyles}>

        {/* ── Cabeçalho + barra de abas fixos ao rolar ── */}
        <div style={{ position: "sticky", top: 0, zIndex: 200, background: bg, padding: "16px 16px 0" }}>

          <Paper p="xl" radius="24px" mb="md" style={paperStyle}>
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
            <Alert mb="md" radius="xl" color={messageType === "success" ? "green" : "red"} icon={messageType === "success" ? <IconCheck /> : <IconX />}>
              {message}
            </Alert>
          )}

          <MantineCard radius="24px" style={{ ...paperStyle, paddingTop: 16, paddingBottom: 0 }}>
            <MantineTabs.List mb={0}>
              {tabs.map((tab) => (
                <MantineTabs.Tab key={tab.id} value={tab.id}>
                  {tab.label}
                </MantineTabs.Tab>
              ))}
            </MantineTabs.List>
          </MantineCard>

        </div>

        {/* ── Conteúdo das abas — rola livremente ── */}
        <div style={{ padding: "16px 16px 24px" }}>
          <MantineCard radius="24px" p="xl" style={paperStyle}>
            {tabs.map((tab) => (
              <MantineTabs.Panel key={tab.id} value={tab.id}>
                {tab.content}
              </MantineTabs.Panel>
            ))}
          </MantineCard>
        </div>

      </MantineTabs>
    </Box>
  );
}
