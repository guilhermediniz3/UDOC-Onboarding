import {
  TextInput,
  useMantineColorScheme,
} from "@mantine/core";

import { IconSearch } from "@tabler/icons-react";

interface SearchProps {
  value: string;

  onChange: (value: string) => void;

  placeholder?: string;
}

export default function Search({
  value,
  onChange,
  placeholder = "Buscar cards...",
}: SearchProps) {

  const { colorScheme } =
    useMantineColorScheme();

  const isDark =
    colorScheme === "dark";

  return (

    <TextInput
      value={value}
      placeholder={placeholder}
      radius="xl"
      size="lg"
      leftSection={
        <IconSearch size={20} />
      }
      onChange={(e) =>
        onChange(
          e.currentTarget.value
        )
      }
      styles={{
        root: {
          width: "100%",
        },

        input: {

          height: 58,

          paddingLeft: 48,

          fontSize: 18,

          fontWeight: 500,

          color: isDark
            ? "#f8fafc"
            : "#111827",

          background: isDark

            ? `
              linear-gradient(
                135deg,
                rgba(17,24,39,0.72) 0%,
                rgba(15,23,42,0.82) 100%
              )
            `

            : `
              linear-gradient(
                135deg,
                rgba(255,255,255,0.95) 0%,
                rgba(248,250,252,0.96) 100%
              )
            `,

          border: isDark
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid rgba(0,0,0,0.08)",

          boxShadow: isDark

            ? `
              inset 0 1px 0 rgba(255,255,255,0.03),
              0 6px 20px rgba(0,0,0,0.16)
            `

            : `
              inset 0 1px 0 rgba(255,255,255,0.95),
              0 6px 20px rgba(0,0,0,0.06)
            `,

          transition:
            "all 0.2s ease",
        },

        section: {
          color: isDark
            ? "#94a3b8"
            : "#6b7280",
        },
      }}

      style={{
        width: "100%",
      }}
    />
  );
}