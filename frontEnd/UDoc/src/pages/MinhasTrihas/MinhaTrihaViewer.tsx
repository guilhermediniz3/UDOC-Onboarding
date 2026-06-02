import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Progress,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";

import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconRoute,
  IconStar,
} from "@tabler/icons-react";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";

// Extensões personalizadas — mesmas do UserCardView
import Callout from "../../components/RichTextEditor/extensions/Callout";
import BadgeExt from "../../components/RichTextEditor/extensions/Badge/Badge";
import ResizableImage from "../../components/RichTextEditor/extensions/ResizableImage";
import ResizableVideo from "../../components/RichTextEditor/extensions/ResizableVideo";
import ResizableRecordingVideo from "../../components/RichTextEditor/extensions/ResizableRecordingVideo";

import "../../components/RichTextEditor/index.css";
import "../../components/RichTextEditor/extensions/video.css";
import "../UserCardView/index.css"; // dark mode + estilos do card

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getMyTrailContent,
  getMyTrails,
  type TrailContentItem,
} from "../../services/myTrailsService";

import {
  getCardQuestions,
  getTrailProgress,
  saveTrailProgress,
  type CardQuestion,
} from "../../services/trailLearnerService";

import { getNpsConfig, incrementCardAccess } from "../../services/npsService";
import NpsResponseWidget from "../../components/Nps/NpsResponseWidget";
import QuizWidget from "../../components/Quiz/QuizWidget";
import CertificatePreview from "../../components/Quiz/CertificatePreview";
import { useAuth } from "../../contexts/AuthContext";
import { useTrailTimer, formatSeconds } from "../../hooks/useTrailTimer";

// Helpers de embed de vídeo
function getYoutubeEmbedUrl(url: string): string | null {
  const regexes = [/youtube\.com\/watch\?v=([^&]+)/, /youtu\.be\/([^?/]+)/, /youtube\.com\/embed\/([^?]+)/];
  for (const re of regexes) { const m = url.match(re); if (m) return `https://www.youtube.com/embed/${m[1]}`; }
  return null;
}
function getVimeoEmbedUrl(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

// ── CardViewer com todas as extensões ────────────────────────────────────────
function CardViewer({ item }: { item: TrailContentItem }) {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit, Underline,
      Link.configure({ openOnClick: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Callout, BadgeExt, ResizableImage, ResizableVideo, ResizableRecordingVideo,
    ],
    content: item.cardContent || "",
  });

  useEffect(() => {
    if (editor && item.cardContent) editor.commands.setContent(item.cardContent);
  }, [item.cardContent, editor]);

  return (
    <div>
      {item.cardTitle && <Title order={3} c="var(--text-primary)" mb="lg">{item.cardTitle}</Title>}
      {item.cardDescription && <Text c="var(--text-secondary)" mb="xl" fz="md">{item.cardDescription}</Text>}
      <div className="user-card-content">
        {editor ? <EditorContent editor={editor} /> : <Loader size="sm" />}
      </div>
    </div>
  );
}

// ── VideoViewer ───────────────────────────────────────────────────────────────
function VideoViewer({ item }: { item: TrailContentItem }) {
  const embedUrl = item.youtubeUrl
    ? getYoutubeEmbedUrl(item.youtubeUrl)
    : item.vimeoUrl ? getVimeoEmbedUrl(item.vimeoUrl) : null;
  return (
    <div>
      {item.salaTitle && <Title order={3} c="var(--text-primary)" mb="xl">{item.salaTitle}</Title>}
      {embedUrl ? (
        <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "16/9" }}>
          <iframe src={embedUrl} width="100%" height="100%"
            style={{ border: "none", display: "block" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        </div>
      ) : (
        <Center py="60px">
          <Stack align="center" gap="md">
            <IconPlayerPlay size={48} color="var(--text-secondary)" />
            <Text c="var(--text-secondary)">Nenhum vídeo disponível para esta sala</Text>
          </Stack>
        </Center>
      )}
    </div>
  );
}

