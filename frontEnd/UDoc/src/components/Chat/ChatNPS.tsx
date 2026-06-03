import { Button, Group, Stack, Text } from "@mantine/core";
import {
  IconMoodSad, IconMoodConfuzed, IconMoodNeutral,
  IconMoodSmile, IconMoodSmileBeam,
} from "@tabler/icons-react";
import { useState } from "react";

const FACES = [
  { score: 1, Icon: IconMoodSad,       color: "#ef4444", label: "Ruim" },
  { score: 2, Icon: IconMoodConfuzed,  color: "#f97316", label: "Regular" },
  { score: 3, Icon: IconMoodNeutral,   color: "#eab308", label: "Normal" },
  { score: 4, Icon: IconMoodSmile,     color: "#22c55e", label: "Bom" },
];

interface Props {
  tipo: "IA" | "ISM";
  conversaId: number;
  onAvaliar: (nota: number) => void;
}

export default function ChatNPS({ tipo, conversaId, onAvaliar }: Props) {
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [enviado, setEnviado] = useState(false);

  function handleSelect(score: number) {
    setSelecionado(score);
    setEnviado(true);
    onAvaliar(score);
  }

  if (enviado) {
    return (
      <Stack align="center" gap="xs" py="md">
        <Text fz="lg">🎉</Text>
        <Text fz="sm" fw={600} c="var(--text-primary)">Obrigado pelo feedback!</Text>
        <Text fz="xs" c="var(--text-secondary)">Sua avaliação foi registrada.</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="sm" py="md" align="center"
      style={{ borderTop: "1px solid var(--border-color)", marginTop: 12 }}>
      <Text fz="sm" fw={600} c="var(--text-primary)">
        Como foi sua experiência{tipo === "IA" ? " com o assistente" : " com o ISM"}?
      </Text>
      <Group gap="md" justify="center">
        {FACES.map(({ score, Icon, color, label }) => (
          <Button
            key={score}
            variant="subtle"
            style={{ flexDirection: "column", gap: 4, height: "auto", padding: "8px 12px" }}
            onClick={() => handleSelect(score)}
          >
            <Icon size={32} color={color} />
            <Text fz="xs" c="var(--text-secondary)">{label}</Text>
          </Button>
        ))}
      </Group>
    </Stack>
  );
}
