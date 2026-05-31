import { Node, mergeAttributes } from "@tiptap/core";
import type { RawCommands } from "@tiptap/core";
import "./Badge.css";

const Badge = Node.create({
  name: "badge",

  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      text: {
        default: "1",
      },
      color: {
        default: "#2563eb",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-badge]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return {
            text: el.getAttribute("data-text") || el.textContent || "1",
            color: el.getAttribute("data-color") || "#2563eb",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-badge": "",
        "data-text": HTMLAttributes.text,
        "data-color": HTMLAttributes.color,
        class: "udoc-badge",
        style: `background-color: ${HTMLAttributes.color};`,
      }),
    ];
  },

  addCommands(): Partial<RawCommands> {
    return {
      insertBadge:
        (text: string = "1", color: string = "#2563eb") =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { text, color },
          });
        },
    };
  },
});

export default Badge;
