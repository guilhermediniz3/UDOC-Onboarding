import { useRef, useState } from "react";

import { EditorContent, useEditor } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

import "./index.css";
import "./extensions/video.css";

import {
  ActionIcon,
  Divider,
  Group,
  Paper,
  Popover,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";

import Callout from "./extensions/Callout";
import Badge from "./extensions/Badge/Badge";
import ResizableImage from "./extensions/ResizableImage";
import ResizableVideo from "./extensions/ResizableVideo";
import ResizableRecordingVideo from "./extensions/ResizableRecordingVideo";
import { uploadGenericRecording, getRecordingFileUrl } from "../../services/recordingService";
import { compressImageToBase64 } from "../../services/imageService";

import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaCode,
  FaCircle,
  FaLink,
  FaImage,
  FaVideo,
  FaUndo,
  FaRedo,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaSearchMinus,
  FaSearchPlus,
  FaRobot,
  FaDotCircle,
  FaStop,
} from "react-icons/fa";

import PromptDialog from "../PromptDialog/PromptDialog";
import PromptBadge from "../PromptDialog/PromptBadge";
import AIPromptModal from "../AIPromptModal/AIPromptModal";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    badge: {
      insertBadge: (text?: string, color?: string) => ReturnType;
    };
    resizableVideo: {
      setResizableVideo: (options: { src: string; width?: number; align?: string }) => ReturnType;
    };
    resizableRecordingVideo: {
      setResizableRecordingVideo: (options: { src: string; width?: number; align?: string }) => ReturnType;
    };
  }
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  hideVideo?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  hideVideo = false,
}: RichTextEditorProps) {
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  const [zoom, setZoom] = useState(100);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogValue, setDialogValue] = useState("");
  const [dialogType, setDialogType] = useState<"link" | "image" | "video" | null>(null);
  const [badgeText, setBadgeText] = useState("1");
  const [badgeColor, setBadgeColor] = useState("#2563eb");
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [editingBadgePos, setEditingBadgePos] = useState<number | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const COLOR_PALETTE = [
    ["#000000", "#374151", "#6b7280", "#9ca3af", "#d1d5db", "#ffffff"],
    ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"],
    ["#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#2563eb", "#7c3aed", "#db2777"],
    ["#fca5a5", "#fdba74", "#fde68a", "#86efac", "#93c5fd", "#c4b5fd", "#f9a8d4"],
  ];

  /* ── upload de imagem ── */
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMsg, setImageMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  /* ── gravação de tela ── */
  const [isRecording, setIsRecording]   = useState(false);
  const [recSeconds, setRecSeconds]     = useState(0);
  const [uploadingRec, setUploadingRec] = useState(false);
  const [recMsg, setRecMsg]             = useState<{ text: string; type: "error" | "success" } | null>(null);
  const recChunksRef  = useRef<Blob[]>([]);
  const mediaRecRef   = useRef<MediaRecorder | null>(null);
  const recTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Digite seu conteúdo aqui..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Callout,
      Badge,
      ResizableImage,
      ResizableVideo,
      ResizableRecordingVideo,
    ],

    content: value,

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },

    editorProps: {
      attributes: { class: "editor-inner" },

      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain") || "";

        const isImageUrl = text.match(/\.(jpeg|jpg|gif|png|webp|svg)(?:\?.*)?$/i);

        if (isImageUrl) {
          view.dispatch(
            view.state.tr.replaceSelectionWith(
              view.state.schema.nodes.resizableImage.create({ src: text })
            )
          );
          return true;
        }

        const isVideoUrl =
          text.includes("youtube.com") ||
          text.includes("youtu.be") ||
          text.includes("vimeo.com");

        if (isVideoUrl) {
          view.dispatch(
            view.state.tr.replaceSelectionWith(
              view.state.schema.nodes.resizableVideo.create({ src: text, align: "center" })
            )
          );
          return true;
        }

        return false;
      },
    },
  });

  const handleAIGenerated = (html: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(html).run();
  };

  const changeZoom = (amount: number) => {
    setZoom((prev) => Math.min(150, Math.max(50, prev + amount)));
  };

  async function handleStartRecording() {
    if (!editor) return;

    // Verifica cota via fetch direto — NÃO usa axios (evita interceptor 401 → reload)
    try {
      const token = localStorage.getItem("udoc-token") ?? "";
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8081"}/config/storage`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { pct } = await res.json() as { pct: number };
        if (pct >= 100) {
          setRecMsg({ type: "error", text: "Espaço de armazenamento esgotado. Acesse as Configurações para liberar espaço ou aumentar a cota." });
          setTimeout(() => setRecMsg(null), 6000);
          return;
        }
      }
    } catch { /* se não conseguir verificar, permite gravar */ }

    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9" : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      recChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recChunksRef.current.push(e.data); };
      recorder.onstop = () => stream.getTracks().forEach((t: any) => t.stop());
      recorder.start(1000);
      mediaRecRef.current = recorder;
      setIsRecording(true);
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch (e: any) {
      if (e?.name !== "NotAllowedError") alert("Erro ao iniciar gravação: " + e?.message);
    }
  }

  async function handleStopRecording() {
    if (!mediaRecRef.current || !editor) return;
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    const duration = recSeconds;
    mediaRecRef.current.stop();
    mediaRecRef.current = null;
    setIsRecording(false);
    setUploadingRec(true);
    await new Promise((r) => setTimeout(r, 500));
    try {
      const blob = new Blob(recChunksRef.current, { type: "video/webm" });
      const ts   = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const rec  = await uploadGenericRecording(blob, `gravacao_${ts}.webm`, duration);
      const url  = getRecordingFileUrl(rec.id);
      editor.chain().focus().setResizableRecordingVideo({ src: url }).run();
    } catch (e: any) {
      const msg = e?.message?.includes("Cota")
        ? e.message
        : "Erro ao fazer upload da gravação. Tente novamente.";
      setRecMsg({ type: "error", text: msg });
      setTimeout(() => setRecMsg(null), 5000);
    }
    finally { setUploadingRec(false); recChunksRef.current = []; }
  }

  function formatRecTime(s: number) {
    const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, "0")}`;
  }

  async function handleImageFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      setImageMsg({ type: "error", text: "Formato inválido. Use JPG, PNG, GIF ou WebP." });
      setTimeout(() => setImageMsg(null), 4000);
      return;
    }

    setUploadingImage(true);
    try {
      const base64 = await compressImageToBase64(file);
      editor.chain().focus().insertContent({ type: "resizableImage", attrs: { src: base64 } }).run();
      setImageMsg({ type: "success", text: "Imagem inserida com sucesso." });
      setTimeout(() => setImageMsg(null), 3000);
    } catch (err: any) {
      setImageMsg({ type: "error", text: err?.message ?? "Erro ao processar imagem." });
      setTimeout(() => setImageMsg(null), 5000);
    } finally {
      setUploadingImage(false);
    }
  }

  const openDialog = (type: "link" | "image" | "video") => {
    setDialogType(type);
    setDialogValue("");
    if (type === "link") {
      setDialogTitle("Inserir Link");
      setDialogMessage("Digite ou cole a URL do link:");
    }
    if (type === "image") {
      setDialogTitle("Inserir Imagem");
      setDialogMessage("Digite ou cole a URL da imagem:");
    }
    if (type === "video") {
      setDialogTitle("Inserir Vídeo");
      setDialogMessage("Digite ou cole a URL do vídeo:");
    }
    setDialogOpen(true);
  };

  const insertCallout = (type: "info" | "warning" | "success" | "error") => {
    if (!editor) return;
    editor.chain().focus().insertContent({
      type: "callout",
      attrs: { type },
      content: [{ type: "paragraph", content: [{ type: "text", text: `Este é um alerta de ${type}...` }] }],
    }).run();
  };

  const insertBadge = () => {
    if (!editor) return;
    setEditingBadgePos(null);
    setBadgeText("1");
    setBadgeColor("#2563eb");
    setBadgeDialogOpen(true);
  };

  const handleConfirmBadge = (value: string, color: string) => {
    if (!editor) return;
    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    if (editingBadgePos !== null) {
      const node = editor.state.doc.nodeAt(editingBadgePos);
      if (node && node.type.name === "badge") {
        editor.view.dispatch(
          editor.state.tr.setNodeMarkup(editingBadgePos, undefined, { text: trimmedValue, color })
        );
      }
      setEditingBadgePos(null);
    } else {
      editor.chain().focus().insertBadge(trimmedValue, color).run();
    }

    setBadgeText(trimmedValue);
    setBadgeColor(color);
    setBadgeDialogOpen(false);
  };

  function handleEditorDblClick(e: React.MouseEvent) {
    const target = (e.target as HTMLElement).closest?.("[data-badge]") as HTMLElement | null;
    if (!target || !editor) return;

    try {
      const rawPos = editor.view.posAtDOM(target, 0);
      const tryPos = (p: number) => {
        const n = editor.state.doc.nodeAt(p);
        return n?.type.name === "badge" ? { node: n, pos: p } : null;
      };
      const found = tryPos(rawPos) ?? tryPos(rawPos - 1);
      if (!found) return;

      e.preventDefault();
      setEditingBadgePos(found.pos);
      setBadgeText(String(found.node.attrs.text ?? "1"));
      setBadgeColor(String(found.node.attrs.color ?? "#2563eb"));
      setBadgeDialogOpen(true);
    } catch {
      // posAtDOM pode lançar se o elemento não pertencer ao editor
    }
  }

  const ToolbarButton = ({ title, onClick, active = false, children }: any) => (
    <Tooltip label={title}>
      <ActionIcon
        variant={active ? "gradient" : "subtle"}
        gradient={{ from: "violet", to: "blue", deg: 135 }}
        color="violet"
        radius="md"
        size="lg"
        onClick={onClick}
        style={{ flexShrink: 0, minWidth: 38, minHeight: 38 }}
      >
        {children}
      </ActionIcon>
    </Tooltip>
  );

  if (!editor) return null;

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogValue("");
    setDialogType(null);
  };

  return (
    <Stack gap="md">
      <Paper
        className="editor-toolbar"
        p="sm"
        radius="xl"
        shadow="lg"
        style={{
          background: dark
            ? "linear-gradient(180deg, #111827 0%, #0f172a 100%)"
            : "#ffffff",
          border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #d1d5db",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
          overflow: "hidden",
        }}
      >
        <ScrollArea>
          <Group gap="sm" wrap="nowrap" style={{ minWidth: "max-content", paddingInline: "10px" }}>
            <ToolbarButton title="Negrito" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><FaBold /></ToolbarButton>
            <ToolbarButton title="Itálico" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><FaItalic /></ToolbarButton>
            <ToolbarButton title="Sublinhado" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}><FaUnderline /></ToolbarButton>
            <Popover opened={colorPickerOpen} onChange={setColorPickerOpen} position="bottom" withArrow shadow="md" radius="lg">
              <Popover.Target>
                <Tooltip label="Cor do texto">
                  <ActionIcon
                    variant="subtle"
                    color="violet"
                    radius="md"
                    size="lg"
                    onClick={() => setColorPickerOpen((o) => !o)}
                    style={{ flexShrink: 0, minWidth: 38, minHeight: 38 }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, lineHeight: 1, color: editor.getAttributes("textStyle").color ?? "currentColor" }}>A</span>
                      <div style={{ width: 16, height: 3, borderRadius: 2, background: editor.getAttributes("textStyle").color ?? "#8b5cf6" }} />
                    </div>
                  </ActionIcon>
                </Tooltip>
              </Popover.Target>
              <Popover.Dropdown p="sm" style={{ background: dark ? "#1f2937" : "#ffffff", border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb", borderRadius: 12 }}>
                <Stack gap="xs">
                  {COLOR_PALETTE.map((row, i) => (
                    <Group key={i} gap={4} wrap="nowrap">
                      {row.map((color) => (
                        <Tooltip key={color} label={color} withArrow>
                          <div
                            onClick={() => { editor.chain().focus().setColor(color).run(); setColorPickerOpen(false); }}
                            style={{
                              width: 22, height: 22, borderRadius: 4, background: color, cursor: "pointer",
                              border: editor.getAttributes("textStyle").color === color
                                ? "2px solid #8b5cf6"
                                : color === "#ffffff" ? "1px solid #d1d5db" : "2px solid transparent",
                              transition: "transform 0.1s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                          />
                        </Tooltip>
                      ))}
                    </Group>
                  ))}
                  <div
                    onClick={() => { editor.chain().focus().unsetColor().run(); setColorPickerOpen(false); }}
                    style={{
                      padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12, textAlign: "center",
                      color: dark ? "#9ca3af" : "#6b7280",
                      border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
                    }}
                  >
                    Remover cor
                  </div>
                </Stack>
              </Popover.Dropdown>
            </Popover>
            <Divider orientation="vertical" />
            <ToolbarButton title="Título 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}><span style={{ fontWeight: 800, fontSize: 13 }}>H1</span></ToolbarButton>
            <ToolbarButton title="Título 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}><span style={{ fontWeight: 800, fontSize: 13 }}>H2</span></ToolbarButton>
            <ToolbarButton title="Título 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}><span style={{ fontWeight: 800, fontSize: 13 }}>H3</span></ToolbarButton>
            <Divider orientation="vertical" />
            <ToolbarButton title="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()}><FaListUl /></ToolbarButton>
            <ToolbarButton title="Lista Ordenada" onClick={() => editor.chain().focus().toggleOrderedList().run()}><FaListOl /></ToolbarButton>
            <ToolbarButton title="Citação" onClick={() => editor.chain().focus().toggleBlockquote().run()}><FaQuoteLeft /></ToolbarButton>
            <ToolbarButton title="Código" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}><FaCode /></ToolbarButton>
            <Divider orientation="vertical" />
            <ToolbarButton title="Badge" onClick={insertBadge}><FaCircle /></ToolbarButton>
            <ToolbarButton title="Link" onClick={() => openDialog("link")}><FaLink /></ToolbarButton>
            <Tooltip label={uploadingImage ? "Comprimindo imagem..." : "Inserir imagem (JPG, PNG, GIF, WebP)"} withArrow>
              <span>
                <ToolbarButton title="Imagem" onClick={() => !uploadingImage && imageInputRef.current?.click()}>
                  <FaImage style={{ opacity: uploadingImage ? 0.4 : 1 }} />
                </ToolbarButton>
              </span>
            </Tooltip>
            {!hideVideo && (
              <ToolbarButton title="Vídeo" onClick={() => openDialog("video")}><FaVideo /></ToolbarButton>
            )}
            {/* Botão de gravação */}
            {!hideVideo && (!isRecording ? (
              <Tooltip label={uploadingRec ? "Enviando gravação..." : "Gravar tela e inserir no card"} withArrow>
                <span>
                  <ToolbarButton title="Gravar" onClick={handleStartRecording} disabled={uploadingRec}>
                    <FaDotCircle style={{ color: uploadingRec ? "#999" : "#ef4444" }} />
                  </ToolbarButton>
                </span>
              </Tooltip>
            ) : (
              <Tooltip label={`Parar gravação (${formatRecTime(recSeconds)}) e inserir`} withArrow>
                <span>
                  <ToolbarButton title={`⏺ ${formatRecTime(recSeconds)}`} onClick={handleStopRecording}>
                    <FaStop style={{ color: "#ef4444" }} />
                  </ToolbarButton>
                </span>
              </Tooltip>
            ))}
            <Divider orientation="vertical" />
            <ToolbarButton title="Info" onClick={() => insertCallout("info")}><FaInfoCircle /></ToolbarButton>
            <ToolbarButton title="Warning" onClick={() => insertCallout("warning")}><FaExclamationTriangle /></ToolbarButton>
            <ToolbarButton title="Success" onClick={() => insertCallout("success")}><FaCheckCircle /></ToolbarButton>
            <ToolbarButton title="Error" onClick={() => insertCallout("error")}><FaTimesCircle /></ToolbarButton>
            <Divider orientation="vertical" />
            <ToolbarButton title="Alinhar Esquerda" onClick={() => editor.chain().focus().setTextAlign("left").run()}><FaAlignLeft /></ToolbarButton>
            <ToolbarButton title="Centralizar" onClick={() => editor.chain().focus().setTextAlign("center").run()}><FaAlignCenter /></ToolbarButton>
            <ToolbarButton title="Alinhar Direita" onClick={() => editor.chain().focus().setTextAlign("right").run()}><FaAlignRight /></ToolbarButton>
            <Divider orientation="vertical" />
            <ToolbarButton title="Desfazer" onClick={() => editor.chain().focus().undo().run()}><FaUndo /></ToolbarButton>
            <ToolbarButton title="Refazer" onClick={() => editor.chain().focus().redo().run()}><FaRedo /></ToolbarButton>
            <Divider orientation="vertical" />
            <ToolbarButton title="Menos Zoom" onClick={() => changeZoom(-10)}><FaSearchMinus /></ToolbarButton>
            <Text size="sm" fw={700} c={dark ? "gray.4" : "dark"}>{zoom}%</Text>
            <ToolbarButton title="Mais Zoom" onClick={() => changeZoom(10)}><FaSearchPlus /></ToolbarButton>
            <Divider orientation="vertical" />
            <ToolbarButton title="Gerar com IA" onClick={() => setAiModalOpen(true)}>
              <FaRobot />
            </ToolbarButton>
          </Group>
        </ScrollArea>
      </Paper>

      {/* Input hidden para upload de imagem */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: "none" }}
        onChange={handleImageFileSelected}
      />

      {/* Banner de upload de imagem */}
      {imageMsg && (
        <div style={{
          padding: "12px 18px",
          borderRadius: 12,
          background: imageMsg.type === "error" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
          border: `1px solid ${imageMsg.type === "error" ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"}`,
          color: imageMsg.type === "error" ? "#ef4444" : "#16a34a",
          fontSize: 13,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>{imageMsg.type === "error" ? "⚠️" : "✅"}</span>
          {imageMsg.text}
        </div>
      )}

      {/* Banner de aviso de gravação — entre o toolbar e o editor, sempre visível */}
      {recMsg && (
        <div style={{
          padding: "12px 18px",
          borderRadius: 12,
          background: recMsg.type === "error" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
          border: `1px solid ${recMsg.type === "error" ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"}`,
          color: recMsg.type === "error" ? "#ef4444" : "#16a34a",
          fontSize: 13,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>{recMsg.type === "error" ? "⚠️" : "✅"}</span>
          {recMsg.text}
        </div>
      )}

      <Paper
        className="editor-wrapper"
        radius="xl"
        p={0}
        shadow="xl"
        style={{
          minHeight: 500,
          background: dark ? "#0f172a" : "#ffffff",
          border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #d1d5db",
        }}
      >
        <div className="editor-content-wrapper" onDoubleClick={handleEditorDblClick}>
          <div style={{ zoom: `${zoom}%`, minHeight: "100%" }}>
            <EditorContent editor={editor} className="editor-content" />
          </div>
        </div>
      </Paper>

      <PromptDialog
        open={dialogOpen}
        title={dialogTitle}
        message={dialogMessage}
        placeholder="Cole aqui a URL"
        initialValue={dialogValue}
        confirmText="Inserir"
        cancelText="Cancelar"
        onConfirm={(value: string) => {
          if (!editor || !dialogType) { closeDialog(); return; }
          const input = value.trim();
          if (!input) { closeDialog(); return; }

          try {
            if (dialogType === "image") {
              editor.chain().focus().insertContent({
                type: "resizableImage",
                attrs: { src: input },
              }).run();
            } else if (dialogType === "video") {
              editor.chain().focus().setResizableVideo({
                src: input,
                width: 560,
                align: "center",
              }).run();
            } else if (dialogType === "link") {
              editor.chain().focus().setLink({ href: input }).run();
            }
          } catch (error) {
            console.error(error);
          }

          closeDialog();
        }}
        onCancel={closeDialog}
      />

      <PromptBadge
        open={badgeDialogOpen}
        title="Inserir Badge"
        message="Digite o texto do badge e escolha a cor."
        placeholder="Ex: Novo"
        initialValue={badgeText}
        initialColor={badgeColor}
        onConfirm={handleConfirmBadge}
        onCancel={() => {
          setBadgeDialogOpen(false);
          setEditingBadgePos(null);
          setBadgeText("1");
          setBadgeColor("#2563eb");
        }}
      />

      <AIPromptModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onGenerated={handleAIGenerated}
      />
    </Stack>
  );
}