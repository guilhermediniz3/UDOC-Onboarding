import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Checkbox,
  Collapse,
  Group,
  Loader,
  Modal,
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
  Tooltip,
} from "@mantine/core";

import {
  IconArrowLeft,
  IconBrandWhatsapp,
  IconBrandYoutube,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconCopy,
  IconFileText,
  IconInfoCircle,
  IconLink,
  IconDeviceTv,
  IconLock,
  IconMail,
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
  IconPlayerRecord,
  IconRobot,
  IconTrash,
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
  getNextTrailOrder,
  getTrainingRoomById,
  sendTrainingInvite,
  updateTrainingRoom,
} from "../../services/trainingRoomService";

import {
  uploadRoomRecording,
  getRoomRecordings,
  deleteRoomRecording,
  getRecordingFileUrl,
  type VideoRecordingInfo,
} from "../../services/recordingService";

import {
  getSessionsByRoom,
  replaceRoomSessions,
  type ConflictDetail,
  type TrainingSessionData,
} from "../../services/trainingSessionService";

import { getAllCompaniesSimple } from "../../services/companyService";
import { getStorageInfo } from "../../services/storageService";
import { getAllIsmsSimple } from "../../services/ismService";
import { getEmployees } from "../../services/employeeService";
import type { Employee } from "../../types/Employee";
import { getTrails } from "../../services/trailService";

import { useAuth } from "../../contexts/AuthContext";

import type { TrainingRoom } from "../../types/TrainingRoom";
import type { Company } from "../../types/Company";
import type { ISM } from "../../types/ISM";
import type { TranscricaoTrecho } from "../../types/TranscricaoTrecho";
import type { SessaoTreinamento } from "../../types/SessaoTreinamento";
import type { Rat } from "../../types/Rat";

import { salvarTrecho, listarTranscricaoPorSessao, enviarAudioChunk } from "../../services/transcricaoService";
import {
  criarSessao,
  encerrarSessao,
  listarSessoesPorSala,
} from "../../services/sessaoTreinamentoService";
import {
  createRat,
  updateRat,
  finalizarRat,
  reabrirRat,
  gerarRatComIA,
  getRatById,
} from "../../services/ratService";
import RichTextEditor from "../../components/RichTextEditor/RichTextEditor";

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

function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent ?? tmp.innerText ?? "";
}

/* ── tipos ── */

interface DayRow {
  dayNumber: number;
  date: string;
  startTime: string;
  endTime: string;
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
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
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

