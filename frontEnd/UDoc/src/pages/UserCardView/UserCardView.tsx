import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Center, Loader } from "@mantine/core";

import { incrementCardAccess } from "../../services/npsService";
import NpsResponseWidget from "../../components/Nps/NpsResponseWidget";
import { EditorContent, useEditor } from "@tiptap/react";
import { FaArrowLeft, FaFilePdf } from "react-icons/fa";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

import { getCardViewById } from "../../services/cardService";

import Callout from "../../components/RichTextEditor/extensions/Callout";
import Badge from "../../components/RichTextEditor/extensions/Badge/Badge";
import ResizableImage from "../../components/RichTextEditor/extensions/ResizableImage";
import ResizableVideo from "../../components/RichTextEditor/extensions/ResizableVideo";
import ResizableRecordingVideo from "../../components/RichTextEditor/extensions/ResizableRecordingVideo";

import "../../components/RichTextEditor/index.css";
import "../../components/RichTextEditor/extensions/video.css";

import "./index.css";

export default function UserCardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit.configure({}),
      Underline,
      Link.configure({ openOnClick: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Callout,
      Badge,
      ResizableImage,
      ResizableVideo,
      ResizableRecordingVideo,
    ],
    content: "",
  });

  useEffect(() => {
    async function loadCard() {
      try {
        if (!id || !editor) return;
        const response = await getCardViewById(Number(id));
        editor.commands.setContent(response.content || "");
        // Registra acesso — anônimo, falha silenciosa
        incrementCardAccess(Number(id)).catch(() => {});
      } catch (error) {
        console.error(error);
      }
    }
    loadCard();
  }, [id, editor]);

  async function handleExportPdf() {
    const element = contentRef.current;
    if (!element) return;

    const html2pdf = (await import("html2pdf.js")).default;

    // ─── 0. Força tema claro para a captura ───────────────────────────────
    // PDFs devem ser sempre legíveis (texto escuro em fundo branco).
    // Trocamos temporariamente o atributo de cor no <html> para que todos os
    // seletores CSS do modo escuro deixem de se aplicar durante a captura;
    // restauramos imediatamente após o save().
    const htmlEl = document.documentElement;
    const prevScheme = htmlEl.getAttribute("data-mantine-color-scheme");
    const wasDark = prevScheme === "dark";

    if (wasDark) {
      htmlEl.setAttribute("data-mantine-color-scheme", "light");
      // Aguarda dois frames para os estilos computados serem recalculados
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r()))
      );
    }

    // ─── 1. Injeta texto nos badges para html2canvas ─────────────────────────
    // html2canvas não renderiza pseudo-elementos CSS (::before/::after).
    // O texto do badge fica em data-text e é exibido via ::before no uso normal.
    // Para o PDF: definimos textContent diretamente no elemento (sem span filho)
    // e suprimimos o ::before via classe .udoc-badge--pdf no CSS.
    // Após o save(), limpamos textContent e removemos a classe.
    const badgeInjections: HTMLElement[] = [];

    element.querySelectorAll<HTMLElement>(".udoc-badge").forEach((badge) => {
      const text = badge.getAttribute("data-text") ?? "";
      if (!text) return;
      badge.classList.add("udoc-badge--pdf");
      badge.textContent = text;
      badgeInjections.push(badge);
    });

    // ─── 2. Substitui cada iframe de vídeo por um link clicável ───────────────
    type VideoReplacement = {
      container: HTMLElement;
      original: HTMLElement;
      placeholder: HTMLElement;
    };

    const replacements: VideoReplacement[] = [];

    element.querySelectorAll<HTMLElement>(".udoc-resizable-video-container").forEach((container) => {
      const iframe = container.querySelector<HTMLIFrameElement>("iframe");
      if (!iframe) return;

      const src = iframe.src;

      // Monta um placeholder visual que aparecerá no PDF
      const placeholder = document.createElement("div");
      placeholder.style.cssText = `
        width: 100%;
        padding: 20px 24px;
        background: #f1f5f9;
        border-radius: 10px;
        border: 1.5px solid #cbd5e1;
        display: flex;
        align-items: center;
        gap: 14px;
        box-sizing: border-box;
        font-family: sans-serif;
      `;

      placeholder.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#dc2626">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
        </svg>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <span style="font-size:13px;color:#64748b;font-weight:600;">Vídeo — acesse pelo link:</span>
          <a href="${src}" style="font-size:13px;color:#2563eb;word-break:break-all;text-decoration:underline;">${src}</a>
        </div>
      `;

      // Guarda referência para restaurar depois
      const iframeContainer = iframe.parentElement as HTMLElement;
      replacements.push({
        container: iframeContainer,
        original: iframe,
        placeholder,
      });

      // Troca o iframe pelo placeholder
      iframeContainer.replaceChild(placeholder, iframe);
    });

    // ─── 2. Gera e baixa o PDF ────────────────────────────────────────────────
    await html2pdf()
      .set({
        margin: [15, 15, 15, 15],
        filename: `udoc-card-${id}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(({ pagebreak: {
          mode: ["css", "legacy"],
          avoid: [
            "p", "li",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "blockquote", "pre",
            ".udoc-callout",
            ".udoc-resizable-image-wrapper",
            ".udoc-resizable-video-wrapper",
          ],
        } }) as any),
      })
      .from(element)
      .save();

    // ─── 4. Restaura badges, iframes e tema ──────────────────────────────────
    badgeInjections.forEach((badge) => {
      badge.textContent = null;
      badge.classList.remove("udoc-badge--pdf");
    });

    replacements.forEach(({ container, original, placeholder }) => {
      container.replaceChild(original, placeholder);
    });

    if (wasDark) {
      htmlEl.setAttribute("data-mantine-color-scheme", "dark");
    }
  }

  if (!editor) {
    return (
      <Center className="user-card-loading">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div className="user-card-view">
      <div className="user-card-actions">
        <button
          className="user-card-btn user-card-btn--back"
          onClick={() => navigate("/")}
        >
          <FaArrowLeft />
          Voltar
        </button>

        <button
          className="user-card-btn user-card-btn--pdf"
          onClick={handleExportPdf}
        >
          <FaFilePdf />
          Exportar PDF
        </button>
      </div>

      <div className="user-card-content" ref={contentRef}>
        <EditorContent editor={editor} />
      </div>

      {/* Widget NPS ao final do card */}
      {id && <NpsResponseWidget refType="card" refId={Number(id)} />}
    </div>
  );
}
