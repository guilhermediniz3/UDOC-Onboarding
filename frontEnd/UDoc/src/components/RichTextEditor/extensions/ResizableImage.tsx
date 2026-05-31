// ============================================================================
// ARQUIVO: src/components/RichTextEditor/extensions/ResizableImage.tsx
// ============================================================================

import { useRef } from "react";
import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { MarkerArea } from "markerjs2";
import {
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaPen,
  FaTrash,
} from "react-icons/fa";

const ImageNodeView = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: any) => {
  const { src, width, align } = node.attrs;

  const imageRef = useRef<HTMLImageElement>(null);

  function handleEditImage() {
    if (!imageRef.current) {
      return;
    }

    const markerArea = new MarkerArea(imageRef.current);

    // Preserva todas as configurações internas do MarkerJS
    // e altera apenas o z-index.
    markerArea.uiStyleSettings = {
      ...markerArea.uiStyleSettings,
      zIndex: "9999",
    };

    markerArea.addEventListener("render", (event) => {
      updateAttributes({
        src: event.dataUrl,
      });
    });

    markerArea.show();
  }

  return (
    <NodeViewWrapper
      className="udoc-resizable-image-wrapper"
      data-align={align}
      style={{
        display: align === "center" ? "flex" : "inline-flex",
        justifyContent:
          align === "center"
            ? "center"
            : align === "right"
              ? "flex-end"
              : "flex-start",
        width: align === "center" ? "100%" : "auto",
        margin: "12px 0",
      }}
    >
      <div
        className={`udoc-resizable-image-container ${
          selected ? "is-selected" : ""
        }`}
        style={{
          position: "relative",
          width: width ? `${width}px` : "auto",
          maxWidth: "100%",
          display: "inline-block",
        }}
      >
        <div
          className="udoc-image-alignment-toolbar"
          style={{
            position: "absolute",
            top: "-46px",
            left: "50%",
            transform: "translateX(-50%)",
            display: selected ? "flex" : "none",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            padding: "3px",
            gap: "4px",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
            zIndex: 1000,
          }}
        >
          <button
            type="button"
            className={`udoc-image-toolbar-btn ${
              align === "left" ? "active" : ""
            }`}
            onClick={() => updateAttributes({ align: "left" })}
            title="Alinhar à Esquerda"
          >
            <FaAlignLeft />
          </button>

          <button
            type="button"
            className={`udoc-image-toolbar-btn ${
              align === "center" ? "active" : ""
            }`}
            onClick={() => updateAttributes({ align: "center" })}
            title="Centralizar"
          >
            <FaAlignCenter />
          </button>

          <button
            type="button"
            className={`udoc-image-toolbar-btn ${
              align === "right" ? "active" : ""
            }`}
            onClick={() => updateAttributes({ align: "right" })}
            title="Alinhar à Direita"
          >
            <FaAlignRight />
          </button>

          <button
            type="button"
            className="udoc-image-toolbar-btn"
            onClick={handleEditImage}
            title="Editar Imagem"
          >
            <FaPen />
          </button>

          <button
            type="button"
            className="udoc-image-toolbar-btn delete-btn"
            onClick={deleteNode}
            title="Excluir Imagem"
          >
            <FaTrash />
          </button>
        </div>

        <img
          ref={imageRef}
          src={src}
          alt=""
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: "6px",
            outline: selected ? "2px dashed #2563eb" : undefined,
            outlineOffset: selected ? "4px" : undefined,
          }}
        />

        <div
          className="image-resizer-handle br"
          style={{
            position: "absolute",
            bottom: "-6px",
            right: "-6px",
            width: "12px",
            height: "12px",
            backgroundColor: "#2563eb",
            border: "2px solid #ffffff",
            borderRadius: "50%",
            zIndex: 50,
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.3)",
            cursor: "nwse-resize",
            display: selected ? "block" : "none",
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();

            const startX = e.clientX;
            const startWidth = width || 350;

            const doDrag = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const currentWidth = Math.max(
                100,
                Math.min(1200, startWidth + deltaX)
              );

              updateAttributes({
                width: currentWidth,
              });
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
  name: "resizableImage",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      src: {
        default: "",
      },
      width: {
        default: 350,
      },
      align: {
        default: "center",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-resizable-image]",
        getAttrs: (el) => ({
          src: (el as HTMLElement).getAttribute("data-src") || "",
          width: parseInt(
            (el as HTMLElement).getAttribute("data-width") || "350",
            10
          ),
          align:
            (el as HTMLElement).getAttribute("data-align") || "center",
        }),
      },
      {
        tag: "img[src]",
        getAttrs: (el) => ({
          src: (el as HTMLElement).getAttribute("src") || "",
          width: parseInt(
            (el as HTMLElement).getAttribute("width") || "350",
            10
          ),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        "data-resizable-image": "",
        "data-src": HTMLAttributes.src,
        "data-width": HTMLAttributes.width,
        "data-align": HTMLAttributes.align,
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});