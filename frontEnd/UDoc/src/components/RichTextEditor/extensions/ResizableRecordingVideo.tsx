// ============================================================================
// ResizableRecordingVideo — vídeo nativo (<video>) com resize e align
// Herda a mesma lógica visual do ResizableVideo (Vimeo/YouTube)
// ============================================================================

import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import {
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaTrash,
} from "react-icons/fa";

import "./video.css";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableRecordingVideo: {
      setResizableRecordingVideo: (options: { src: string; width?: number; align?: string }) => ReturnType;
    };
  }
}

const RecordingVideoNodeView = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: any) => {
  const { src, width, align } = node.attrs;
  const currentWidth  = width || 560;
  const currentHeight = Math.round((currentWidth * 9) / 16);

  return (
    <NodeViewWrapper className="udoc-resizable-video-wrapper" data-align={align}>
      <div
        className={`udoc-resizable-video-container ${selected ? "is-selected" : ""}`}
        style={{ position: "relative", width: `${currentWidth}px` }}
      >
        {/* Menu flutuante — mesmo padrão do ResizableVideo */}
        <div className="udoc-video-floating-menu">
          <button type="button" className={align === "left"   ? "is-active-btn" : ""} onClick={() => updateAttributes({ align: "left" })}   title="Alinhar à esquerda"><FaAlignLeft /></button>
          <button type="button" className={align === "center" ? "is-active-btn" : ""} onClick={() => updateAttributes({ align: "center" })} title="Centralizar"><FaAlignCenter /></button>
          <button type="button" className={align === "right"  ? "is-active-btn" : ""} onClick={() => updateAttributes({ align: "right" })}  title="Alinhar à direita"><FaAlignRight /></button>
          <div className="menu-divider" />
          <button type="button" onClick={deleteNode} className="delete-btn" title="Remover vídeo"><FaTrash /></button>
        </div>

        {/* Player nativo — <video> em vez de <iframe> */}
        <div style={{ width: "100%", height: `${currentHeight}px`, pointerEvents: selected ? "none" : "auto" }}>
          {src ? (
            <video
              src={src}
              controls
              style={{ width: "100%", height: "100%", borderRadius: 8, background: "#000", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, color: "#64748b" }}>
              Nenhum vídeo gravado inserido.
            </div>
          )}
        </div>

        {/* Alça de redimensionamento — idêntica ao ResizableVideo */}
        <div
          className="video-resizer-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = currentWidth;
            const doDrag = (ev: MouseEvent) => {
              const nextWidth = Math.max(280, Math.min(1200, startWidth + ev.clientX - startX));
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
  name: "resizableRecordingVideo",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src:   { default: "" },
      width: { default: 560 },
      align: { default: "center" },
    };
  },

  parseHTML() {
    return [{
      tag: "div[data-recording-video]",
      getAttrs: (el) => ({
        src:   (el as HTMLElement).getAttribute("data-src")   || "",
        width: parseInt((el as HTMLElement).getAttribute("data-width") || "560", 10),
        align: (el as HTMLElement).getAttribute("data-align") || "center",
      }),
    }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-recording-video": "", "data-src": HTMLAttributes.src, "data-width": HTMLAttributes.width, "data-align": HTMLAttributes.align }];
  },

  addCommands() {
    return {
      setResizableRecordingVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { src: options.src, width: options.width ?? 560, align: options.align ?? "center" },
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(RecordingVideoNodeView);
  },
});