// ── ETAPAS POR ITEM ───────────────────────────────────────────────────────────
type ItemStep = "content" | "quiz" | "nps";

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function MinhaTrihaViewer() {

  const navigate = useNavigate();
  const { trailId } = useParams();
  const { user } = useAuth();

  const [items, setItems] = useState<TrailContentItem[]>([]);
  const [trailName, setTrailName] = useState("");
  const [trailDescription, setTrailDescription] = useState("");

  // Dados adicionais para o certificado
  const [companyName, setCompanyName] = useState("");
  const [ismName, setIsmName] = useState("");
  const [cardNota, setCardNota] = useState<number | null>(null);
  const [trailNota, setTrailNota] = useState<number | null>(null);

  // Tempo da trilha (carregado do progresso salvo)
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [iniciadoEm, setIniciadoEm] = useState<string | undefined>();
  const [progressLoaded, setProgressLoaded] = useState(false);

  // Progresso
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [step, setStep] = useState<ItemStep>("content");

  // Config NPS por card e por trilha
  const [cardNpsEnabled, setCardNpsEnabled] = useState(true);
  const [trailNpsEnabled, setTrailNpsEnabled] = useState(true);

  // Quiz por card
  const [cardQuestions, setCardQuestions] = useState<CardQuestion[]>([]);
  const [cardAprovado, setCardAprovado] = useState<boolean | null>(null);

  // Quiz da trilha (ao final)
  const [trailQuestions, setTrailQuestions] = useState<CardQuestion[]>([]);
  const [trailAprovado, setTrailAprovado] = useState<boolean | null>(null);
  const [quizKey, setQuizKey] = useState(0); // força remount do QuizWidget no refazer

  // Fases da trilha
  const [phase, setPhase] = useState<"learning" | "trail-quiz" | "trail-nps" | "done">("learning");

  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Timer de sessão ──────────────────────────────────────────────────────────
  const { elapsedSeconds, isInactive, resume } = useTrailTimer({
    trailId: Number(trailId),
    initialSeconds,
    enabled: progressLoaded && !loading && phase !== "done",
  });

  // ── carregamento ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [content, trails, progress] = await Promise.all([
          getMyTrailContent(Number(trailId)),
          getMyTrails(),
          getTrailProgress(Number(trailId)).catch(() => null),
        ]);
        setItems(content);
        const trail = trails.find((t) => t.id === Number(trailId));
        if (trail) { setTrailName(trail.name); setTrailDescription(trail.description || ""); }

        // Carrega dados do funcionário externo vinculado ao usuário (empresa e ISM para certificado)
        try {
          const { getEmployeeById } = await import("../../services/employeeService");
          const { getTrainingRooms } = await import("../../services/trainingRoomService");
          // Busca salas da trilha para pegar ISM
          const rooms = await getTrainingRooms({ size: 100, active: true });
          const trailRoom = rooms.content.find((r) => r.trailId === Number(trailId));
          if (trailRoom) {
            if (trailRoom.companyName) setCompanyName(trailRoom.companyName);
            if (trailRoom.ismName) setIsmName(trailRoom.ismName);
          }
        } catch { /* dados opcionais para o certificado */ }

        // Carrega perguntas da trilha
        try {
          const { getTrailQuestions } = await import("../../services/trailCertificationService");
          const qs = await getTrailQuestions(Number(trailId));
          setTrailQuestions(qs as any);
        } catch { /* sem perguntas da trilha */ }

        // Carrega config NPS da trilha
        getNpsConfig("trail", Number(trailId))
          .then((c) => setTrailNpsEnabled(c.enabled))
          .catch(() => {}); // padrão true mantido

        // Restaura progresso e tempo acumulado
        if (progress) {
          setInitialSeconds(progress.tempoTotalSegundos || 0);
          if (progress.iniciadoEm) setIniciadoEm(progress.iniciadoEm);

          if (progress.status !== "completed") {
            setCurrentIndex(progress.currentItemIndex);
            const completedArr: number[] = JSON.parse(progress.completedItemsJson || "[]");
            setCompleted(new Set(completedArr));
          } else {
            setPhase("done");
          }
        }
        setProgressLoaded(true);
      } catch {
        navigate("/minhas-trilhas");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [trailId]);

  // ── persiste progresso com debounce ────────────────────────────────────────
  function persistProgress(index: number, completedSet: Set<number>, status?: string, certified?: boolean, notaObtida?: number) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTrailProgress(Number(trailId), {
        currentItemIndex: index,
        completedItemsJson: JSON.stringify(Array.from(completedSet)),
        status: status || "in_progress",
        ...(certified !== undefined ? { certified } : {}),
        ...(notaObtida !== undefined ? { notaObtida } : {}),
      }).catch(() => {});
    }, 1000);
  }

  // ── carrega quiz e config NPS do card quando muda de item ───────────────────
  useEffect(() => {
    const item = items[currentIndex];
    if (item?.tipo === "card" && item.cardId) {
      incrementCardAccess(item.cardId).catch(() => {});
      getCardQuestions(item.cardId).then(setCardQuestions).catch(() => setCardQuestions([]));
      getNpsConfig("card", item.cardId)
        .then((c) => setCardNpsEnabled(c.enabled))
        .catch(() => setCardNpsEnabled(true));
    } else {
      setCardQuestions([]);
      setCardNpsEnabled(true);
    }
    setStep("content");
    setCardAprovado(null);
  }, [currentIndex, items]);

  // ── avança ao próximo item ou para fase da trilha ──────────────────────────
  function advanceItem() {
    const newCompleted = new Set(completed);
    newCompleted.add(currentIndex);
    setCompleted(newCompleted);

    if (currentIndex < items.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      persistProgress(next, newCompleted);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Terminou todos os itens — decide próxima fase
      if (trailQuestions.length > 0) {
        setPhase("trail-quiz");
      } else if (trailNpsEnabled) {
        setPhase("trail-nps");
      } else {
        setPhase("done");
        persistProgress(currentIndex, newCompleted, "completed");
      }
      persistProgress(currentIndex, newCompleted);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleContentNext() {
    if (cardQuestions.length > 0) {
      setStep("quiz");
    } else if (cardNpsEnabled) {
      setStep("nps");
    } else {
      advanceItem();
    }
  }

  function handleQuizAprovado(nota: number) {
    setCardAprovado(true);
    setCardNota(nota);
  }

  function handleQuizReprovado(nota: number) {
    setCardAprovado(false);
    setCardNota(nota);
  }

  function handleNpsAdvance() {
    advanceItem();
  }

  function handleTrailAprovado(nota: number) {
    setTrailAprovado(true);
    setTrailNota(nota);
    persistProgress(currentIndex, completed, "completed", true, nota); // certified=true, nota persistida
    // Não muda de fase aqui — o certificado é exibido na fase trail-quiz
  }

  function handleTrailReprovado(nota: number) {
    setTrailAprovado(false);
    setTrailNota(nota);
    // Não muda de fase — exibe mensagem amigável com opções de refazer/pular
  }

  function handleTrailNpsAdvance() {
    setPhase("done");
    persistProgress(currentIndex, completed, "completed", trailAprovado === true ? true : undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) return <Center mih="100vh"><Loader size="lg" /></Center>;

  if (items.length === 0) {
    return (
      <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">
        <Button leftSection={<IconArrowLeft size={16} />} variant="subtle" radius="xl"
          onClick={() => navigate("/minhas-trilhas")} w="fit-content">Voltar</Button>
        <Text ta="center" c="var(--text-secondary)" py="xl">Esta trilha ainda não tem conteúdo definido.</Text>
      </Stack>
    );
  }

  const progress = Math.round((completed.size / items.length) * 100);
  const currentItem = items[currentIndex];
  const isLastItem = currentIndex === items.length - 1;

  // ── Cabeçalho da trilha (sempre visível) ────────────────────────────────────
  const pct = phase === "done" ? 100 : progress;
  const concluidos = completed.size;

  const Header = (
    <Stack gap="8px">
      {/* Banner de inatividade — sutil, não intrusivo */}
      {isInactive && (
        <Alert
          color="orange"
          radius="xl"
          variant="light"
          icon={<IconPlayerPause size={16} />}
          style={{ padding: "8px 16px" }}
        >
          <Group justify="space-between" align="center">
            <Text fz="sm">Sessão pausada por inatividade</Text>
            <Button size="xs" radius="xl" variant="light" color="orange"
              leftSection={<IconPlayerPlay size={13} />} onClick={resume}>
              Retomar
            </Button>
          </Group>
        </Alert>
      )}

      <Paper p="20px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
        <Stack gap="12px">
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <ActionIcon variant="subtle" radius="xl" size="lg" onClick={() => navigate("/minhas-trilhas")}>
                <IconArrowLeft size={18} />
              </ActionIcon>
              <Group gap="sm" align="center">
                <IconRoute size={20} color="#7c3aed" />
                <Text fw={700} c="var(--text-primary)" fz="lg">{trailName}</Text>
              </Group>
            </Group>
            <Group gap="sm">
              {/* Tempo acumulado */}
              <Tooltip label="Tempo total dedicado à trilha" withArrow>
                <Badge variant="light" color={isInactive ? "orange" : "violet"} radius="xl"
                  leftSection={<IconClock size={12} />}>
                  {formatSeconds(elapsedSeconds)}
                </Badge>
              </Tooltip>
              {phase === "learning" && (
                <Badge variant="light" color="gray" radius="xl">
                  {currentIndex + 1} / {items.length}
                </Badge>
              )}
            </Group>
          </Group>

          {/* Barra de progresso com texto */}
          <div>
            <Group justify="space-between" mb={4}>
              <Text fz="xs" c="var(--text-secondary)">
                {phase === "done"
                  ? "Trilha concluída!"
                  : `${concluidos} de ${items.length} concluídos — ${pct}%`
                }
              </Text>
              <Text fz="xs" fw={700} c={phase === "done" ? "green" : "violet"}>
                {pct}%
              </Text>
            </Group>
            <Progress
              value={pct}
              radius="xl" size="md"
              color={phase === "done" ? "green" : "violet"}
              animated={pct < 100 && phase !== "done"}
            />
          </div>

          {/* Mapa de itens */}
          {phase === "learning" && (
            <Group gap="6px">
              {items.map((item, i) => (
                <Tooltip
                  key={i}
                  label={item.cardTitle || item.salaTitle || `Item ${i + 1}`}
                  withArrow position="bottom"
                >
                  <div
                    onClick={() => { setCurrentIndex(i); }}
                    style={{
                      width: 28, height: 28, borderRadius: 8, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: completed.has(i) ? "#7c3aed"
                        : i === currentIndex ? "rgba(124,58,237,0.15)"
                        : "var(--app-bg)",
                      border: i === currentIndex ? "2px solid #7c3aed"
                        : completed.has(i) ? "2px solid #7c3aed"
                        : "2px solid var(--border-color)",
                      transition: "all 0.15s",
                    }}
                  >
                    {completed.has(i)
                      ? <IconCheck size={14} color="white" />
                      : <Text fz="xs" fw={600} c={i === currentIndex ? "violet" : "var(--text-secondary)"}>{i + 1}</Text>
                    }
                  </div>
                </Tooltip>
              ))}
            </Group>
          )}
        </Stack>
      </Paper>
    </Stack>
  );

  // ── FASE: learning ──────────────────────────────────────────────────────────
  if (phase === "learning") {
    return (
      <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">
        {Header}

        {/* Conteúdo */}
        {step === "content" && (
          <>
            <Paper p="30px" radius="24px"
              style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
              {currentItem.tipo === "card" ? <CardViewer item={currentItem} /> : <VideoViewer item={currentItem} />}
            </Paper>

            {/* Rodapé de navegação após conteúdo */}
            <Paper p="20px" radius="24px"
              style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
              <Group justify="space-between">
                <Button leftSection={<IconArrowLeft size={16} />} variant="default" radius="xl"
                  disabled={currentIndex === 0} onClick={() => { setCurrentIndex((p) => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  Anterior
                </Button>
                <Text fz="sm" c="var(--text-secondary)">{currentIndex + 1} de {items.length}</Text>
                <Button rightSection={<IconArrowRight size={16} />} variant="gradient"
                  gradient={{ from: "violet", to: "blue" }} radius="xl" onClick={handleContentNext}>
                  Próximo
                </Button>
              </Group>
            </Paper>
          </>
        )}

        {/* Quiz do card */}
        {step === "quiz" && (
          <>
            <QuizWidget
              questions={cardQuestions}
              notaMinima={70}
              title="Quiz de verificação do conteúdo"
              onAprovado={handleQuizAprovado}
              onReprovado={handleQuizReprovado}
            />
            {cardAprovado === true && currentItem.tipo === "card" && user && (
              <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
                <Stack gap="xl">
                  <CertificatePreview
                    type="card"
                    title={currentItem.cardTitle || ""}
                    description={currentItem.cardDescription}
                    recipientName={user.name}
                    companyName={companyName}
                    ismName={ismName}
                    nota={cardNota}
                    tempoTotalSegundos={elapsedSeconds}
                    iniciadoEm={iniciadoEm}
                  />
                  <Group justify="flex-end">
                    <Button rightSection={<IconArrowRight size={16} />} variant="gradient"
                      gradient={{ from: "violet", to: "blue" }} radius="xl"
                      onClick={() => cardNpsEnabled ? setStep("nps") : advanceItem()}>
                      {cardNpsEnabled ? "Continuar para NPS" : "Próximo item"}
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            )}
          </>
        )}

        {/* NPS do card */}
        {step === "nps" && (
          <>
            {currentItem.tipo === "card" && currentItem.cardId && (
              <NpsResponseWidget refType="card" refId={currentItem.cardId} />
            )}
            <Paper p="20px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
              <Group justify="flex-end">
                <Button rightSection={isLastItem ? <IconStar size={16} /> : <IconArrowRight size={16} />}
                  variant="gradient" gradient={{ from: "violet", to: "blue" }} radius="xl"
                  onClick={handleNpsAdvance}>
                  {isLastItem ? "Finalizar conteúdo" : "Próximo item"}
                </Button>
              </Group>
            </Paper>
          </>
        )}
      </Stack>
    );
  }

  // ── FASE: quiz da trilha ────────────────────────────────────────────────────
  if (phase === "trail-quiz") {
    return (
      <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">
        {Header}

        {/* Cabeçalho informativo — só aparece quando o quiz ainda não foi respondido */}
        {trailAprovado === null && (
          <Paper p="24px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
            <Stack gap="sm">
              <Badge variant="light" color="violet" radius="xl" w="fit-content">Quiz final da trilha</Badge>
              <Title order={3} c="var(--text-primary)">Agora vamos testar seus conhecimentos de toda a trilha!</Title>
              <Text c="var(--text-secondary)">Responda as perguntas abaixo. Você precisa atingir 70% para ser aprovado e receber o certificado.</Text>
            </Stack>
          </Paper>
        )}

        {/* Quiz — exibido apenas enquanto ainda não respondido */}
        {trailAprovado === null && (
          <QuizWidget
            key={quizKey}
            questions={trailQuestions}
            notaMinima={70}
            title="Quiz de certificação da trilha"
            onAprovado={handleTrailAprovado}
            onReprovado={handleTrailReprovado}
          />
        )}

        {/* APROVADO: exibir certificado na tela */}
        {trailAprovado === true && user && (
          <Paper p="30px" radius="24px"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
            <Stack gap="xl">
              <CertificatePreview
                type="trail"
                title={trailName}
                description={trailDescription}
                recipientName={user.name}
                companyName={companyName}
                ismName={ismName}
                nota={trailNota}
                tempoTotalSegundos={elapsedSeconds}
                iniciadoEm={iniciadoEm}
                concluidoEm={new Date().toISOString()}
              />
              <Group justify="flex-end">
                <Button rightSection={<IconArrowRight size={16} />} variant="gradient"
                  gradient={{ from: "violet", to: "blue" }} radius="xl"
                  onClick={() => {
                    persistProgress(currentIndex, completed, "completed", true, trailNota ?? undefined);
                    if (trailNpsEnabled) { setPhase("trail-nps"); } else { setPhase("done"); }
                  }}>
                  {trailNpsEnabled ? "Próximo: avaliação da trilha" : "Concluir trilha"}
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}

        {/* REPROVADO: mensagem amigável + refazer ou concluir sem certificado */}
        {trailAprovado === false && (
          <Paper p="40px" radius="24px"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
            <Stack align="center" gap="24px">
              {/* Ícone de reprovado */}
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "rgba(239,68,68,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 40,
              }}>
                😕
              </div>

              <Stack align="center" gap="8px">
                <Title order={3} c="var(--text-primary)">Não foi dessa vez!</Title>
                <Text c="var(--text-secondary)" ta="center" maw={480}>
                  Você obteve <b>{trailNota !== null ? Math.round(trailNota) : 0}%</b> de aproveitamento.
                  A nota mínima para obter o certificado é <b>70%</b>.
                </Text>
                <Text c="var(--text-secondary)" ta="center" fz="sm" maw={420}>
                  Sem problemas! Você pode refazer o quiz para tentar a certificação,
                  ou concluir a trilha sem o certificado.
                </Text>
              </Stack>

              <Group gap="md" justify="center">
                <Button
                  leftSection={<IconRefresh size={16} />}
                  variant="light" color="violet" radius="xl" size="md"
                  onClick={() => { setTrailAprovado(null); setQuizKey((k) => k + 1); }}
                >
                  Refazer quiz
                </Button>
                <Button
                  rightSection={<IconArrowRight size={16} />}
                  variant="default" radius="xl" size="md"
                  onClick={() => { setPhase("trail-nps"); persistProgress(currentIndex, completed, "completed"); }}
                >
                  Concluir sem certificado
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}
      </Stack>
    );
  }

  // ── FASE: NPS da trilha ─────────────────────────────────────────────────────
  if (phase === "trail-nps") {
    return (
      <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">
        {Header}
        <NpsResponseWidget refType="trail" refId={Number(trailId)} />
        <Paper p="20px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
          <Group justify="flex-end">
            <Button rightSection={<IconCheck size={16} />} variant="gradient"
              gradient={{ from: "green", to: "teal" }} radius="xl" onClick={handleTrailNpsAdvance}>
              Concluir trilha
            </Button>
          </Group>
        </Paper>
      </Stack>
    );
  }

  // ── FASE: done ──────────────────────────────────────────────────────────────
  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">
      {Header}
      <Paper p="50px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 40px var(--shadow-color)" }}>
        <Stack align="center" gap="24px">
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconCheck size={48} color="#22c55e" />
          </div>
          <Stack align="center" gap="8px">
            <Title order={2} c="var(--text-primary)">Trilha concluída!</Title>
            <Text c="var(--text-secondary)" ta="center" maw={500}>
              Parabéns! Você completou a trilha <b>{trailName}</b> com sucesso.
            </Text>
          </Stack>
          <Progress value={100} radius="xl" size="md" color="green" w="100%" />
          <Group gap="md">
            <Button variant="default" radius="xl" onClick={() => navigate("/minhas-trilhas")}>
              Minhas trilhas
            </Button>
            <Button leftSection={<IconRefresh size={16} />} variant="light" color="violet" radius="xl"
              onClick={() => { setPhase("learning"); setCurrentIndex(0); setCompleted(new Set()); setStep("content"); setTrailAprovado(null); persistProgress(0, new Set()); }}>
              Rever trilha
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}
