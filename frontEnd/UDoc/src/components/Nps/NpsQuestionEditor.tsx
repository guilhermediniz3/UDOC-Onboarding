/**
 * NpsQuestionEditor — aba de criação de perguntas NPS para admin de Card e Trail.
 * Uso: <NpsQuestionEditor refType="card" refId={id} />
 */
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Radio,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";

import {
  IconCheck,
  IconMoodNeutral,
  IconMoodSad,
  IconMoodSmile,
  IconMoodSmileBeam,
  IconPlus,
  IconRobot,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";

import {
  generateNpsQuestions,
  getNpsConfig,
  getNpsQuestions,
  replaceNpsQuestions,
  setNpsConfig,
  type NpsQuestion,
} from "../../services/npsService";

interface Props {
  refType: "card" | "trail";
  refId: number;
}

const EMPTY_QUESTION = (refType: "card" | "trail", refId: number): NpsQuestion => ({
  referenceType: refType,
  referenceId: refId,
  enunciado: "",
  tipo: "faces",
});

export default function NpsQuestionEditor({ refType, refId }: Props) {
  const [questions, setQuestions]           = useState<NpsQuestion[]>([]);
  const [preview, setPreview]               = useState<NpsQuestion[]>([]);
  const [enabled, setEnabled]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [generating, setGenerating]         = useState(false);
  const [togglingConfig, setTogglingConfig] = useState(false);
  const [message, setMessage]       = useState("");
  const [msgType, setMsgType]       = useState<"success" | "error">("success");

  function showMsg(type: "success" | "error", text: string) {
    setMsgType(type);
    setMessage(text);
    setTimeout(() => setMessage(""), 3500);
  }

  useEffect(() => {
    getNpsQuestions(refType, refId).then(setQuestions).catch(() => {});
    getNpsConfig(refType, refId).then((c) => setEnabled(c.enabled)).catch(() => {});
  }, [refType, refId]);

  async function handleToggleEnabled(val: boolean) {
    setTogglingConfig(true);
    try {
      await setNpsConfig(refType, refId, val);
      setEnabled(val);
    } catch {
      showMsg("error", "Erro ao salvar configuração.");
    } finally {
      setTogglingConfig(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setPreview([]);
    try {
      const generated = await generateNpsQuestions(refType, refId);
      if (generated.length === 0) { showMsg("error", "O Groq não retornou perguntas. Verifique se há conteúdo disponível."); return; }
      setPreview(generated.map((q) => ({ ...q, referenceType: refType, referenceId: refId })));
      showMsg("success", `${generated.length} perguntas geradas! Revise e clique em "Adicionar todas" para incluir.`);
    } catch (e: any) {
      showMsg("error", e?.response?.data?.message || "Erro ao gerar perguntas com IA.");
    } finally { setGenerating(false); }
  }

  function addPreviewToQuestions() {
    setQuestions((prev) => [...prev, ...preview]);
    setPreview([]);
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, EMPTY_QUESTION(refType, refId)]);
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, field: keyof NpsQuestion, value: any) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  }

  async function handleSave() {
    const incomplete = questions.some((q) => !q.enunciado.trim());
    if (incomplete) { showMsg("error", "Preencha o enunciado de todas as perguntas."); return; }
    setSaving(true);
    try {
      const saved = await replaceNpsQuestions(
        refType, refId,
        questions.map((q, i) => ({ ...q, ordem: i }))
      );
      setQuestions(saved);
      showMsg("success", "Perguntas NPS salvas com sucesso!");
    } catch {
      showMsg("error", "Erro ao salvar as perguntas NPS.");
    } finally {
      setSaving(false);
    }
  }

  const s = {
    input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
    label: { color: "var(--text-primary)", marginBottom: 4 },
  };

  const entity = refType === "card" ? "documento" : "trilha";

  return (
    <Stack gap="20px">

      {/* ── Toggle de habilitação ── */}
      <Paper p="20px" radius="16px" style={{
        background: enabled ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
        border: `1px solid ${enabled ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
      }}>
        <Group justify="space-between" align="center">
          <Stack gap={2}>
            <Text fw={600} c="var(--text-primary)">
              Pesquisa NPS {enabled ? "habilitada" : "desabilitada"}
            </Text>
            <Text fz="xs" c="var(--text-secondary)">
              {enabled
                ? `A pesquisa de satisfação será exibida ao final do ${entity}.`
                : `A pesquisa de satisfação não será exibida para este ${entity}.`}
            </Text>
          </Stack>
          <Switch
            checked={enabled}
            onChange={(e) => handleToggleEnabled(e.currentTarget.checked)}
            disabled={togglingConfig}
            color="green"
            size="md"
            thumbIcon={enabled
              ? <IconCheck size={12} color="white" />
              : <IconX size={12} color="white" />
            }
          />
        </Group>
      </Paper>

      {/* ── Seção de perguntas (só mostra se habilitado) ── */}
      {enabled && (
        <>
          <Stack gap={2}>
            <Text fw={600} c="var(--text-primary)">Perguntas de Pesquisa NPS</Text>
            <Text fz="xs" c="var(--text-secondary)">
              As perguntas aparecem ao final da visualização do {entity}.
            </Text>
          </Stack>

          {/* Botões — idênticos ao padrão da aba Certificação da trilha */}
          <Group gap="sm">
            <Button
              leftSection={<IconRobot size={18} />}
              radius="xl" size="sm"
              variant="gradient" gradient={{ from: "violet", to: "blue" }}
              loading={generating} onClick={handleGenerate}
            >
              Gerar com Groq IA
            </Button>
            <Button leftSection={<IconPlus size={16} />} radius="xl" size="sm"
              variant="light" color="violet" onClick={addQuestion}>
              Adicionar pergunta
            </Button>
          </Group>

          {message && (
            <Alert
              color={msgType === "success" ? "green" : "red"}
              icon={msgType === "success" ? <IconCheck size={18} /> : <IconX size={18} />}
              radius="xl"
            >
              {message}
            </Alert>
          )}

          {/* Preview das perguntas geradas pela IA */}
          {preview.length > 0 && (
            <Paper p="20px" radius="16px"
              style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.3)" }}>
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <IconRobot size={20} color="var(--mantine-color-violet-5)" />
                  <Title order={5} c="var(--text-primary)">Sugestões da IA ({preview.length} perguntas)</Title>
                </Group>
                <Group gap="sm">
                  <Button size="xs" radius="xl" variant="light" color="red" onClick={() => setPreview([])}>Descartar</Button>
                  <Button size="xs" radius="xl" variant="gradient" gradient={{ from: "violet", to: "blue" }} onClick={addPreviewToQuestions}>
                    Adicionar todas
                  </Button>
                </Group>
              </Group>
              <Stack gap="8px">
                {preview.map((q, i) => (
                  <Paper key={i} px="16px" py="12px" radius="12px"
                    style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                    <Group justify="space-between">
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Text fz="sm" fw={500} c="var(--text-primary)">{q.enunciado}</Text>
                        <Text fz="xs" c="var(--text-secondary)">
                          {q.tipo === "faces" ? "Carinhas (1–4)" : "Texto aberto"}
                        </Text>
                      </Stack>
                      <ActionIcon size="sm" radius="xl" color="red" variant="light"
                        onClick={() => setPreview((p) => p.filter((_, pi) => pi !== i))}>
                        <IconX size={12} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          )}

          {questions.length === 0 && preview.length === 0 ? (
            <Text ta="center" c="var(--text-secondary)" py="xl">
              Nenhuma pergunta criada. Use os botões acima para adicionar ou gerar com IA.
            </Text>
          ) : (
            <Stack gap="12px">
              {questions.map((q, i) => (
                <Paper key={i} px="20px" py="16px" radius="16px"
                  style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
                  <Stack gap="14px">

                    <Group justify="space-between" align="center">
                      <Badge variant="light" color="violet" radius="xl">Pergunta {i + 1}</Badge>
                      <ActionIcon size="sm" radius="xl" color="red" variant="light"
                        onClick={() => removeQuestion(i)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>

                    <Textarea
                      label="Enunciado da pergunta"
                      placeholder="Ex: Como você avalia este conteúdo?"
                      radius="xl" size="sm" minRows={2} autosize
                      value={q.enunciado}
                      onChange={(e) => updateQuestion(i, "enunciado", e.currentTarget.value)}
                      styles={s}
                    />

                    <Radio.Group label="Tipo de resposta" value={q.tipo}
                      onChange={(v) => updateQuestion(i, "tipo", v)}>
                      <Group mt={8} gap="xl">
                        <Radio value="faces" label="Carinhas (satisfação)"
                          styles={{ label: { color: "var(--text-primary)" } }} />
                        <Radio value="text" label="Texto aberto"
                          styles={{ label: { color: "var(--text-primary)" } }} />
                      </Group>
                    </Radio.Group>

                    {q.tipo === "faces" && (
                      <Group gap="lg" pt={4}>
                        <Group gap={4}><IconMoodSad size={20} color="#ef4444" /><Text fz="xs" c="var(--text-secondary)">Insatisfeito</Text></Group>
                        <Group gap={4}><IconMoodNeutral size={20} color="#f97316" /><Text fz="xs" c="var(--text-secondary)">Normal</Text></Group>
                        <Group gap={4}><IconMoodSmile size={20} color="#22c55e" /><Text fz="xs" c="var(--text-secondary)">Satisfeito</Text></Group>
                        <Group gap={4}><IconMoodSmileBeam size={20} color="#7c3aed" /><Text fz="xs" c="var(--text-secondary)">Muito satisfeito</Text></Group>
                      </Group>
                    )}

                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}

          {questions.length > 0 && (
            <Group justify="flex-end">
              <Button radius="xl" size="md" variant="gradient"
                gradient={{ from: "violet", to: "blue" }}
                loading={saving} onClick={handleSave}>
                Salvar Perguntas NPS
              </Button>
            </Group>
          )}
        </>
      )}

    </Stack>
  );
}