  /* ── convites ── */
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteMsg, setInviteMsg]         = useState("");

  /* ── cota de armazenamento ── */
  const [storagePct, setStoragePct] = useState(0);

  /* ── gravação ── */
  const [recordings, setRecordings]       = useState<VideoRecordingInfo[]>([]);
  const [isRecording, setIsRecording]     = useState(false);
  const [uploadingRec, setUploadingRec]   = useState(false);
  const [recSeconds, setRecSeconds]       = useState(0);
  const recChunksRef  = useRef<Blob[]>([]);
  const mediaRecRef   = useRef<MediaRecorder | null>(null);
  const recTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── transcrição de voz ── */
  const [transcricaoEstado, setTranscricaoEstado] = useState<"idle" | "recording" | "paused">("idle");
  const transcricaoEstadoRef = useRef<"idle" | "recording" | "paused">("idle");
  const [transcricaoSuportada] = useState(() =>
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const [displayMediaSuportado] = useState(() =>
    typeof navigator !== "undefined" &&
    typeof (navigator.mediaDevices as any)?.getDisplayMedia === "function"
  );
  const reconRef = useRef<any>(null);
  const [transcricaoTrechos, setTranscricaoTrechos] = useState<TranscricaoTrecho[]>([]);

  /* ── sessão de captura ── */
  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoTreinamento | null>(null);
  const [encerrando, setEncerrando] = useState(false);
  const sessaoAtivaRef = useRef<SessaoTreinamento | null>(null);
  const [modoCapturaAtivo, setModoCapturaAtivo] = useState<"SOLO" | "COMPLETO" | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const displayAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const destStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const modoCapturaAtivoRef = useRef<"SOLO" | "COMPLETO" | null>(null);
  const gravandoRef = useRef(false);

  /* ── aba RAT — lista de sessões ── */
  const [sessoes, setSessoes] = useState<SessaoTreinamento[]>([]);
  const [loadingSessoes, setLoadingSessoes] = useState(false);

  /* ── aba RAT — detalhe ── */
  const [sessaoSelecionada, setSessaoSelecionada] = useState<SessaoTreinamento | null>(null);
  const [ratSessaoId, setRatSessaoId] = useState<number | null>(null);
  const [ratSessaoTitulo, setRatSessaoTitulo] = useState("");
  const [ratSessaoTituloError, setRatSessaoTituloError] = useState("");
  const [ratSessaoConteudo, setRatSessaoConteudo] = useState("");
  const [ratSessaoKey, setRatSessaoKey] = useState(0);
  const [ratSessaoStatus, setRatSessaoStatus] = useState<"SEM_RAT" | "RASCUNHO" | "FINALIZADO">("SEM_RAT");
  const [transcricaoSessaoAberta, setTranscricaoSessaoAberta] = useState(false);
  const [transcricaoSessaoTrechos, setTranscricaoSessaoTrechos] = useState<TranscricaoTrecho[]>([]);
  const [loadingTranscricaoSessao, setLoadingTranscricaoSessao] = useState(false);
  const [gerandoRat, setGerandoRat] = useState(false);
  const [salvandoRascunho, setSalvandoRascunho] = useState(false);
  const [finalizandoRat, setFinalizandoRat] = useState(false);
  const [ratDetailMsg, setRatDetailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const ratSessaoTituloRef = useRef<HTMLInputElement>(null);

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

  function showRatDetailMsg(type: "success" | "error", text: string) {
    setRatDetailMsg({ type, text }); setTimeout(() => setRatDetailMsg(null), 4000);
  }

  function showScheduleMsg(type: "success" | "error", text: string) {
    setScheduleMsgType(type);
    setScheduleMsg(text);
    const ms = type === "error" ? 30_000 : 4_000;
    setTimeout(() => setScheduleMsg(""), ms);
  }

  /* ── carregamento inicial ── */
  useEffect(() => {
    if (user?.role === "ADMIN") {
      getStorageInfo().then((s) => setStoragePct(s.pct)).catch(() => {});
    }
    getAllCompaniesSimple().then(setCompanies);
    getAllIsmsSimple().then(setIsmsData);
    getEmployees({ size: 1000 }).then((r) => setAllEmployees(r.content));
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

      getRoomRecordings(Number(id)).then(setRecordings);

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
      if (recurringTime && index === 0 && (field === "startTime" || field === "endTime")) {
        for (let i = 1; i < next.length; i++) {
          (next[i] as any)[field] = value;
        }
      }
      return next;
    });
  }

  /* ── transcrição ── */
  function setEstado(e: "idle" | "recording" | "paused") {
    transcricaoEstadoRef.current = e;
    setTranscricaoEstado(e);
  }

  async function iniciarCapturaSolo() {
    if (!id || !transcricaoSuportada) return;
    try {
      const sessao = await criarSessao(Number(id), "SOLO");
      setSessaoAtiva(sessao);
      sessaoAtivaRef.current = sessao;
      setModoCapturaAtivo("SOLO");
      iniciarSpeech(sessao.id);
    } catch {
      showMessage("error", "Erro ao criar sessão de captura.");
    }
  }

  async function iniciarCapturaCompleto() {
    if (!id || !displayMediaSuportado) return;

    let displayStream: MediaStream;
    try {
      displayStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
    } catch {
      return; // cancelado pelo usuário
    }

    if (displayStream.getAudioTracks().length === 0) {
      displayStream.getTracks().forEach((t) => t.stop());
      showMessage("error", "Nenhuma fonte de áudio selecionada. Marque 'Compartilhar áudio da aba' ao escolher a aba.");
      return;
    }

    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      displayStream.getTracks().forEach((t) => t.stop());
      showMessage("error", "Não foi possível acessar o microfone.");
      return;
    }

    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    audioCtx.createMediaStreamSource(micStream).connect(dest);
    audioCtx.createMediaStreamSource(displayStream).connect(dest);

    displayStreamRef.current = displayStream;
    displayAudioCtxRef.current = audioCtx;
    micStreamRef.current = micStream;
    destStreamRef.current = dest.stream;

    displayStream.getVideoTracks()[0]?.addEventListener("ended", () => encerrarCaptura());

    let sessao;
    try {
      sessao = await criarSessao(Number(id), "COMPLETO");
    } catch {
      [displayStream, micStream].forEach((s) => s.getTracks().forEach((t) => t.stop()));
      audioCtx.close();
      displayStreamRef.current = null;
      displayAudioCtxRef.current = null;
      micStreamRef.current = null;
      destStreamRef.current = null;
      showMessage("error", "Erro ao criar sessão de captura.");
      return;
    }

    setSessaoAtiva(sessao);
    sessaoAtivaRef.current = sessao;
    setModoCapturaAtivo("COMPLETO");
    modoCapturaAtivoRef.current = "COMPLETO";
    gravandoRef.current = true;
    setEstado("recording");

    iniciarGravacaoChunk(dest.stream, Number(id), sessao.id);
  }

  function iniciarGravacaoChunk(stream: MediaStream, trainingRoomId: number, sessaoId: number) {
    const chunks: Blob[] = [];
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "";
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = async () => {
      if (chunks.length > 0 && sessaoAtivaRef.current?.id === sessaoId) {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        const trecho = await enviarAudioChunk(trainingRoomId, sessaoId, blob);
        if (trecho) setTranscricaoTrechos((prev) => [...prev, trecho]);
      }
      if (gravandoRef.current) {
        iniciarGravacaoChunk(stream, trainingRoomId, sessaoId);
      }
    };

    recorder.start();
    setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, 15000);
  }

  function iniciarSpeech(sessaoId: number) {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const texto = event.results[i][0].transcript.trim();
          if (texto) {
            salvarTrecho(Number(id), texto, sessaoId)
              .then((t) => setTranscricaoTrechos((prev) => [...prev, t]))
              .catch(() => {});
          }
        }
      }
    };
    rec.onend = () => {
      if (transcricaoEstadoRef.current === "recording") {
        try { rec.start(); } catch (_) {}
      }
    };
    reconRef.current = rec;
    rec.start();
    setEstado("recording");
  }

  function pausarTranscricao() {
    if (modoCapturaAtivoRef.current === "COMPLETO") {
      gravandoRef.current = false;
      if (mediaRecorderRef.current?.state !== "inactive") {
        try { mediaRecorderRef.current?.stop(); } catch (_) {}
      }
    } else {
      if (reconRef.current) { try { reconRef.current.stop(); } catch (_) {} }
    }
    setEstado("paused");
  }

  function retormarTranscricao() {
    if (modoCapturaAtivoRef.current === "COMPLETO") {
      if (destStreamRef.current && sessaoAtivaRef.current && id) {
        gravandoRef.current = true;
        setEstado("recording");
        iniciarGravacaoChunk(destStreamRef.current, Number(id), sessaoAtivaRef.current.id);
      }
    } else {
      if (!reconRef.current) return;
      try { reconRef.current.start(); } catch (_) {}
      setEstado("recording");
    }
  }

  async function encerrarCaptura() {
    if (!sessaoAtivaRef.current) return;

    // Para Web Speech API (Solo)
    if (reconRef.current) { try { reconRef.current.abort(); } catch (_) {} reconRef.current = null; }

    // Para MediaRecorder (Completo) — seta gravandoRef=false antes para onstop não reiniciar
    gravandoRef.current = false;
    if (mediaRecorderRef.current?.state !== "inactive") {
      try { mediaRecorderRef.current?.stop(); } catch (_) {}
    }
    mediaRecorderRef.current = null;

    // Para as tracks de captura (mic e display) — AudioContext fecha depois, abaixo
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach((t) => t.stop()); micStreamRef.current = null; }
    if (displayStreamRef.current) { displayStreamRef.current.getTracks().forEach((t) => t.stop()); displayStreamRef.current = null; }
    destStreamRef.current = null;

    setEstado("idle");
    setModoCapturaAtivo(null);
    modoCapturaAtivoRef.current = null;
    setEncerrando(true);
    try {
      await encerrarSessao(sessaoAtivaRef.current.id);
      setSessaoAtiva(null);
      sessaoAtivaRef.current = null;
      setTranscricaoTrechos([]);
      showMessage("success", "Sessão encerrada — RAT disponível na aba RAT");
      carregarSessoes();
    } catch {
      showMessage("error", "Erro ao encerrar sessão.");
    } finally {
      setEncerrando(false);
      // Fecha AudioContext só após encerrarSessao para garantir que onstop
      // do MediaRecorder já enviou o chunk final antes do contexto ser destruído
      if (displayAudioCtxRef.current) { try { displayAudioCtxRef.current.close(); } catch (_) {} displayAudioCtxRef.current = null; }
    }
  }

  /* ── aba RAT — sessões ── */
  async function carregarSessoes() {
    if (!id) return;
    setLoadingSessoes(true);
    try {
      const list = await listarSessoesPorSala(Number(id));
      setSessoes(list);
    } catch { /* silencioso */ }
    finally { setLoadingSessoes(false); }
  }

  async function abrirSessaoDetalhe(sessao: SessaoTreinamento) {
    setSessaoSelecionada(sessao);
    setRatSessaoStatus(sessao.ratStatus);
    setRatSessaoId(sessao.ratId ?? null);
    setRatSessaoTitulo("");
    setRatSessaoConteudo("");
    setRatSessaoKey((k) => k + 1);
    setTranscricaoSessaoAberta(false);
    setTranscricaoSessaoTrechos([]);
    setRatDetailMsg(null);

    setLoadingTranscricaoSessao(true);
    try {
      const trechos = await listarTranscricaoPorSessao(sessao.id);
      setTranscricaoSessaoTrechos(trechos);
    } catch { /* silencioso */ }
    finally { setLoadingTranscricaoSessao(false); }

    if (sessao.ratId) {
      try {
        const rat = await getRatById(sessao.ratId);
        setRatSessaoTitulo(rat.titulo);
        setRatSessaoConteudo(rat.conteudo ?? "");
        setRatSessaoKey((k) => k + 1);
      } catch { /* silencioso */ }
    }
  }

  async function handleGerarRatIA() {
    if (!sessaoSelecionada) return;
    setGerandoRat(true);
    try {
      const html = await gerarRatComIA(sessaoSelecionada.id);
      setRatSessaoConteudo(html);
      setRatSessaoKey((k) => k + 1);
      showRatDetailMsg("success", "RAT gerado com sucesso! Revise e salve.");
    } catch (err: any) {
      showRatDetailMsg("error", err?.response?.data?.message || "Erro ao gerar RAT. Verifique se há transcrição disponível.");
    } finally {
      setGerandoRat(false);
    }
  }

  async function handleSalvarRascunho() {
    if (!sessaoSelecionada) return;
    const titulo = (ratSessaoTitulo ?? "").trim();
    const conteudo = (ratSessaoConteudo ?? "").trim();
    if (!titulo) {
      setRatSessaoTituloError("Informe o título do RAT.");
      ratSessaoTituloRef.current?.focus();
      return;
    }
    if (!conteudo || conteudo === "<p></p>") {
      showRatDetailMsg("error", "O conteúdo do RAT está vazio.");
      return;
    }
    setRatSessaoTituloError("");
    setSalvandoRascunho(true);
    try {
      let rat: Rat;
      if (ratSessaoId) {
        rat = await updateRat(ratSessaoId, {
          sessaoId: sessaoSelecionada.id,
          titulo,
          conteudo,
          companyId: room.companyId ?? null,
          ismId: room.ismId ?? null,
        });
      } else {
        rat = await createRat({
          sessaoId: sessaoSelecionada.id,
          titulo,
          conteudo,
          companyId: room.companyId ?? null,
          ismId: room.ismId ?? null,
        });
        setRatSessaoId(rat.id);
      }
      setRatSessaoStatus("RASCUNHO");
      setSessaoSelecionada((s) => s ? { ...s, ratStatus: "RASCUNHO", ratId: rat.id } : s);
      setSessoes((prev) => prev.map((s) =>
        s.id === sessaoSelecionada.id ? { ...s, ratStatus: "RASCUNHO", ratId: rat.id } : s
      ));
      showRatDetailMsg("success", "Rascunho salvo.");
    } catch (err: any) {
      showRatDetailMsg("error", err?.response?.data?.message || "Erro ao salvar rascunho.");
    } finally {
      setSalvandoRascunho(false);
    }
  }

  async function handleFinalizarRat() {
    if (!sessaoSelecionada) return;
    const titulo = (ratSessaoTitulo ?? "").trim();
    const conteudo = (ratSessaoConteudo ?? "").trim();
    if (!titulo) {
      setRatSessaoTituloError("Informe o título do RAT.");
      ratSessaoTituloRef.current?.focus();
      return;
    }
    if (!conteudo || conteudo === "<p></p>") {
      showRatDetailMsg("error", "O conteúdo do RAT está vazio.");
      return;
    }
    setRatSessaoTituloError("");
    setFinalizandoRat(true);
    try {
      let currentId = ratSessaoId;
      // Cria o RAT se ainda não existe
      if (!currentId) {
        const rat = await createRat({
          sessaoId: sessaoSelecionada.id,
          titulo,
          conteudo,
          companyId: room.companyId ?? null,
          ismId: room.ismId ?? null,
        });
        currentId = rat.id;
        setRatSessaoId(rat.id);
      } else {
        // Garante que o conteúdo mais recente está salvo
        await updateRat(currentId, {
          sessaoId: sessaoSelecionada.id,
          titulo,
          conteudo,
          companyId: room.companyId ?? null,
          ismId: room.ismId ?? null,
        });
      }
      await finalizarRat(currentId);
      setSessoes(prev => prev.filter(s => s.id !== sessaoSelecionada!.id));
      setSessaoSelecionada(null);
      showMessage("success", "RAT finalizado — disponível em Meus RATs");
    } catch (err: any) {
      showRatDetailMsg("error", err?.response?.data?.message || "Erro ao finalizar RAT.");
    } finally {
      setFinalizandoRat(false);
    }
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
        dayNumber: d.dayNumber, date: d.date, startTime: d.startTime, endTime: d.endTime,
      }));
      await replaceRoomSessions(Number(id), payload);
      showScheduleMsg("success", "Agendamento salvo com sucesso!");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; conflicts?: ConflictDetail[] } } };
      const conflicts = e?.response?.data?.conflicts;
      if (conflicts && conflicts.length > 0) {
        showScheduleMsg("error", conflicts.map(conflictMessage).join("\n"));
      } else {
        showScheduleMsg("error", e?.response?.data?.message || "Erro ao salvar o agendamento.");
      }
    } finally { setSavingSchedule(false); }
  }

  /* ── jitsi ── */
  function stopJitsi() {
    if (jitsiApiRef.current) {
      try { jitsiApiRef.current.dispose(); } catch (_) {}
      jitsiApiRef.current = null;
    }
    setShowJitsi(false);
    setJitsiLink("");
    setLinkCopied(false);
  }

  function handleStartJitsi() {
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
      setTimeout(() => {
        if (!jitsiContainerRef.current) return;
        jitsiApiRef.current = new (window as any).JitsiMeetExternalAPI("meet.jit.si", {
          roomName: roomId, width: "100%", height: "100%",
          parentNode: jitsiContainerRef.current,
          userInfo: { displayName },
          configOverwrite: { prejoinPageEnabled: false, startWithAudioMuted: false, startWithVideoMuted: false },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: ["microphone", "camera", "desktop", "hangup", "chat", "participants-pane", "tileview"],
            SHOW_JITSI_WATERMARK: false,
          },
        });
        jitsiApiRef.current.addEventListener("readyToClose", () => stopJitsi());
      }, 100);
    };
    if ((window as any).JitsiMeetExternalAPI) { init(); } else {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.onload = init;
      document.head.appendChild(script);
    }
  }

  function handleStopJitsi() { stopJitsi(); }

  function handleCopyLink() {
    navigator.clipboard.writeText(jitsiLink).then(() => {
      setLinkCopied(true); setTimeout(() => setLinkCopied(false), 3000);
    });
  }

  function handleWhatsApp() {
    const msg = encodeURIComponent(`🎓 *${room.title || "Treinamento"}*\nOlá! O treinamento está iniciando. Acesse pelo link:\n${jitsiLink}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  async function handleSendEmailInvite() {
    if (!id) return;
    setSendingInvite(true); setInviteMsg("");
    try {
      const { sent, emails } = await sendTrainingInvite(Number(id), jitsiLink);
      setInviteMsg(sent > 0 ? `✓ Enviado para: ${emails.join(", ")}` : "Nenhum funcionário convidado tem e-mail cadastrado.");
    } catch {
      setInviteMsg("Erro ao enviar convites. Verifique as configurações de e-mail.");
    } finally {
      setSendingInvite(false); setTimeout(() => setInviteMsg(""), 5000);
    }
  }

  /* ── Gravação de tela ── */
  async function handleStartRecording() {
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: { mediaSource: "screen" }, audio: true });
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      recChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recChunksRef.current.push(e.data); };
      recorder.onstop = () => stream.getTracks().forEach((t: any) => t.stop());
      recorder.start(1000);
      mediaRecRef.current = recorder;
      setIsRecording(true); setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch (e: any) {
      if (e?.name !== "NotAllowedError") alert("Erro ao iniciar gravação: " + e?.message);
    }
  }

  async function handleStopRecording() {
    if (!mediaRecRef.current || !id) return;
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    const duration = recSeconds;
    mediaRecRef.current.stop();
    mediaRecRef.current = null;
    setIsRecording(false); setUploadingRec(true);
    await new Promise((r) => setTimeout(r, 500));
    try {
      const blob = new Blob(recChunksRef.current, { type: "video/webm" });
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const rec = await uploadRoomRecording(Number(id), blob, `gravacao_${ts}.webm`, duration);
      setRecordings((prev) => [rec, ...prev]);
    } catch { alert("Erro ao fazer upload da gravação."); }
    finally { setUploadingRec(false); recChunksRef.current = []; }
  }

  async function handleDeleteRecording(recId: number) {
    if (!confirm("Excluir esta gravação permanentemente?")) return;
    await deleteRoomRecording(recId);
    setRecordings((prev) => prev.filter((r) => r.id !== recId));
  }

  function formatRecDuration(s: number) {
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  function handleEmbedUrl() {
    const url = videoUrlInput.trim();
    const yt = getYoutubeEmbedUrl(url);
    if (yt) { setEmbedUrl(yt); const v = videoUrlInput; setRoom((p) => ({ ...p, youtubeUrl: v, vimeoUrl: "" })); return; }
    const vimeo = getVimeoEmbedUrl(url);
    if (vimeo) { setEmbedUrl(vimeo); const v = videoUrlInput; setRoom((p) => ({ ...p, vimeoUrl: v, youtubeUrl: "" })); return; }
    showMessage("error", "URL inválida. Cole uma URL do YouTube ou Vimeo.");
  }

  /* ── helpers de display ── */
  function formatDataHora(iso: string) {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }

  function ratStatusBadge(s: "SEM_RAT" | "RASCUNHO" | "FINALIZADO") {
    if (s === "FINALIZADO") return <Badge color="green" variant="light" radius="xl">Finalizado</Badge>;
    if (s === "RASCUNHO")   return <Badge color="orange" variant="light" radius="xl">Rascunho</Badge>;
    return <Badge color="gray" variant="light" radius="xl">Sem RAT</Badge>;
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
                  room.status === "CONCLUIDA"    ? "green"  :
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
            <Tabs.Tab
              value="rat"
              leftSection={<IconFileText size={16} />}
              disabled={isNew}
              onClick={carregarSessoes}
            >
              RAT
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
                onChange={(v) => {
                  const newCompanyId = v ? Number(v) : undefined;
                  setRoom((p) => ({
                    ...p, companyId: newCompanyId,
                    invitedEmployeeIds: newCompanyId
                      ? (p.invitedEmployeeIds ?? []).filter((eid) =>
                          allEmployees.find((e) => e.id === eid)?.companyId === newCompanyId)
                      : p.invitedEmployeeIds,
                  }));
                }}
                styles={inputStyles} />

              <MultiSelect
                label="Funcionários Convidados"
                description="Apenas funcionários externos (das empresas clientes)"
                placeholder={room.companyId ? "Selecione os convidados" : "Selecione uma empresa primeiro"}
                radius="xl" size="md" searchable clearable
                data={allEmployees
                  .filter((e) => (e.tipo || "EXTERNO") === "EXTERNO")
                  .filter((e) => !room.companyId || e.companyId === room.companyId)
                  .map((e) => ({ value: String(e.id), label: e.name }))}
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
                onChange={async (v) => {
                  const newTrailId = v ? Number(v) : undefined;
                  setRoom((p) => ({ ...p, trailId: newTrailId }));
                  if (isNew && newTrailId) {
                    try {
                      const nextOrder = await getNextTrailOrder(newTrailId);
                      setRoom((p) => ({ ...p, trailId: newTrailId, sortOrder: nextOrder }));
                    } catch { /* mantém o valor atual */ }
                  }
                }}
                styles={inputStyles} />

              <NumberInput
                label="Ordem na trilha"
                description={isNew ? "Preenchido automaticamente com a próxima posição." : "Ao salvar, salas com a mesma ordem serão deslocadas para frente."}
                placeholder="Ex: 1" radius="xl" size="md" min={0}
                value={room.sortOrder}
                onChange={(v) => setRoom((p) => ({ ...p, sortOrder: Number(v) || 0 }))}
                styles={{ ...inputStyles, description: { color: "var(--text-secondary)", marginTop: 4 } }}
              />

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
                  radius="xl" style={{ whiteSpace: "pre-wrap" }}
                >
                  {scheduleMsg}
                </Alert>
              )}

              <Group align="flex-end" gap="lg">
                <NumberInput
                  label="Quantidade de dias de treinamento"
                  description="Define quantos dias terá este treinamento"
                  placeholder="Ex: 3" radius="xl" size="md" min={0} max={365}
                  value={totalDays}
                  onChange={(v) => handleTotalDaysChange(Number(v) || 0)}
                  disabled={isNew}
                  styles={inputStyles} style={{ flex: 1 }}
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
                        setDays((prev) => prev.map((d, i) => i === 0 ? d : { ...d, startTime, endTime }));
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
                            <Badge variant="light" color="violet" radius="xl">Dia {day.dayNumber}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <input type="date" value={day.date}
                              onChange={(e) => updateDay(index, "date", e.currentTarget.value)}
                              style={{ width: 150, padding: "6px 12px", borderRadius: 20, border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <input type="time" value={day.startTime}
                              onChange={(e) => updateDay(index, "startTime", e.currentTarget.value)}
                              disabled={recurringTime && index > 0}
                              style={{ width: 110, padding: "6px 12px", borderRadius: 20, border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, outline: "none", opacity: recurringTime && index > 0 ? 0.5 : 1 }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <input type="time" value={day.endTime}
                              onChange={(e) => updateDay(index, "endTime", e.currentTarget.value)}
                              disabled={recurringTime && index > 0}
                              style={{ width: 110, padding: "6px 12px", borderRadius: 20, border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, outline: "none", opacity: recurringTime && index > 0 ? 0.5 : 1 }}
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

              {storagePct >= 90 && (
                <Alert color={storagePct >= 100 ? "red" : "orange"} radius="xl" variant="light"
                  icon={<IconInfoCircle size={16} />} mb="sm">
                  {storagePct >= 100
                    ? "Espaço de armazenamento esgotado. Acesse as Configurações para liberar espaço ou aumentar a cota."
                    : `Atenção: ${storagePct}% do espaço de gravações está sendo utilizado.`}
                </Alert>
              )}

              {/* Ao vivo — Jitsi */}
              <Paper p="20px" radius="16px" style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                <Group justify="space-between" align="center" mb={showJitsi ? "md" : 0}>
                  <div>
                    <Text fw={700} c="var(--text-primary)" fz="md">Treinamento ao vivo</Text>
                    <Text c="var(--text-secondary)" fz="sm">
                      {room.jitsiRoomId ? <>ID da sala: <b>{room.jitsiRoomId}</b></> : "A sala será criada ao clicar em Iniciar ao vivo"}
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

                {showJitsi && jitsiLink && (
                  <Stack gap="8px" mb="md">
                    <Group gap="sm" p="12px"
                      style={{ background: "rgba(34,197,94,0.08)", borderRadius: 12, border: "1px solid rgba(34,197,94,0.3)" }}>
                      <IconLink size={16} color="var(--mantine-color-green-6)" />
                      <Text fz="sm" c="var(--text-primary)" style={{ flex: 1, wordBreak: "break-all" }}>
                        <b>Link:</b> {jitsiLink}
                      </Text>
                      <Button size="xs" radius="xl" variant="light"
                        color={linkCopied ? "green" : "violet"}
                        leftSection={linkCopied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        onClick={handleCopyLink}>
                        {linkCopied ? "Copiado!" : "Copiar"}
                      </Button>
                      <Tooltip label="Enviar convite pelo WhatsApp Web" withArrow>
                        <Button size="xs" radius="xl" variant="light" color="green"
                          leftSection={<IconBrandWhatsapp size={14} />} onClick={handleWhatsApp}>
                          WhatsApp
                        </Button>
                      </Tooltip>
                      <Tooltip label="Enviar convite por e-mail para todos os funcionários convidados" withArrow>
                        <Button size="xs" radius="xl" variant="light" color="blue"
                          leftSection={<IconMail size={14} />}
                          loading={sendingInvite} onClick={handleSendEmailInvite}>
                          E-mail
                        </Button>
                      </Tooltip>
                    </Group>
                    {inviteMsg && (
                      <Text fz="xs" c={inviteMsg.startsWith("✓") ? "green" : "orange"} pl="4px">{inviteMsg}</Text>
                    )}
                  </Stack>
                )}

                {showJitsi && (
                  <div ref={jitsiContainerRef}
                    style={{ borderRadius: 12, overflow: "hidden", height: "75vh", minHeight: 600, border: "1px solid var(--border-color)" }}
                  />
                )}
              </Paper>

              {/* Captura de voz */}
              <Paper p="20px" radius="16px" style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                <Group justify="space-between" align="center" mb="md">
                  <div>
                    <Text fw={700} c="var(--text-primary)" fz="md">Transcrição da sessão</Text>
                    <Text fz="xs" c="var(--text-secondary)">
                      Transcreve a fala do microfone em tempo real via Web Speech API (Chrome/Edge).
                    </Text>
                  </div>
                  <Group gap="sm">
                    {transcricaoEstado === "recording" && (
                      <Badge color="red" variant="dot" size="lg" radius="xl">
                        {modoCapturaAtivo === "COMPLETO" ? "Gravando os dois lados" : "Gravando"}
                      </Badge>
                    )}
                    {sessaoAtiva && (
                      <Badge color="teal" variant="light" size="sm" radius="xl">
                        Sessão #{sessaoAtiva.id}
                      </Badge>
                    )}
                  </Group>
                </Group>

                {!transcricaoSuportada ? (
                  <Alert color="orange" radius="xl" variant="light" icon={<IconMicrophoneOff size={16} />}>
                    Seu navegador não suporta a Web Speech API. Use Chrome ou Edge para transcrição de voz.
                  </Alert>
                ) : isNew ? (
                  <Text fz="xs" c="var(--text-secondary)">Salve a sala primeiro para habilitar a transcrição.</Text>
                ) : (
                  <Stack gap="sm">
                    <Group gap="sm" align="flex-start">
                      {transcricaoEstado === "idle" && (
                        <>
                          <Stack gap="4px" align="center">
                            <Button leftSection={<IconMicrophone size={16} />}
                              radius="xl" size="sm" color="green" variant="light"
                              onClick={iniciarCapturaSolo}>
                              Iniciar Solo
                            </Button>
                            <Text fz="10px" c="var(--text-secondary)" ta="center" maw={140}>
                              Captura apenas seu microfone. Ideal para sessões rápidas.
                            </Text>
                          </Stack>
                          <Tooltip
                            disabled={displayMediaSuportado}
                            label="disponível em Chrome/Edge — o modo Completo requer compartilhamento de aba com áudio"
                            withArrow multiline w={240}>
                            <Stack gap="4px" align="center">
                              <Button leftSection={<IconDeviceTv size={16} />}
                                radius="xl" size="sm" color="violet" variant="light"
                                disabled={!displayMediaSuportado}
                                onClick={() => setShowConsentModal(true)}>
                                Iniciar Completo
                              </Button>
                              <Text fz="10px" c="var(--text-secondary)" ta="center" maw={160}>
                                Captura seu microfone + áudio da aba do treinamento. Necessário compartilhar a aba com áudio ao iniciar.
                              </Text>
                            </Stack>
                          </Tooltip>
                        </>
                      )}
                      {transcricaoEstado === "recording" && (
                        <>
                          <Button leftSection={<IconPlayerPause size={16} />}
                            radius="xl" size="sm" color="orange" variant="light"
                            onClick={pausarTranscricao}>
                            Pausar
                          </Button>
                          <Button leftSection={<IconPlayerStop size={16} />}
                            radius="xl" size="sm" color="red" variant="light"
                            loading={encerrando} onClick={encerrarCaptura}>
                            Encerrar sessão
                          </Button>
                        </>
                      )}
                      {transcricaoEstado === "paused" && (
                        <>
                          <Button leftSection={<IconPlayerPlay size={16} />}
                            radius="xl" size="sm" color="green" variant="light"
                            onClick={retormarTranscricao}>
                            Retomar
                          </Button>
                          <Button leftSection={<IconPlayerStop size={16} />}
                            radius="xl" size="sm" color="red" variant="light"
                            loading={encerrando} onClick={encerrarCaptura}>
                            Encerrar sessão
                          </Button>
                        </>
                      )}
                    </Group>

                    {transcricaoTrechos.length > 0 && (
                      <Stack gap="4px" mt="xs"
                        style={{ maxHeight: 200, overflowY: "auto", padding: "12px", borderRadius: 10, background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                        {transcricaoTrechos.map((t) => (
                          <Group key={t.id} gap="xs" align="flex-start" wrap="nowrap">
                            <Text fz="10px" c="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 2 }}>
                              {new Date(t.timestamp).toLocaleTimeString("pt-BR")}
                            </Text>
                            <Text fz="sm" c="var(--text-primary)">{t.texto}</Text>
                          </Group>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                )}
              </Paper>

              {/* Embed de vídeo */}
              <Paper p="20px" radius="16px" style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                <Text fw={700} c="var(--text-primary)" fz="md" mb="md">Vídeo gravado</Text>
                <Group mb="md" align="flex-end">
                  <TextInput label="URL do YouTube ou Vimeo"
                    placeholder="https://www.youtube.com/watch?v=..."
                    leftSection={<IconBrandYoutube size={16} />}
                    radius="xl" size="md"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.currentTarget.value)}
                    style={{ flex: 1 }} styles={inputStyles}
                  />
                  <Button radius="xl" size="md" variant="light" color="violet" onClick={handleEmbedUrl}>Incorporar</Button>
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

              {/* Gravação de tela */}
              <Paper p="20px" radius="16px" style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                <Group justify="space-between" align="center" mb="md">
                  <div>
                    <Text fw={700} c="var(--text-primary)" fz="md">Gravação da tela</Text>
                    <Text fz="xs" c="var(--text-secondary)">
                      Grava a tela do seu navegador e salva no sistema como backup do Vimeo.
                    </Text>
                  </div>
                  <Group gap="sm">
                    {!isRecording ? (
                      <Tooltip disabled={storagePct < 100}
                        label="Espaço de armazenamento esgotado." withArrow multiline w={260}>
                        <Button leftSection={<IconPlayerRecord size={16} />}
                          radius="xl" size="sm" color="red" variant="light"
                          loading={uploadingRec} onClick={handleStartRecording}
                          disabled={isNew || storagePct >= 100}>
                          {uploadingRec ? "Enviando..." : "Iniciar gravação"}
                        </Button>
                      </Tooltip>
                    ) : (
                      <Group gap="sm">
                        <Text fz="sm" c="red" fw={700}>⏺ {formatRecDuration(recSeconds)}</Text>
                        <Button leftSection={<IconPlayerStop size={16} />}
                          radius="xl" size="sm" color="red" variant="filled"
                          onClick={handleStopRecording}>
                          Parar e salvar
                        </Button>
                      </Group>
                    )}
                  </Group>
                </Group>

                {isNew && <Text fz="xs" c="var(--text-secondary)">Salve a sala primeiro para habilitar a gravação.</Text>}

                {recordings.length > 0 && (
                  <Stack gap="12px">
                    {recordings.map((rec) => (
                      <Paper key={rec.id} p="12px" radius="12px"
                        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                        <Group justify="space-between" mb="8px">
                          <div>
                            <Text fz="sm" fw={600} c="var(--text-primary)">{rec.filename}</Text>
                            <Text fz="xs" c="var(--text-secondary)">
                              {rec.durationSeconds != null ? formatRecDuration(rec.durationSeconds) : "—"}
                              {rec.fileSize != null ? ` · ${(rec.fileSize / 1024 / 1024).toFixed(1)} MB` : ""}
                              {" · "}{new Date(rec.createdAt).toLocaleString("pt-BR")}
                            </Text>
                          </div>
                          <ActionIcon size="sm" radius="xl" color="red" variant="light"
                            onClick={() => handleDeleteRecording(rec.id)}>
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                        <video controls style={{ width: "100%", borderRadius: 8, maxHeight: 320, background: "#000" }}
                          src={getRecordingFileUrl(rec.id)} />
                      </Paper>
                    ))}
                  </Stack>
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

          {/* ── ABA RAT ── */}
          <Tabs.Panel value="rat">

            {/* ── Detalhe de sessão ── */}
            {sessaoSelecionada ? (
              <Stack gap="20px">

                {/* Cabeçalho do detalhe */}
                <Group justify="space-between" align="center">
                  <Group gap="sm">
                    <Button size="xs" radius="xl" variant="default"
                      leftSection={<IconArrowLeft size={14} />}
                      onClick={() => { setSessaoSelecionada(null); setRatDetailMsg(null); }}>
                      Voltar à lista
                    </Button>
                    <Text fw={700} c="var(--text-primary)" fz="md">
                      Sessão de {formatDataHora(sessaoSelecionada.dataHoraInicio)}
                    </Text>
                    {ratStatusBadge(ratSessaoStatus)}
                  </Group>
                </Group>

                {/* Transcrição recolhível */}
                <Paper p="16px" radius="14px" style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                  <Group justify="space-between" align="center" style={{ cursor: "pointer" }}
                    onClick={() => setTranscricaoSessaoAberta((v) => !v)}>
                    <Group gap="xs">
                      <Text fw={600} fz="sm" c="var(--text-primary)">Transcrição da sessão</Text>
                      {loadingTranscricaoSessao && <Loader size="xs" color="violet" />}
                      {!loadingTranscricaoSessao && (
                        <Badge variant="light" color="gray" size="sm">{transcricaoSessaoTrechos.length} trechos</Badge>
                      )}
                    </Group>
                    {transcricaoSessaoAberta ? <IconChevronUp size={16} color="var(--text-secondary)" /> : <IconChevronDown size={16} color="var(--text-secondary)" />}
                  </Group>
                  <Collapse in={transcricaoSessaoAberta}>
                    <Stack gap="4px" mt="md"
                      style={{ maxHeight: 280, overflowY: "auto", padding: "12px", borderRadius: 10, background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                      {transcricaoSessaoTrechos.length === 0 ? (
                        <Text fz="sm" c="var(--text-secondary)">Nenhuma transcrição para esta sessão.</Text>
                      ) : transcricaoSessaoTrechos.map((t) => (
                        <Group key={t.id} gap="xs" align="flex-start" wrap="nowrap">
                          <Text fz="10px" c="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 3 }}>
                            {new Date(t.timestamp).toLocaleTimeString("pt-BR")}
                          </Text>
                          <Text fz="sm" c="var(--text-primary)">{t.texto}</Text>
                        </Group>
                      ))}
                    </Stack>
                  </Collapse>
                </Paper>

                {/* Editor de RAT */}
                <Paper p="20px" radius="16px" style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                  <Stack gap="16px">

                    <TextInput
                      ref={ratSessaoTituloRef}
                      label="Título do RAT"
                      placeholder="Ex: RAT — Treinamento onboarding — Empresa ABC"
                      radius="xl" size="md"
                      value={ratSessaoTitulo}
                      error={ratSessaoTituloError}
                      disabled={ratSessaoStatus === "FINALIZADO"}
                      onChange={(e) => { setRatSessaoTitulo(e.currentTarget.value); setRatSessaoTituloError(""); }}
                      styles={inputStyles}
                    />

                    {ratSessaoStatus !== "FINALIZADO" && (
                      <Group gap="sm">
                        <Button leftSection={<IconRobot size={16} />}
                          radius="xl" size="sm" variant="gradient"
                          gradient={{ from: "violet", to: "indigo" }}
                          loading={gerandoRat} onClick={handleGerarRatIA}>
                          Gerar RAT com IA
                        </Button>
                        <Text fz="xs" c="var(--text-secondary)">
                          ou escreva / edite manualmente abaixo
                        </Text>
                      </Group>
                    )}

                    {ratSessaoStatus === "FINALIZADO" ? (
                      <Paper p="12px" radius="12px"
                        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
                        <Group gap="xs" mb="xs">
                          <IconLock size={14} color="var(--text-secondary)" />
                          <Text fz="xs" c="var(--text-secondary)">RAT finalizado — somente leitura</Text>
                        </Group>
                        <div
                          style={{ color: "var(--text-primary)", fontSize: 14, lineHeight: 1.6 }}
                          dangerouslySetInnerHTML={{ __html: ratSessaoConteudo || "<p>—</p>" }}
                        />
                      </Paper>
                    ) : (
                      <RichTextEditor
                        key={ratSessaoKey}
                        value={ratSessaoConteudo}
                        onChange={setRatSessaoConteudo}
                        hideVideo
                      />
                    )}

                    {ratDetailMsg && (
                      <Alert
                        color={ratDetailMsg.type === "success" ? "green" : "red"}
                        icon={ratDetailMsg.type === "success" ? <IconCheck size={18} /> : <IconX size={18} />}
                        radius="xl">
                        {ratDetailMsg.text}
                      </Alert>
                    )}

                    <Group justify="flex-end" gap="sm">
                      {ratSessaoStatus !== "FINALIZADO" && (
                        <>
                          <Button leftSection={<IconFileText size={16} />}
                            radius="xl" size="md" variant="default"
                            loading={salvandoRascunho} onClick={handleSalvarRascunho}>
                            Salvar rascunho
                          </Button>
                          <Button leftSection={<IconCheck size={16} />}
                            radius="xl" size="md" variant="gradient"
                            gradient={{ from: "violet", to: "blue" }}
                            loading={finalizandoRat} onClick={handleFinalizarRat}>
                            Finalizar RAT
                          </Button>
                        </>
                      )}
                    </Group>

                  </Stack>
                </Paper>

              </Stack>
            ) : (

              /* ── Lista de sessões ── */
              <Stack gap="16px">

                <Group justify="space-between" align="center">
                  <Text fw={700} c="var(--text-primary)" fz="md">Sessões de captura</Text>
                  <Button size="xs" radius="xl" variant="light" color="violet"
                    loading={loadingSessoes} onClick={carregarSessoes}>
                    Atualizar
                  </Button>
                </Group>

                {loadingSessoes ? (
                  <Group justify="center" py="xl"><Loader size="md" color="violet" /></Group>
                ) : sessoes.length === 0 ? (
                  <Paper p="20px" radius="14px" style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                    <Text fz="sm" c="var(--text-secondary)" ta="center">
                      Nenhuma sessão com RAT pendente. RATs finalizados estão disponíveis em Meus RATs.
                    </Text>
                  </Paper>
                ) : (
                  <Paper radius="14px" style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                    <div style={{ overflowX: "auto" }}>
                      <Table verticalSpacing="md" horizontalSpacing="md">
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th c="var(--text-primary)">Data/Horário</Table.Th>
                            <Table.Th c="var(--text-primary)">Duração</Table.Th>
                            <Table.Th c="var(--text-primary)">Status sessão</Table.Th>
                            <Table.Th c="var(--text-primary)">Status RAT</Table.Th>
                            <Table.Th c="var(--text-primary)">Ações</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {sessoes.map((s) => {
                            const dur = s.dataHoraFim
                              ? Math.round((new Date(s.dataHoraFim).getTime() - new Date(s.dataHoraInicio).getTime()) / 60000)
                              : null;
                            return (
                              <Table.Tr key={s.id}>
                                <Table.Td>
                                  <Text fz="sm" c="var(--text-primary)">{formatDataHora(s.dataHoraInicio)}</Text>
                                </Table.Td>
                                <Table.Td>
                                  <Text fz="sm" c="var(--text-secondary)">
                                    {dur !== null ? (dur >= 60 ? `${Math.floor(dur / 60)}h ${dur % 60}min` : `${dur} min`) : "Em andamento"}
                                  </Text>
                                </Table.Td>
                                <Table.Td>
                                  <Badge variant="light" radius="xl"
                                    color={s.status === "EM_ANDAMENTO" ? "orange" : "teal"}>
                                    {s.status === "EM_ANDAMENTO" ? "Em andamento" : "Encerrada"}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>{ratStatusBadge(s.ratStatus)}</Table.Td>
                                <Table.Td>
                                  <Button size="xs" radius="xl" variant="light"
                                    color={s.ratStatus === "RASCUNHO" ? "orange" : "violet"}
                                    onClick={() => abrirSessaoDetalhe(s)}>
                                    {s.ratStatus === "RASCUNHO" ? "Continuar" : "Criar RAT"}
                                  </Button>
                                </Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </div>
                  </Paper>
                )}

              </Stack>
            )}

          </Tabs.Panel>

        </Tabs>
      </Paper>

      {/* Modal de consentimento — Modo Completo */}
      <Modal
        opened={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        title="Consentimento de gravação"
        centered
        radius="lg"
        size="sm">
        <Stack gap="md">
          <Text fz="sm" c="var(--text-primary)">
            Esta captura registrará também a fala de outros participantes.
            Certifique-se de ter o consentimento deles antes de continuar.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button radius="xl" variant="default" onClick={() => setShowConsentModal(false)}>
              Cancelar
            </Button>
            <Button radius="xl" color="violet"
              leftSection={<IconDeviceTv size={16} />}
              onClick={() => { setShowConsentModal(false); iniciarCapturaCompleto(); }}>
              Confirmar e iniciar
            </Button>
          </Group>
        </Stack>
      </Modal>

    </Stack>
  );
}
