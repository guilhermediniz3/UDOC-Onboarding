import {
  Alert,
  Button,
  Group,
  NumberInput,
  Paper,
  Stack,
  Switch,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";

import {
  IconArrowLeft,
  IconCheck,
  IconFileText,
  IconInfoCircle,
  IconMoodSmile,
  IconStar,
  IconX,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createTrail,
  getTrailById,
  getTrails,
  updateTrail,
} from "../../services/trailService";

import type { Trail } from "../../types/Trail";

import TrailContentTab from "./TrailContentTab";
import TrailCertificationTab from "./TrailCertificationTab";
import NpsQuestionEditor from "../../components/Nps/NpsQuestionEditor";

const EMPTY_TRAIL: Trail = {
  name: "",
  description: "",
  active: true,
  sortOrder: 1,
};

const inputStyles = {
  input: {
    background: "var(--input-bg)",
    border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
  },
  label: { color: "var(--text-primary)", marginBottom: 6 },
  description: { color: "var(--text-secondary)" },
};

export default function AdminTrail() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [trail, setTrail] = useState<Trail>(EMPTY_TRAIL);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  }

  useEffect(() => {
    if (!isNew) {
      getTrailById(Number(id)).then(setTrail);
    } else {
      // Nova trilha: pré-preenche com a próxima ordem sequencial disponível
      getTrails({ size: 200 })
        .then((r) => {
          const maxOrder = r.content.length > 0
            ? Math.max(...r.content.map((t) => t.sortOrder ?? 0))
            : 0;
          setTrail((p) => ({ ...p, sortOrder: maxOrder + 1 }));
        })
        .catch(() => {}); // mantém sortOrder = 1 se falhar
    }
  }, [id]);

  async function handleSave() {
    if (!trail.name.trim()) { showMessage("error", "O nome da trilha é obrigatório."); return; }
    if (!trail.sortOrder || trail.sortOrder < 1) { showMessage("error", "A ordem deve ser um número maior que zero."); return; }
    setSaving(true);
    try {
      const payload = { name: trail.name, description: trail.description, active: trail.active, sortOrder: trail.sortOrder };
      if (isNew) {
        await createTrail(payload);
        showMessage("success", "Trilha criada! Agora você pode adicionar conteúdo e configurar a certificação.");
        setTimeout(() => navigate("/admin/trails"), 1200);
      } else {
        await updateTrail(Number(id), payload);
        showMessage("success", "Trilha atualizada com sucesso!");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showMessage("error", error?.response?.data?.message || "Erro ao salvar a trilha.");
    } finally { setSaving(false); }
  }

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      {/* Header */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} c="var(--text-primary)">{isNew ? "Nova Trilha" : "Editar Trilha"}</Title>
            <Text c="var(--text-secondary)" mt={4}>{isNew ? "Preencha os dados para criar uma nova trilha" : trail.name}</Text>
          </div>
          <Button leftSection={<IconArrowLeft size={18} />} variant="default" radius="xl" size="md"
            onClick={() => navigate("/admin/trails")}>Voltar</Button>
        </Group>
      </Paper>

      {/* Abas */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>

        <Tabs defaultValue="dados" color="violet">

          <Tabs.List mb="xl">
            <Tabs.Tab value="dados" leftSection={<IconInfoCircle size={16} />}>Dados</Tabs.Tab>
            {!isNew && <Tabs.Tab value="conteudo" leftSection={<IconFileText size={16} />}>Conteúdo</Tabs.Tab>}
            {!isNew && <Tabs.Tab value="certificacao" leftSection={<IconStar size={16} />}>Certificação</Tabs.Tab>}
            {!isNew && <Tabs.Tab value="nps" leftSection={<IconMoodSmile size={16} />}>Pesquisa NPS</Tabs.Tab>}
          </Tabs.List>

          {/* ── DADOS ── */}
          <Tabs.Panel value="dados">
            <Stack gap="20px">

              {message && (
                <Alert color={messageType === "success" ? "green" : "red"}
                  icon={messageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />} radius="xl">
                  {message}
                </Alert>
              )}

              {isNew && (
                <Alert color="blue" radius="xl" variant="light">
                  <Text fz="sm">Salve a trilha primeiro para depois vincular conteúdo e configurar a certificação.</Text>
                </Alert>
              )}

              <TextInput label="Nome" placeholder="Nome da trilha" required radius="xl" size="md"
                value={trail.name}
                onChange={(e) => { const v = e.currentTarget.value; setTrail((p) => ({ ...p, name: v })); }}
                styles={inputStyles} />

              <Textarea label="Descrição" placeholder="Descrição da trilha" radius="xl" size="md" minRows={3} autosize
                value={trail.description}
                onChange={(e) => { const v = e.currentTarget.value; setTrail((p) => ({ ...p, description: v })); }}
                styles={inputStyles} />

              <NumberInput label="Ordem da trilha" description="Define a posição desta trilha no kanban."
                placeholder="Ex: 1" required radius="xl" size="md" min={1}
                value={trail.sortOrder}
                onChange={(v) => setTrail((p) => ({ ...p, sortOrder: Number(v) || 1 }))}
                styles={inputStyles} />

              <Group>
                <Switch label={trail.active ? "Ativa" : "Inativa"} checked={trail.active}
                  onChange={(e) => { const c = e.currentTarget.checked; setTrail((p) => ({ ...p, active: c })); }}
                  size="md" color="violet"
                  styles={{ label: { color: "var(--text-primary)", cursor: "pointer" } }} />
              </Group>

              <Group justify="flex-end" mt="10px">
                <Button variant="default" radius="xl" size="md" onClick={() => navigate("/admin/trails")}>Cancelar</Button>
                <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }}
                  loading={saving} onClick={handleSave}>
                  {isNew ? "Criar Trilha" : "Salvar Alterações"}
                </Button>
              </Group>

            </Stack>
          </Tabs.Panel>

          {/* ── CONTEÚDO ── */}
          {!isNew && (
            <Tabs.Panel value="conteudo">
              <TrailContentTab trailId={Number(id)} />
            </Tabs.Panel>
          )}

          {/* ── CERTIFICAÇÃO ── */}
          {!isNew && (
            <Tabs.Panel value="certificacao">
              <TrailCertificationTab trailId={Number(id)} />
            </Tabs.Panel>
          )}

          {/* ── NPS ── */}
          {!isNew && (
            <Tabs.Panel value="nps">
              <NpsQuestionEditor refType="trail" refId={Number(id)} />
            </Tabs.Panel>
          )}

        </Tabs>
      </Paper>

    </Stack>
  );
}
