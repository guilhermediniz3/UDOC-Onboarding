import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  Alert,
  Button,
  Group,
  NumberInput,
  Paper,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";

import {
  IconArrowLeft,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

import {
  createTrail,
  getTrailById,
  updateTrail,
} from "../../services/trailService";

import type { Trail } from "../../types/Trail";

const EMPTY_TRAIL: Trail = {
  name: "",
  description: "",
  active: true,
  sortOrder: 1,
};

export default function AdminTrail() {

  const navigate = useNavigate();
  const { id } = useParams();

  const [trail, setTrail] = useState<Trail>(EMPTY_TRAIL);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const isNew = !id;

  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  }

  useEffect(() => {
    if (!isNew) {
      getTrailById(Number(id)).then((data) => setTrail(data));
    }
  }, [id]);

  async function handleSave() {

    if (!trail.name.trim()) {
      showMessage("error", "O nome da trilha é obrigatório.");
      return;
    }

    if (!trail.sortOrder || trail.sortOrder < 1) {
      showMessage("error", "A ordem deve ser um número maior que zero.");
      return;
    }

    setSaving(true);

    try {

      if (isNew) {
        await createTrail({
          name: trail.name,
          description: trail.description,
          active: trail.active,
          sortOrder: trail.sortOrder,
        });
        showMessage("success", "Trilha criada com sucesso!");
        setTimeout(() => navigate("/admin/trails"), 1200);
      } else {
        await updateTrail(Number(id), {
          name: trail.name,
          description: trail.description,
          active: trail.active,
          sortOrder: trail.sortOrder,
        });
        showMessage("success", "Trilha atualizada com sucesso!");
      }

    } catch (err: unknown) {

      const error = err as { response?: { data?: { message?: string } } };
      const msg =
        error?.response?.data?.message ||
        "Erro ao salvar a trilha. Verifique os dados e tente novamente.";
      showMessage("error", msg);

    } finally {
      setSaving(false);
    }
  }

  return (

    <Stack
      p="30px"
      gap="20px"
      bg="var(--app-bg)"
      mih="100vh"
    >

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
            <Title order={2} c="var(--text-primary)">
              {isNew ? "Nova Trilha" : "Editar Trilha"}
            </Title>
            <Text c="var(--text-secondary)" mt={4}>
              {isNew
                ? "Preencha os dados para criar uma nova trilha"
                : "Altere os dados da trilha"}
            </Text>
          </div>

          <Button
            leftSection={<IconArrowLeft size={18} />}
            variant="default"
            radius="xl"
            size="md"
            onClick={() => navigate("/admin/trails")}
          >
            Voltar
          </Button>

        </Group>

      </Paper>

      {/* Form */}
      <Paper
        p="30px"
        radius="24px"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 30px var(--shadow-color)",
        }}
      >

        <Stack gap="20px">

          {message && (
            <Alert
              color={messageType === "success" ? "green" : "red"}
              icon={
                messageType === "success"
                  ? <IconCheck size={18} />
                  : <IconX size={18} />
              }
              radius="xl"
            >
              {message}
            </Alert>
          )}

          <TextInput
            label="Nome"
            placeholder="Nome da trilha"
            required
            radius="xl"
            size="md"
            value={trail.name}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setTrail((prev) => ({ ...prev, name: value }));
            }}
            styles={{
              input: {
                background: "var(--input-bg)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              },
              label: { color: "var(--text-primary)", marginBottom: 6 },
            }}
          />

          <Textarea
            label="Descrição"
            placeholder="Descrição da trilha"
            radius="xl"
            size="md"
            minRows={3}
            autosize
            value={trail.description}
            onChange={(e) => {
              const value = e.currentTarget.value;
              setTrail((prev) => ({ ...prev, description: value }));
            }}
            styles={{
              input: {
                background: "var(--input-bg)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              },
              label: { color: "var(--text-primary)", marginBottom: 6 },
            }}
          />

          <NumberInput
            label="Ordem da trilha"
            description="Define a posição desta trilha no kanban. Não pode haver duas trilhas com a mesma ordem."
            placeholder="Ex: 1"
            required
            radius="xl"
            size="md"
            min={1}
            value={trail.sortOrder}
            onChange={(value) =>
              setTrail((prev) => ({
                ...prev,
                sortOrder: Number(value) || 1,
              }))
            }
            styles={{
              input: {
                background: "var(--input-bg)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              },
              label: { color: "var(--text-primary)", marginBottom: 6 },
              description: { color: "var(--text-secondary)" },
            }}
          />

          <Group>
            <Switch
              label={trail.active ? "Ativa" : "Inativa"}
              checked={trail.active}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                setTrail((prev) => ({ ...prev, active: checked }));
              }}
              size="md"
              color="violet"
              styles={{
                label: { color: "var(--text-primary)", cursor: "pointer" },
              }}
            />
          </Group>

          <Group justify="flex-end" mt="10px">
            <Button
              variant="default"
              radius="xl"
              size="md"
              onClick={() => navigate("/admin/trails")}
            >
              Cancelar
            </Button>
            <Button
              radius="xl"
              size="md"
              variant="gradient"
              gradient={{ from: "violet", to: "blue" }}
              loading={saving}
              onClick={handleSave}
            >
              {isNew ? "Criar Trilha" : "Salvar Alterações"}
            </Button>
          </Group>

        </Stack>

      </Paper>

    </Stack>
  );
}
