import {
  ActionIcon,
  Badge,
  Group,
  PasswordInput,
  Select,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconKey, IconRobot, IconX } from "@tabler/icons-react";

export interface ProviderEntry {
  value: string;        // enum name: GROQ, GEMINI, OPENAI, DEEPSEEK, CLAUDE, OLLAMA, QWEN
  label: string;        // nome de exibição
  placeholder: string;
  globalOnly?: boolean; // true = aparece apenas nas Configurações Gerais (não no usuário/empresa)
  keyLabel?: string;    // label do campo — padrão "Chave de API"
}

export const AI_PROVIDERS: ProviderEntry[] = [
  { value: "GROQ",     label: "Groq",            placeholder: "gsk_..." },
  { value: "GEMINI",   label: "Google Gemini",   placeholder: "AIza..." },
  { value: "OPENAI",   label: "OpenAI (GPT)",    placeholder: "sk-..." },
  { value: "DEEPSEEK", label: "DeepSeek",        placeholder: "sk-..." },
  { value: "CLAUDE",   label: "Claude",          placeholder: "sk-ant-..." },
  {
    value: "OLLAMA", label: "Ollama / Llama", placeholder: "llama3.1:8b",
    globalOnly: true, keyLabel: "Nome do modelo",
  },
  {
    value: "QWEN", label: "Ollama / Qwen", placeholder: "qwen2.5:7b",
    globalOnly: true, keyLabel: "Nome do modelo",
  },
];

interface Props {
  /** Provedor atualmente selecionado como ativo (enum name ou null/vazio) */
  activeProvider: string;
  /** Mapa provedor → valor atual (mascarado ou plain se o usuário digitou) */
  providerKeys: Record<string, string>;
  onActiveProviderChange: (v: string) => void;
  onProviderKeyChange: (provider: string, value: string) => void;
  /** true = exibe também Ollama/Qwen (apenas nas Configurações Gerais). Padrão: false */
  showLocalProviders?: boolean;
}

/** Painel reutilizável de seleção de provedor de IA e configuração de chaves. */
export default function AIProvidersPanel({
  activeProvider,
  providerKeys,
  onActiveProviderChange,
  onProviderKeyChange,
  showLocalProviders = false,
}: Props) {
  const visibleProviders = showLocalProviders
    ? AI_PROVIDERS
    : AI_PROVIDERS.filter((p) => !p.globalOnly);
  const inputStyles = {
    input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
    label: { color: "var(--text-primary)", marginBottom: 4 },
    description: { color: "var(--text-secondary)" },
  };

  return (
    <Stack gap="20px">
      <Select
        label="Provedor ativo"
        description="O sistema usará este provedor para gerar conteúdo com IA"
        placeholder="Selecione o provedor..."
        data={visibleProviders.map((p) => ({ value: p.value, label: p.label }))}
        value={activeProvider || null}
        onChange={(v) => onActiveProviderChange(v ?? "")}
        leftSection={<IconRobot size={16} />}
        clearable
        radius="xl"
        size="sm"
        styles={inputStyles}
      />

      <Stack gap="12px">
        <Text fz="sm" fw={600} c="var(--text-primary)">Chaves de API por provedor</Text>
        <Text fz="xs" c="var(--text-secondary)">
          Configure quantos provedores quiser. Apenas o <strong>provedor ativo</strong> será usado para geração.
        </Text>

        {visibleProviders.map((p) => {
          const val = providerKeys[p.value] ?? "";
          const isMasked = val.includes("...");
          const isActive = activeProvider === p.value;
          const fieldLabel = p.keyLabel ?? "Chave de API";
          const configuredLabel = p.globalOnly ? "Configurado" : "Configurada";

          return (
            <Group key={p.value} gap="sm" align="flex-end">
              <PasswordInput
                label={
                  <Group gap="6px" align="center">
                    <Text fz="sm" fw={600} c="var(--text-primary)">{p.label}</Text>
                    {p.globalOnly && (
                      <Badge variant="outline" color="orange" size="xs">Local</Badge>
                    )}
                    {isMasked && <Badge variant="dot" color="green" size="xs">{configuredLabel}</Badge>}
                    {isActive && <Badge variant="filled" color="violet" size="xs">Ativo</Badge>}
                  </Group>
                }
                description={p.globalOnly ? `Ollama rodando localmente — insira o nome do modelo (ex: ${p.placeholder})` : undefined}
                placeholder={isMasked ? val : p.placeholder}
                value={isMasked ? "" : val}
                onChange={(e) => onProviderKeyChange(p.value, e.currentTarget.value)}
                style={{ flex: 1 }}
                radius="xl"
                size="sm"
                leftSection={<IconKey size={14} />}
                styles={inputStyles}
              />
              {isMasked && (
                <Tooltip label="Redefinir chave" withArrow>
                  <ActionIcon
                    size="lg" radius="xl" variant="light" color="orange"
                    onClick={() => onProviderKeyChange(p.value, "")}
                    mb={1}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          );
        })}
      </Stack>
    </Stack>
  );
}
