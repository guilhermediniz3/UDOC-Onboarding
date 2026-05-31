import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Group,
  MultiSelect,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";

import {
  IconArrowLeft,
  IconBrandYoutube,
  IconCalendar,
  IconCheck,
  IconCopy,
  IconInfoCircle,
  IconLink,
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

import {
  getSessionsByRoom,
  replaceRoomSessions,
  type ConflictDetail,
  type TrainingSessionData,
} from "../../services/trainingSessionService";

import { getAllCompaniesSimple } from "../../services/companyService";
import { getAllIsmsSimple } from "../../services/ismService";
import { getEmployees } from "../../services/employeeService";
import { getTrails } from "../../services/trailService";

import { useAuth } from "../../contexts/AuthContext";

import type { TrainingRoom } from "../../types/TrainingRoom";
import type { Company } from "../../types/Company";
import type { ISM } from "../../types/ISM";

/* ── video helpers ── */

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

/* ── conflict message helper ── */

function conflictMessage(c: ConflictDetail): string {
  const label = c.conflictType === "ISM"
    ? `ISM "${c.entityName}"`
    : c.conflictType === "COMPANY"
    ? `Empresa "${c.entityName}"`
    : `Funcionário Externo "${c.entityName}"`;
  return `${label} já está na sala "${c.trainingRoomTitle}" no dia ${c.date} das ${c.startTime} às ${c.endTime}.`;
}

/* ── tipos ── */

interface DayRow {
  dayNumber: number;
  date: string;      // "YYYY-MM-DD" — formato do input type="date"
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

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

/* ── componente principal ── */

export default function AdminTrainingRoom() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;
  const { user } = useAuth();

  /* ── detalhes ── */
  const [room, setRoom] = useState<TrainingRoom>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  /* ── lookups ── */
  const [companies, setCompanies] = useState<Company[]>([]);
  const [ismsData, setIsmsData] = useState<ISM[]>([]);
  const [employees, setEmployees] = useState<{ value: string; label: string }[]>([]);
  const [trails, setTrails] = useState<{ value: string; label: string }[]>([]);

  /* ── vídeo ── */
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  /* ── jitsi ── */
  const [showJitsi, setShowJitsi] = useState(false);
  const [jitsiLink, setJitsiLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const jitsiApiRef = useRef<any>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);

  /* ── agendamento ── */
  const [totalDays, setTotalDays] = useState<number>(0);
  const [days, setDays] = useState<DayRow[]>([]);
  const [recurringTime, setRecurringTime] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState("");
  const [scheduleMsgType, setScheduleMsgType] = useState<"success" | "error">("success");

  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type); setMessage(text); setTimeout(() => setMessage(""), 4000);
  }

  function showScheduleMsg(type: "success" | "error", text: string) {
    setScheduleMsgType(type);
    setScheduleMsg(text);
    // Conflitos ficam 30s para dar tempo de leitura; sucesso some em 4s
    const ms = type === "error" ? 30_000 : 4_000;
    setTimeout(() => setScheduleMsg(""), ms);
  }

  /* ── carregamento inicial ── */
  useEffect(() => {
    getAllCompaniesSimple().then(setCompanies);
    getAllIsmsSimple().then(setIsmsData);
    getEmployees({ size: 1000 }).then((r) =>
      setEmployees(r.content.map((e) => ({ value: String(e.id), label: e.name })))
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

      // Load existing sessions
      getSessionsByRoom(Number(id)).then((sessions) => {
        if (sessions.length > 0) {
          setTotalDays(sessions.length);
          setDays(sessions.map((s) => ({
            dayNumber: s.dayNumber,
            date: s.date || "",
            startTime: s.startTime || "",
            endTime: s.endTime || "",
          })));
        }
      });
    }
  }, [id]);

  /* cleanup Jitsi */
  useEffect(() => {
    return () => { if (jitsiApiRef.current) jitsiApiRef.current.dispose(); };
  }, []);

  /* ── controla quantidade de dias ── */
  function handleTotalDaysChange(value: number) {
    const n = Math.max(0, value);
    setTotalDays(n);
    setDays((prev) => {
      if (n > prev.length) {
        const added: DayRow[] = [];
        for (let i = prev.length + 1; i <= n; i++) {
          added.push({
            dayNumber: i,
            date: "",
            startTime: recurringTime && prev[0] ? prev[0].startTime : "",
            endTime: recurringTime && prev[0] ? prev[0].endTime : "",
          });
        }
        return [...prev, ...added];
      }
      return prev.slice(0, n);
    });
  }

  /* ── atualiza um dia ── */
  function updateDay(index: number, field: keyof DayRow, value: any) {
    setDays((prev) => {
      const next = [...prev];
      (next[index] as any)[field] = value;

      // Horário recorrente: replica a partir do dia 1
      if (recurringTime && index === 0 && (field === "startTime" || field === "endTime")) {
        for (let i = 1; i < next.length; i++) {
          (next[i] as any)[field] = value;
        }
      }

      return next;
    });
  }

  /* ── salvar detalhes ── */
  async function handleSave() {
    if (!room.title.trim()) { showMessage("error", "O título é obrigatório."); return; }
    setSaving(true);
    try {
      const payload = {
        title: room.title, description: room.description,
        companyId: room.companyId ?? null, ismId: room.ismId ?? null,
        trailId: room.trailId ?? null, sortOrder: room.sortOrder,
        status: room.status, vimeoUrl: room.vimeoUrl, youtubeUrl: room.youtubeUrl,
        active: room.active, invitedEmployeeIds: room.invitedEmployeeIds ?? [],
      };
      if (isNew) {
        await createTrainingRoom(payload);
        showMessage("success", "Sala criada! Agora você pode agendar os dias na aba Agendamento.");
        setTimeout(() => navigate("/admin/training-rooms"), 1500);
      } else {
        await updateTrainingRoom(Number(id), payload);
        showMessage("success", "Sala atualizada com sucesso!");
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showMessage("error", e?.response?.data?.message || "Erro ao salvar a sala.");
    } finally { setSaving(false); }
  }

  /* ── salvar agendamento ── */
  async function handleSaveSchedule() {
    if (!id) { showScheduleMsg("error", "Salve a sala antes de agendar os dias."); return; }

    const incomplete = days.some((d) => !d.date || !d.startTime || !d.endTime);
    if (incomplete) { showScheduleMsg("error", "Preencha data, hora início e hora término de todos os dias."); return; }

    const invalidTime = days.some((d) => d.startTime >= d.endTime);
    if (invalidTime) { showScheduleMsg("error", "A hora de início deve ser menor que a hora de término em todos os dias."); return; }

    setSavingSchedule(true);
    try {
      const payload: TrainingSessionData[] = days.map((d) => ({
        dayNumber: d.dayNumber,
        date: d.date,
        startTime: d.startTime,
        endTime: d.endTime,
      }));

      await replaceRoomSessions(Number(id), payload);
      showScheduleMsg("success", "Agendamento salvo com sucesso!");
    } catch (err: unknown) {
      const e = err as {
        response?: {
          data?: {
            message?: string;
            conflicts?: ConflictDetail[];
          };
        };
      };

      const conflicts = e?.response?.data?.conflicts;
      if (conflicts && conflicts.length > 0) {
        const msgs = conflicts.map(conflictMessage).join("\n");
        showScheduleMsg("error", msgs);
      } else {
        showScheduleMsg("error", e?.response?.data?.message || "Erro ao salvar o agendamento.");
      }
    } finally { setSavingSchedule(false); }
  }

  /* ── jitsi ── */
  function stopJitsi() {
    if (jitsiApiRef.current) {
      try { jitsiApiRef.current.dispose(); } catch (_) { /* ignora erros de dispose */ }
      jitsiApiRef.current = null;
    }
    setShowJitsi(false);
    setJitsiLink("");
    setLinkCopied(false);
  }

  function handleStartJitsi() {
    // Garante limpeza antes de iniciar nova sessão
    if (jitsiApiRef.current) {
      try { jitsiApiRef.current.dispose(); } catch (_) {}
      jitsiApiRef.current = null;
    }

    const roomId = room.jitsiRoomId || `udoc-${Date.now()}`;
    const link = `https://meet.jit.si/${roomId}`;
    setJitsiLink(link);
    setShowJitsi(true);

    const displayName = user?.name || "ISM";

    const init = () => {
      // Aguarda o container React ser montado no DOM
      setTimeout(() => {
        if (!jitsiContainerRef.current) return;

        jitsiApiRef.current = new (window as any).JitsiMeetExternalAPI("meet.jit.si", {
          roomName: roomId,
          width: "100%",
          height: "100%",
          parentNode: jitsiContainerRef.current,
          userInfo: { displayName },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              "microphone", "camera", "desktop",
              "hangup", "chat", "participants-pane", "tileview",
            ],
            SHOW_JITSI_WATERMARK: false,
          },
        });

        // Quando o usuário clica em "Sair" dentro do Jitsi → encerra limpo
        jitsiApiRef.current.addEventListener("readyToClose", () => {
          stopJitsi();
        });
      }, 100);
    };

    if ((window as any).JitsiMeetExternalAPI) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.onload = init;
      document.head.appendChild(script);
    }
  }

  function handleStopJitsi() {
    stopJitsi();
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(jitsiLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    });
  }

  function handleEmbedUrl() {
    const url = videoUrlInput.trim();
    const yt = getYoutubeEmbedUrl(url);
    if (yt) { setEmbedUrl(yt); const v = videoUrlInput; setRoom((p) => ({ ...p, youtubeUrl: v, vimeoUrl: "" })); return; }
    const vimeo = getVimeoEmbedUrl(url);
    if (vimeo) { setEmbedUrl(vimeo); const v = videoUrlInput; setRoom((p) => ({ ...p, vimeoUrl: v, youtubeUrl: "" })); return; }
    showMessage("error", "URL inválida. Cole uma URL do YouTube ou Vimeo.");
  }

  /* ── estilos ── */
  const inputStyles = {
    input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
    label: { color: "var(--text-primary)", marginBottom: 6 },
  };

  const companyOptions = companies.map((c) => ({ value: String(c.id), label: c.name }));
  const ismOptions = ismsData.map((i) => ({ value: String(i.id), label: i.name }));
  const statusOptions = [
    { value: "AGENDADA", label: "Agendada" },
    { value: "EM_ANDAMENTO", label: "Em andamento" },
    { value: "CONCLUIDA", label: "Concluída" },
    { value: "CANCELADA", label: "Cancelada" },
  ];

  /* ── render ── */
  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      {/* Header */}
      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
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
                color={
                  room.status === "CONCLUIDA"   ? "green"  :
                  room.status === "EM_ANDAMENTO" ? "orange" :
                  room.status === "CANCELADA"    ? "red"    : "blue"
                }
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
        <Alert color={messageType === "success" ? "green" : "red"}
          icon={messageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />}
          radius="xl">
          {message}
        </Alert>
      )}

      {/* Abas */}
      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>

        <Tabs defaultValue="detalhes" color="violet">

          <Tabs.List mb="xl">
            <Tabs.Tab value="detalhes" leftSection={<IconInfoCircle size={16} />}>Detalhes</Tabs.Tab>
            <Tabs.Tab value="agendamento" leftSection={<IconCalendar size={16} />}>Agendamento</Tabs.Tab>
            <Tabs.Tab value="treinamento" leftSection={<IconVideo size={16} />}>Treinamento</Tabs.Tab>
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
                onChange={(vals) => setRoom((p) => ({ ...p, invitedEmployeeIds: vals.map(Number) }))}
                styles={inputStyles} />

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
                <Button variant="default" radius="xl" size="md" onClick={() => navigate("/admin/training-rooms")}>Cancelar</Button>
                <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }}
                  loading={saving} onClick={handleSave}>
                  {isNew ? "Criar Sala" : "Salvar Alterações"}
                </Button>
              </Group>

            </Stack>
          </Tabs.Panel>

          {/* ── ABA AGENDAMENTO ── */}
          <Tabs.Panel value="agendamento">
            <Stack gap="24px">

              {isNew && (
                <Alert color="blue" radius="xl" variant="light">
                  <Text fz="sm">Salve a sala primeiro na aba <strong>Detalhes</strong> para poder agendar os dias.</Text>
                </Alert>
              )}

              {scheduleMsg && (
                <Alert
                  color={scheduleMsgType === "success" ? "green" : "red"}
                  icon={scheduleMsgType === "success" ? <IconCheck size={18} /> : <IconX size={18} />}
                  radius="xl"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {scheduleMsg}
                </Alert>
              )}

              <Group align="flex-end" gap="lg">
                <NumberInput
                  label="Quantidade de dias de treinamento"
                  description="Define quantos dias terá este treinamento"
                  placeholder="Ex: 3"
                  radius="xl" size="md" min={0} max={365}
                  value={totalDays}
                  onChange={(v) => handleTotalDaysChange(Number(v) || 0)}
                  disabled={isNew}
                  styles={inputStyles}
                  style={{ flex: 1 }}
                />
                {totalDays > 1 && (
                  <Checkbox
                    label="Horário recorrente"
                    description="Replica o horário do Dia 1 para todos os outros dias"
                    checked={recurringTime}
                    onChange={(e) => {
                      const checked = e.currentTarget.checked;
                      setRecurringTime(checked);
                      if (checked && days[0]) {
                        const { startTime, endTime } = days[0];
                        setDays((prev) =>
                          prev.map((d, i) => i === 0 ? d : { ...d, startTime, endTime })
                        );
                      }
                    }}
                    styles={{ label: { color: "var(--text-primary)" }, description: { color: "var(--text-secondary)" } }}
                    mb={6}
                  />
                )}
              </Group>

              {days.length > 0 && (
                <Paper radius="16px" style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                  <Table verticalSpacing="md">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th c="var(--text-primary)" w={80}>Dia</Table.Th>
                        <Table.Th c="var(--text-primary)">Data</Table.Th>
                        <Table.Th c="var(--text-primary)">Hora início</Table.Th>
                        <Table.Th c="var(--text-primary)">Hora término</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {days.map((day, index) => (
                        <Table.Tr key={day.dayNumber}>
                          <Table.Td>
                            <Badge variant="light" color="violet" radius="xl">
                              Dia {day.dayNumber}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <input
                              type="date"
                              value={day.date}
                              onChange={(e) => updateDay(index, "date", e.currentTarget.value)}
                              style={{
                                width: 150,
                                padding: "6px 12px",
                                borderRadius: 20,
                                border: "1px solid var(--border-color)",
                                background: "var(--input-bg)",
                                color: "var(--text-primary)",
                                fontSize: 14,
                                outline: "none",
                              }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <input
                              type="time"
                              value={day.startTime}
                              onChange={(e) => updateDay(index, "startTime", e.currentTarget.value)}
                              disabled={recurringTime && index > 0}
                              style={{
                                width: 110,
                                padding: "6px 12px",
                                borderRadius: 20,
                                border: "1px solid var(--border-color)",
                                background: "var(--input-bg)",
                                color: "var(--text-primary)",
                                fontSize: 14,
                                outline: "none",
                                opacity: recurringTime && index > 0 ? 0.5 : 1,
                              }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <input
                              type="time"
                              value={day.endTime}
                              onChange={(e) => updateDay(index, "endTime", e.currentTarget.value)}
                              disabled={recurringTime && index > 0}
                              style={{
                                width: 110,
                                padding: "6px 12px",
                                borderRadius: 20,
                                border: "1px solid var(--border-color)",
                                background: "var(--input-bg)",
                                color: "var(--text-primary)",
                                fontSize: 14,
                                outline: "none",
                                opacity: recurringTime && index > 0 ? 0.5 : 1,
                              }}
                            />
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Paper>
              )}

              {days.length > 0 && (
                <Group justify="flex-end">
                  <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }}
                    leftSection={<IconCalendar size={16} />}
                    loading={savingSchedule} onClick={handleSaveSchedule} disabled={isNew}>
                    Salvar Agendamento
                  </Button>
                </Group>
              )}

            </Stack>
          </Tabs.Panel>

          {/* ── ABA TREINAMENTO ── */}
          <Tabs.Panel value="treinamento">
            <Stack gap="24px">

              {/* Ao vivo — Jitsi */}
              <Paper p="20px" radius="16px" style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>

                <Group justify="space-between" align="center" mb={showJitsi ? "md" : 0}>
                  <div>
                    <Text fw={700} c="var(--text-primary)" fz="md">Treinamento ao vivo</Text>
                    <Text c="var(--text-secondary)" fz="sm">
                      {room.jitsiRoomId
                        ? <>ID da sala: <b>{room.jitsiRoomId}</b></>
                        : "A sala será criada ao clicar em Iniciar ao vivo"}
                    </Text>
                  </div>
                  <Group gap="sm">
                    {!showJitsi ? (
                      <Button leftSection={<IconPlayerPlay size={18} />} radius="xl" size="md"
                        variant="gradient" gradient={{ from: "green", to: "teal" }}
                        onClick={handleStartJitsi}>
                        Iniciar ao vivo
                      </Button>
                    ) : (
                      <Button leftSection={<IconPlayerStop size={18} />} radius="xl" size="md"
                        color="red" variant="light" onClick={handleStopJitsi}>
                        Encerrar sessão
                      </Button>
                    )}
                  </Group>
                </Group>

                {/* Link de convite — aparece quando a sessão está ativa */}
                {showJitsi && jitsiLink && (
                  <Group
                    gap="sm"
                    mb="md"
                    p="12px"
                    style={{ background: "rgba(34,197,94,0.08)", borderRadius: 12, border: "1px solid rgba(34,197,94,0.3)" }}
                  >
                    <IconLink size={16} color="var(--mantine-color-green-6)" />
                    <Text fz="sm" c="var(--text-primary)" style={{ flex: 1, wordBreak: "break-all" }}>
                      <b>Link para convidar:</b> {jitsiLink}
                    </Text>
                    <Button
                      size="xs"
                      radius="xl"
                      variant="light"
                      color={linkCopied ? "green" : "violet"}
                      leftSection={linkCopied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      onClick={handleCopyLink}
                    >
                      {linkCopied ? "Copiado!" : "Copiar link"}
                    </Button>
                  </Group>
                )}

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

              {/* Embed de vídeo */}
              <Paper p="20px" radius="16px" style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                <Text fw={700} c="var(--text-primary)" fz="md" mb="md">Vídeo gravado</Text>
                <Group mb="md" align="flex-end">
                  <TextInput
                    label="URL do YouTube ou Vimeo"
                    placeholder="https://www.youtube.com/watch?v=..."
                    leftSection={<IconBrandYoutube size={16} />}
                    radius="xl" size="md"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.currentTarget.value)}
                    style={{ flex: 1 }}
                    styles={inputStyles}
                  />
                  <Button radius="xl" size="md" variant="light" color="violet" onClick={handleEmbedUrl}>
                    Incorporar
                  </Button>
                </Group>
                {embedUrl && (
                  <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16/9" }}>
                    <iframe src={embedUrl} width="100%" height="100%"
                      style={{ border: "none", display: "block" }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen />
                  </div>
                )}
              </Paper>

              <Group justify="flex-end">
                <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }}
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
