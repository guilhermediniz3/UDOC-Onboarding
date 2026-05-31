// ============================================================================
// ARQUIVO: src/components/RichTextEditor/extensions/ResizableVideo.tsx
// ============================================================================

import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import {
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaTrash,
} from "react-icons/fa";

// Importação do CSS para blindar o escopo do componente contra estilos globais externos
import "./video.css";

// Declaração de tipos para registrar e expor o comando customizado no Tiptap
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableVideo: {
      setResizableVideo: (options: { src: string; width?: number; align?: string }) => ReturnType;
    };
  }
}

/**
 * Normaliza links comuns do YouTube e Vimeo para o formato de incorporação (embed) correto.
 */
function normalizeVideoUrl(url: string): string {
  if (!url) return "";

  // 1. Vimeo - Links de Gerenciamento (/manage/videos/ID/HASH)
  const matchVimeoManage = url.match(/vimeo\.com\/manage\/videos\/(\d+)\/([^?]+)/);
  if (matchVimeoManage) {
    return `https://player.vimeo.com/video/${matchVimeoManage[1]}?h=${matchVimeoManage[2]}`;
  }

  // 2. Vimeo - Links privados com hash explícito (/ID/HASH)
  const matchVimeoWithHash = url.match(/vimeo\.com\/(\d+)\/([a-zA-Z0-9]+)/);
  if (matchVimeoWithHash) {
    return `https://player.vimeo.com/video/${matchVimeoWithHash[1]}?h=${matchVimeoWithHash[2]}`;
  }

  // 3. Vimeo - Links normais simples (/ID)
  const matchVimeoSimple = url.match(/vimeo\.com\/(\d+)/);
  if (matchVimeoSimple) {
    return `https://player.vimeo.com/video/${matchVimeoSimple[1]}`;
  }

  // 4. YouTube - Links curtos compartilhados (youtu.be/ID)
  const matchYoutubeShort = url.match(/youtu\.be\/([^?#]+)/);
  if (matchYoutubeShort) {
    return `https://www.youtube.com/embed/${matchYoutubeShort[1]}`;
  }

  // 5. YouTube - Links tradicionais de navegador (?v=ID ou /embed/ID)
  const matchYoutubeReg = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  if (matchYoutubeReg) {
    return `https://www.youtube.com/embed/${matchYoutubeReg[1]}`;
  }

  return url;
}

const VideoNodeView = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: any) => {
  const { src, width, align } = node.attrs;

  // Cálculos de dimensões mantendo a proporção padrão de vídeo (16:9)
  const currentWidth = width || 560;
  const currentHeight = Math.round((currentWidth * 9) / 16);

  return (
    <NodeViewWrapper
      className="udoc-resizable-video-wrapper"
      data-align={align}
    >
      <div
        className={`udoc-resizable-video-container ${
          selected ? "is-selected" : ""
        }`}
        style={{
          position: "relative",
          width: `${currentWidth}px`,
        }}
      >
        {/* MENU FLUTUANTE DE OPÇÕES DO VÍDEO */}
        <div className="udoc-video-floating-menu">
          <button
            type="button"
            className={align === "left" ? "is-active-btn" : ""}
            onClick={() => updateAttributes({ align: "left" })}
            title="Alinhar à esquerda"
          >
            <FaAlignLeft />
          </button>
          <button
            type="button"
            className={align === "center" ? "is-active-btn" : ""}
            onClick={() => updateAttributes({ align: "center" })}
            title="Centralizar"
          >
            <FaAlignCenter />
          </button>
          <button
            type="button"
            className={align === "right" ? "is-active-btn" : ""}
            onClick={() => updateAttributes({ align: "right" })}
            title="Alinhar à direita"
          >
            <FaAlignRight />
          </button>
          <div className="menu-divider" />
          <button
            type="button"
            onClick={deleteNode}
            className="delete-btn"
            title="Remover vídeo"
          >
            <FaTrash />
          </button>
        </div>

        {/* CONTAINER REAL DO IFRAME PLAYER */}
        <div
          style={{
            width: "100%",
            height: `${currentHeight}px`,
            pointerEvents: selected ? "none" : "auto", // Desativa cliques no iframe enquanto selecionado para permitir arrastar
          }}
        >
          {src ? (
            <iframe
              src={src}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: "8px", background: "#000000" }}
            ></iframe>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                color: "#64748b",
              }}
            >
              Nenhum link de vídeo válido inserido.
            </div>
          )}
        </div>

        {/* ALÇA LATERAL PARA EVENTO DE REDIMENSIONAMENTO */}
        <div
          className="video-resizer-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = currentWidth;

            const doDrag = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const nextWidth = Math.max(
                280,
                Math.min(1200, startWidth + deltaX)
              );
              updateAttributes({ width: nextWidth });
            };

            const stopDrag = () => {
              document.removeEventListener("mousemove", doDrag);
              document.removeEventListener("mouseup", stopDrag);
            };

            document.addEventListener("mousemove", doDrag);
            document.addEventListener("mouseup", stopDrag);
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};

export default Node.create({
  name: "resizableVideo",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: {
        default: "",
      },
      width: {
        default: 560,
      },
      align: {
        default: "center",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-resizable-video]",
        getAttrs: (element) => ({
          src: (element as HTMLElement).getAttribute("data-src") || "",
          width: parseInt(
            (element as HTMLElement).getAttribute("data-width") || "560",
            10
          ),
          align: (element as HTMLElement).getAttribute("data-align") || "center",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        "data-resizable-video": "",
        "data-src": HTMLAttributes.src,
        "data-width": HTMLAttributes.width,
        "data-align": HTMLAttributes.align,
      },
    ];
  },

  // Método responsável por registrar o comando customizado no ecossistema do Tiptap
  addCommands() {
    return {
      setResizableVideo:
        (options) =>
        ({ commands }) => {
          const normalizedSrc = normalizeVideoUrl(options.src);

          return commands.insertContent({
            type: this.name,
            attrs: {
              src: normalizedSrc,
              width: options.width ?? 560,
              align: options.align ?? "center",
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },
});