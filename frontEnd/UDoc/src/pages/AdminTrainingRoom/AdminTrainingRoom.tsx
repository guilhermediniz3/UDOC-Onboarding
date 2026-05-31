import {
  Alert,
  Badge,
  Button,
  Group,
  MultiSelect,
  NumberInput,
  Paper,
  Select,
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
  IconBrandYoutube,
  IconCheck,
  IconInfoCircle,
  IconPlayerPlay,
  IconPlayerStop,
  IconVideo,
  IconX,
} from "@tabler/icons-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate, useParams } from "react-router-dom";

import {
  createTrainingRoom,
  getTrainingRoomById,
  updateTrainingRoom,
} from "../../services/trainingRoomService";

import { getAllCompaniesSimple } from "../../services/companyService";
import { getAllIsmsSimple } from "../../services/ismService";
import { getEmployees } from "../../services/employeeService";
import { getTrails } from "../../services/trailService";

import type { TrainingRoom } from "../../types/TrainingRoom";
import type { Company } from "../../types/Company";
import type { ISM } from "../../types/ISM";

/* ── helpers para embed de vídeo ── */

function getYoutubeEmbedUrl(url: string): string | null {
  const regexes = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?/]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const re of regexes) {
    const m = url.match(re);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

/* ── estado inicial ── */

const EMPTY: TrainingRoom = {
  title: "",
  description: "",
  sortOrder: 0,
  status: "AGENDADA",
  active: true,
  vimeoUrl: "",
  youtubeUrl: "",
  invitedEmployeeIds: [],
};

/* ── componente ── */

export default function AdminTrainingRoom() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  /* form state */
  const [room, setRoom] = useState<TrainingRoom>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  /* lookup data */
  const [companies, setCompanies] = useState<Company[]>([]);
  const [ismsData, setIsmsData] = useState<ISM[]>([]);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [trails, setTrails] = useState<{ value: string; label: string }[]>([]);

  /* video embed */
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  /* jitsi */
  const [showJitsi, setShowJitsi] = useState(false);
  const jitsiApiRef = useRef<any>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  }

  /* carrega dados iniciais */
  useEffect(() => {
    getAllCompaniesSimple().then(setCompanies);
    getAllIsmsSimple().then(setIsmsData);

    getEmployees({ size: 1000 }).then((r) =>
      setEmployees(
        r.content.map((e) => ({ value: String(e.id), label: e.name }))
      )
    );

    getTrails({ size: 1000 }).then((r) =>
      setTrails(r.content.map((t) => ({ value: String(t.id), label: t.name })))
    );

    if (!isNew) {
      getTrainingRoomById(Number(id)).then((data) => {
        setRoom(data);
        if (data.youtubeUrl) {
          const u = getYoutubeEmbedUrl(data.youtubeUrl);
          if (u) setEmbedUrl(u);
        } else if (data.vimeoUrl) {
          const u = getVimeoEmbedUrl(data.vimeoUrl);
          if (u) setEmbedUrl(u);
        }
      });
    }
  }, [id]);

  /* cleanup Jitsi ao sair */
  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, []);

  /* ── handlers ── */

  async function handleSave() {
    if (!room.title.trim()) {
      showMessage("error", "O título é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: room.title,
        description: room.description,
        companyId: room.companyId ?? null,
        ismId: room.ismId ?? null,
        trailId: room.trailId ?? null,
        sortOrder: room.sortOrder,
        status: room.status,
        vimeoUrl: room.vimeoUrl,
        youtubeUrl: room.youtubeUrl,
        active: room.active,
        invitedEmployeeIds: room.invitedEmployeeIds ?? [],
      };
      if (isNew) {
        await createTrainingRoom(payload);
        showMessage("success", "Sala criada com sucesso!");
        setTimeout(() => navigate("/admin/training-rooms"), 1200);
      } else {
        await updateTrainingRoom(Number(id), payload);
        showMessage("success", "Sala atualizada com sucesso!");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showMessage("error", error?.response?.data?.message || "Erro ao salvar a sala.");
    } finally {
      setSaving(false);
    }
  }

  function handleEmbedUrl() {
    const url = videoUrlInput.trim();
    const youtube = getYoutubeEmbedUrl(url);
    if (youtube) {
      setEmbedUrl(youtube);
      const value = videoUrlInput;
      setRoom((prev) => ({ ...prev, youtubeUrl: value, vimeoUrl: "" }));
      return;
    }
    const vimeo = getVimeoEmbedUrl(url);
    if (vimeo) {
      setEmbedUrl(vimeo);
      const value = videoUrlInput;
      setRoom((prev) => ({ ...prev, vimeoUrl: value, youtubeUrl: "" }));
      return;
    }
    showMessage("error", "URL inválida. Cole uma URL do YouTube ou Vimeo.");
  }

  function handleStartJitsi() {
    const roomId = room.jitsiRoomId || `udoc-${Date.now()}`;
    setShowJitsi(true);

    const initJitsi = () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }

      const options = {
        roomName: roomId,
        width: "100%",
        height: "100%",
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "desktop",
            "hangup",
            "chat",
            "participants-pane",
            "tileview",
          ],
          SHOW_JITSI_WATERMARK: false,
        },
      };

      jitsiApiRef.current = new (window as any).JitsiMeetExternalAPI(
        "meet.jit.si",
        options
      );
    };

    if ((window as any).JitsiMeetExternalAPI) {
      initJitsi();
    } else {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.onload = initJitsi;
      document.head.appendChild(script);
    }
  }

  function handleStopJitsi() {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.dispose();
      jitsiApiRef.current = null;
    }
    setShowJitsi(false);
  }

  /* ── estilos reutilizáveis ── */

  const inputStyles = {
    input: {
      background: "var(--input-bg)",
      border: "1px solid var(--border-color)",
      color: "var(--text-primary)",
    },
    label: { color: "var(--text-primary)", marginBottom: 6 },
  };

  /* ── select options ── */

  const companyOptions = companies.map((c) => ({ value: String(c.id), label: c.name }));
  const ismOptions = ismsData.map((i) => ({ value: String(i.id), label: i.name }));

  const statusOptions = [
    { value: "AGENDADA", label: "Agendada" },
    { value: "EM_ANDAMENTO", label: "Em andamento" },
    { value: "CONCLUIDA", label: "Concluída" },
  ];

  /* ── render ── */

  return (

    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      {/* Header */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} c="var(--text-primary)">
              {isNew ? "Nova Sala de Treinamento" : "Editar Sala de Treinamento"}
            </Title>
            <Text c="var(--text-secondary)" mt={4}>
              {isNew ? "Preencha os dados para criar uma nova sala" : room.title}
            </Text>
          </div>
          <Group gap="sm">
            {!isNew && (
              <Badge
                color={room.status === "CONCLUIDA" ? "green" : room.status === "EM_ANDAMENTO" ? "orange" : "blue"}
                radius="xl" size="lg" variant="light"
              >
                {statusOptions.find((s) => s.value === room.status)?.label || room.status}
              </Badge>
            )}
            <Button leftSection={<IconArrowLeft size={18} />} variant="default" radius="xl" size="md"
              onClick={() => navigate("/admin/training-rooms")}>
              Voltar
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Alerta global */}
      {message && (
        <Alert
          color={messageType === "success" ? "green" : "red"}
          icon={messageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />}
          radius="xl"
        >
          {message}
        </Alert>
      )}

      {/* Tabs */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>

        <Tabs defaultValue="detalhes" color="violet">

          <Tabs.List mb="xl">
            <Tabs.Tab value="detalhes" leftSection={<IconInfoCircle size={16} />}>
              Detalhes
            </Tabs.Tab>
            <Tabs.Tab value="treinamento" leftSection={<IconVideo size={16} />}>
              Treinamento
            </Tabs.Tab>
          </Tabs.List>

          {/* ── ABA DETALHES ── */}
          <Tabs.Panel value="detalhes">
            <Stack gap="20px">

              <TextInput label="Título" placeholder="Título da sala" required radius="xl" size="md"
                value={room.title}
                onChange={(e) => { const v = e.currentTarget.value; setRoom((p) => ({ ...p, title: v })); }}
                styles={inputStyles} />

              <Textarea label="Descrição" placeholder="Descreva o objetivo do treinamento"
                radius="xl" size="md" minRows={3} autosize
                value={room.description}
                onChange={(e) => { const v = e.currentTarget.value; setRoom((p) => ({ ...p, description: v })); }}
                styles={inputStyles} />

              <Select label="Empresa" placeholder="Selecione a empresa"
                radius="xl" size="md" clearable searchable
                data={companyOptions}
                value={room.companyId ? String(room.companyId) : null}
                onChange={(v) => setRoom((p) => ({ ...p, companyId: v ? Number(v) : undefined }))}
                styles={inputStyles} />

              <MultiSelect
                label="Funcionários Externos Convidados"
                placeholder="Selecione os convidados"
                radius="xl" size="md" searchable clearable
                data={employees}
                value={(room.invitedEmployeeIds ?? []).map(String)}
                onChange={(vals) =>
                  setRoom((p) => ({
                    ...p,
                    invitedEmployeeIds: vals.map(Number),
                  }))
                }
                styles={inputStyles}
              />

              <Select label="ISM Responsável" placeholder="Selecione o ISM"
                radius="xl" size="md" clearable searchable
                data={ismOptions}
                value={room.ismId ? String(room.ismId) : null}
                onChange={(v) => setRoom((p) => ({ ...p, ismId: v ? Number(v) : undefined }))}
                styles={inputStyles} />

              <Select label="Trilha vinculada" placeholder="Selecione a trilha"
                radius="xl" size="md" clearable searchable
                data={trails}
                value={room.trailId ? String(room.trailId) : null}
                onChange={(v) => setRoom((p) => ({ ...p, trailId: v ? Number(v) : undefined }))}
                styles={inputStyles} />

              <NumberInput label="Ordem na trilha" placeholder="Ex: 1"
                radius="xl" size="md" min={0}
                value={room.sortOrder}
                onChange={(v) => setRoom((p) => ({ ...p, sortOrder: Number(v) || 0 }))}
                styles={inputStyles} />

              <Select label="Situação" placeholder="Selecione a situação"
                radius="xl" size="md"
                data={statusOptions}
                value={room.status}
                onChange={(v) => v && setRoom((p) => ({ ...p, status: v as TrainingRoom["status"] }))}
                styles={inputStyles} />

              <Group>
                <Switch
                  label={room.active ? "Ativa" : "Inativa"}
                  checked={room.active}
                  onChange={(e) => { const c = e.currentTarget.checked; setRoom((p) => ({ ...p, active: c })); }}
                  size="md" color="violet"
                  styles={{ label: { color: "var(--text-primary)", cursor: "pointer" } }}
                />
              </Group>

              <Group justify="flex-end" mt="10px">
                <Button variant="default" radius="xl" size="md"
                  onClick={() => navigate("/admin/training-rooms")}>
                  Cancelar
                </Button>
                <Button radius="xl" size="md" variant="gradient"
                  gradient={{ from: "violet", to: "blue" }}
                  loading={saving} onClick={handleSave}>
                  {isNew ? "Criar Sala" : "Salvar Alterações"}
                </Button>
              </Group>

            </Stack>
          </Tabs.Panel>

          {/* ── ABA TREINAMENTO ── */}
          <Tabs.Panel value="treinamento">
            <Stack gap="24px">

              {/* Ao vivo — Jitsi */}
              <Paper p="20px" radius="16px"
                style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                <Group justify="space-between" align="center" mb="md">
                  <div>
                    <Text fw={700} c="var(--text-primary)" fz="md">Treinamento ao vivo</Text>
                    <Text c="var(--text-secondary)" fz="sm">
                      Sala Jitsi: <b>{room.jitsiRoomId || "será gerada ao salvar"}</b>
                    </Text>
                  </div>
                  {!showJitsi ? (
                    <Button
                      leftSection={<IconPlayerPlay size={18} />}
                      radius="xl" size="md" variant="gradient"
                      gradient={{ from: "green", to: "teal" }}
                      onClick={handleStartJitsi}
                    >
                      Iniciar ao vivo
                    </Button>
                  ) : (
                    <Button
                      leftSection={<IconPlayerStop size={18} />}
                      radius="xl" size="md" color="red" variant="light"
                      onClick={handleStopJitsi}
                    >
                      Encerrar
                    </Button>
                  )}
                </Group>

                {showJitsi && (
                  <div
                    ref={jitsiContainerRef}
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      height: "75vh",
                      minHeight: 600,
                      border: "1px solid var(--border-color)",
                    }}
                  />
                )}
              </Paper>

              {/* Embed de vídeo gravado */}
              <Paper p="20px" radius="16px"
                style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                <Text fw={700} c="var(--text-primary)" fz="md" mb="md">Vídeo gravado</Text>

                <Group mb="md" align="flex-end">
                  <TextInput
                    label="URL do YouTube ou Vimeo"
                    placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                    leftSection={<IconBrandYoutube size={16} />}
                    radius="xl" size="md"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.currentTarget.value)}
                    style={{ flex: 1 }}
                    styles={inputStyles}
                  />
                  <Button radius="xl" size="md" variant="light" color="violet"
                    onClick={handleEmbedUrl}>
                    Incorporar
                  </Button>
                </Group>

                {embedUrl && (
                  <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16/9" }}>
                    <iframe
                      src={embedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: "none", display: "block" }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </Paper>

              {/* Salvar */}
              <Group justify="flex-end">
                <Button radius="xl" size="md" variant="gradient"
                  gradient={{ from: "violet", to: "blue" }}
                  loading={saving} onClick={handleSave}>
                  Salvar Alterações
                </Button>
              </Group>

            </Stack>
          </Tabs.Panel>

        </Tabs>

      </Paper>

    </Stack>
  );
}
