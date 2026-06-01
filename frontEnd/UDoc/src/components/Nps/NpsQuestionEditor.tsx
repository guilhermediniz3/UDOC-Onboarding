/**
 * NpsQuestionEditor — aba de criação de perguntas NPS para admin de Card e Trail.
 * Uso: <NpsQuestionEditor refType="card" refId={id} />
 */
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  Radio,
  Stack,
  Text,
} from "@mantine/core";

import {
  IconCheck,
  IconMoodHappy,
  IconMoodSad,
  IconMoodSmile,
  IconMoodSmileBeam,
  IconMoodNeutral,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";

import {
  getNpsQuestions,
  replaceNpsQuestions,
  type NpsQuestion,
} from "../../services/npsService";

import { TextInput, Textarea } from "@mantine/core";

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
  const [questions, setQuestions] = useState<NpsQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");

  function showMsg(type: "success" | "error", text: string) {
    setMsgType(type); setMessage(text); setTimeout(() => setMessage(""), 3500);
  }

  useEffect(() => {
    getNpsQuestions(refType, refId).then(setQuestions).catch(() => {});
  }, [refType, refId]);

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
      const saved = await replaceNpsQuestions(refType, refId, questions.map((q, i) => ({ ...q, ordem: i })));
      setQuestions(saved);
      showMsg("success", "Perguntas NPS salvas com sucesso!");
    } catch {
      showMsg("error", "Erro ao salvar as perguntas NPS.");
    } finally { setSaving(false); }
  }

  const s = {
    input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
    label: { color: "var(--text-primary)", marginBottom: 4 },
  };

  return (
    <Stack gap="20px">

      <Group justify="space-between" align="center">
        <Stack gap={2}>
          <Text fw={600} c="var(--text-primary)">Perguntas de Pesquisa NPS</Text>
          <Text fz="xs" c="var(--text-secondary)">
            As perguntas aparecem ao final da visualização do {refType === "card" ? "documento" : "trilha"}.
          </Text>
        </Stack>
        <Button leftSection={<IconPlus size={16} />} radius="xl" size="sm"
          variant="light" color="violet" onClick={addQuestion}>
          Adicionar pergunta
        </Button>
      </Group>

      {message && (
        <Alert color={msgType === "success" ? "green" : "red"}
          icon={msgType === "success" ? <IconCheck size={18} /> : <IconX size={18} />} radius="xl">
          {message}
        </Alert>
      )}

      {questions.length === 0 ? (
        <Text ta="center" c="var(--text-secondary)" py="xl">
          Nenhuma pergunta criada. Clique em "Adicionar pergunta" para começar.
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

                <Textarea label="Enunciado da pergunta" placeholder="Ex: Como você avalia este conteúdo?"
                  radius="xl" size="sm" minRows={2} autosize
                  value={q.enunciado}
                  onChange={(e) => updateQuestion(i, "enunciado", e.currentTarget.value)}
                  styles={s} />

                <Radio.Group label="Tipo de resposta" value={q.tipo}
                  onChange={(v) => updateQuestion(i, "tipo", v)}>
                  <Group mt={8} gap="xl">
                    <Radio value="faces" label="Carinhas (satisfação)" styles={{ label: { color: "var(--text-primary)" } }} />
                    <Radio value="text" label="Texto aberto" styles={{ label: { color: "var(--text-primary)" } }} />
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
          <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }}
            loading={saving} onClick={handleSave}>
            Salvar Perguntas NPS
          </Button>
        </Group>
      )}

    </Stack>
  );
}
