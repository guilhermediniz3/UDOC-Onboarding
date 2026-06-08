import { useState } from "react";
import {
  Modal,
  Stack,
  Textarea,
  Button,
  Group,
  Text,
  Loader,
} from "@mantine/core";
import { generateAIContent } from "../../services/aiService";

interface AIPromptModalProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (html: string) => void;
}

export default function AIPromptModal({
  open,
  onClose,
  onGenerated,
}: AIPromptModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");

    try {
      const html = await generateAIContent(prompt);
      onGenerated(html);
      setPrompt("");
      onClose();
    } catch (err: unknown) {
      const apiMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiMsg || "Erro ao gerar conteúdo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={open}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Text size="xl">🤖</Text>
          <Text fw={700}>Gerar conteúdo com IA</Text>
        </Group>
      }
      centered
      radius="lg"
      size="lg"
    >
      <Stack gap="md">
        <Textarea
          placeholder="Ex: Gere um documento de política de qualidade para um time de QA..."
          minRows={4}
          maxRows={8}
          autosize
          value={prompt}
          onChange={(e) => setPrompt(e.currentTarget.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) handleGenerate();
          }}
        />

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            Dica: Ctrl+Enter para gerar
          </Text>
          <Group>
            <Button variant="subtle" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: "violet", to: "blue", deg: 135 }}
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading}
              leftSection={loading ? <Loader size="xs" color="white" /> : <Text>✨</Text>}
            >
              {loading ? "Gerando..." : "Gerar"}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}