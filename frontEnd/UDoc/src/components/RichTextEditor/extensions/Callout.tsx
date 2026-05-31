import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from "@tiptap/react";

const CalloutComponent = ({ node, updateAttributes }: any) => {
  const { type, textAlign } = node.attrs;

  const handleAlign = (alignment: "left" | "center" | "right" | "justify") => {
    updateAttributes({ textAlign: alignment });
  };

  return (
    <NodeViewWrapper
      className={`udoc-callout callout-${type}`}
      data-text-align={textAlign}
    >
      <span className="udoc-callout-alignment-toolbar" contentEditable={false}>
        <button
          type="button"
          className={`udoc-callout-toolbar-btn ${textAlign === "left" ? "active" : ""}`}
          onClick={() => handleAlign("left")}
          title="Alinhar à Esquerda"
        >
          ⟨
        </button>
        <button
          type="button"
          className={`udoc-callout-toolbar-btn ${textAlign === "center" ? "active" : ""}`}
          onClick={() => handleAlign("center")}
          title="Centralizar"
        >
          ◽
        </button>
        <button
          type="button"
          className={`udoc-callout-toolbar-btn ${textAlign === "right" ? "active" : ""}`}
          onClick={() => handleAlign("right")}
          title="Alinhar à Direita"
        >
          ⟩
        </button>
        <button
          type="button"
          className={`udoc-callout-toolbar-btn ${textAlign === "justify" ? "active" : ""}`}
          onClick={() => handleAlign("justify")}
          title="Justificar"
        >
          ≡
        </button>
      </span>

      <div className="udoc-callout-icon" contentEditable={false}>
        {type === "info" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        )}
        {type === "success" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
        {type === "warning" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        )}
        {type === "error" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        )}
      </div>

      <div className="udoc-callout-body">
        <NodeViewContent className="udoc-callout-content" />
      </div>
    </NodeViewWrapper>
  );
};

const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      type: {
        default: "info",
        parseHTML: (element) => {
          const classes = element.getAttribute("class") || "";
          const match = classes.match(/callout-(info|success|warning|error)/);
          return match ? match[1] : "info";
        },
      },
      textAlign: {
        default: "left",
        parseHTML: (element) =>
          element.getAttribute("data-text-align") || "left",
      },
    };
  },

  parseHTML() {
    return [{ tag: "div.udoc-callout" }];
  },

  renderHTML({ node }) {
    return [
      "div",
      mergeAttributes({
        class: `udoc-callout callout-${node.attrs.type}`,
        "data-text-align": node.attrs.textAlign,
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent);
  },
});

export default Callout;
