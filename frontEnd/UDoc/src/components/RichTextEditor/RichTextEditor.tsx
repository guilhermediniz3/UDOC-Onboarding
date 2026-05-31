import { useState } from "react";

import { EditorContent, useEditor } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";

import "./index.css";
import "./extensions/video.css";

import {
  ActionIcon,
  Divider,
  Group,
  Paper,
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
  }
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({
  value,
  onChange,
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
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Digite seu conteúdo aqui..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Callout,
      Badge,
      ResizableImage,
      ResizableVideo,
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
    setBadgeText("1");
    setBadgeColor("#2563eb");
    setBadgeDialogOpen(true);
  };

  const handleConfirmBadge = (value: string, color: string) => {
    if (!editor) return;
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    editor.chain().focus().insertBadge(trimmedValue, color).run();
    setBadgeText(trimmedValue);
    setBadgeColor(color);
    setBadgeDialogOpen(false);
  };

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
    <Stack gap="md" style={{ height: "100%" }}>
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
            <Divider orientation="vertical" />
            <ToolbarButton title="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()}><FaListUl /></ToolbarButton>
            <ToolbarButton title="Lista Ordenada" onClick={() => editor.chain().focus().toggleOrderedList().run()}><FaListOl /></ToolbarButton>
            <ToolbarButton title="Citação" onClick={() => editor.chain().focus().toggleBlockquote().run()}><FaQuoteLeft /></ToolbarButton>
            <ToolbarButton title="Código" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}><FaCode /></ToolbarButton>
            <Divider orientation="vertical" />
            <ToolbarButton title="Badge" onClick={insertBadge}><FaCircle /></ToolbarButton>
            <ToolbarButton title="Link" onClick={() => openDialog("link")}><FaLink /></ToolbarButton>
            <ToolbarButton title="Imagem" onClick={() => openDialog("image")}><FaImage /></ToolbarButton>
            <ToolbarButton title="Vídeo" onClick={() => openDialog("video")}><FaVideo /></ToolbarButton>
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

      <Paper
        className="editor-wrapper"
        radius="xl"
        p={0}
        shadow="xl"
        style={{
          flex: 1,
          overflow: "hidden",
          background: dark ? "#0f172a" : "#ffffff",
          border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #d1d5db",
        }}
      >
        <div className="editor-content-wrapper">
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