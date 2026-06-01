/**
 * NpsResponseWidget — widget de resposta NPS exibido ao final de cards e trilhas.
 * Anônimo: não exige login.
 */
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";

import {
  IconCheck,
  IconMoodHappy,
  IconMoodNeutral,
  IconMoodSad,
  IconMoodSmile,
  IconMoodSmileBeam,
  IconStar,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";

import {
  getNpsQuestions,
  submitNpsResponse,
  type NpsQuestion,
} from "../../services/npsService";

interface Props {
  refType: "card" | "trail";
  refId: number;
}

const FACE_OPTIONS = [
  { score: 1, label: "Insatisfeito", Icon: IconMoodSad,      color: "#ef4444" },
  { score: 2, label: "Normal",       Icon: IconMoodNeutral,   color: "#f97316" },
  { score: 3, label: "Satisfeito",   Icon: IconMoodSmile,     color: "#22c55e" },
  { score: 4, label: "Muito satisfeito", Icon: IconMoodSmileBeam, color: "#7c3aed" },
];

export default function NpsResponseWidget({ refType, refId }: Props) {
  const [questions, setQuestions] = useState<NpsQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, { score?: number; resposta?: string }>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getNpsQuestions(refType, refId).then(setQuestions).catch(() => {});
  }, [refType, refId]);

  if (questions.length === 0 || submitted) {
    if (submitted) {
      return (
        <Paper p="24px" radius="24px" mt="xl"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
          <Group gap="sm" justify="center">
            <IconCheck size={28} color="#22c55e" />
            <Text fw={700} c="var(--text-primary)">Obrigado pela sua avaliação!</Text>
          </Group>
        </Paper>
      );
    }
    return null;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      for (const q of questions) {
        const ans = answers[q.id!];
        if (ans && (ans.score != null || (ans.resposta && ans.resposta.trim()))) {
          await submitNpsResponse({
            questionId: q.id!,
            score: ans.score ?? null,
            resposta: ans.resposta ?? null,
          });
        }
      }
      setSubmitted(true);
    } catch {
      // falha silenciosa — não bloqueia o usuário
      setSubmitted(true);
    } finally { setSubmitting(false); }
  }

  const hasAnyAnswer = Object.values(answers).some(
    (a) => a.score != null || (a.resposta && a.resposta.trim())
  );

  return (
    <Paper p="30px" radius="24px" mt="xl"
      style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
      <Stack gap="24px">

        <Group gap="sm">
          <IconStar size={22} color="var(--mantine-color-violet-5)" />
          <Title order={4} c="var(--text-primary)">Sua opinião importa</Title>
        </Group>

        {questions.map((q) => (
          <Stack key={q.id} gap="12px">
            <Text fz="sm" fw={600} c="var(--text-primary)">{q.enunciado}</Text>

            {q.tipo === "faces" ? (
              <Group gap="md">
                {FACE_OPTIONS.map((opt) => {
                  const selected = answers[q.id!]?.score === opt.score;
                  return (
                    <Tooltip key={opt.score} label={opt.label} withArrow>
                      <ActionIcon
                        size={48}
                        radius="xl"
                        variant={selected ? "filled" : "light"}
                        style={{
                          background: selected ? opt.color : undefined,
                          border: selected ? `2px solid ${opt.color}` : "2px solid transparent",
                          transition: "all 0.15s",
                        }}
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id!]: { ...prev[q.id!], score: opt.score },
                          }))
                        }
                      >
                        <opt.Icon size={28} color={selected ? "white" : opt.color} />
                      </ActionIcon>
                    </Tooltip>
                  );
                })}
              </Group>
            ) : (
              <Textarea
                placeholder="Escreva sua opinião aqui..."
                radius="xl" size="sm" minRows={3} autosize
                value={answers[q.id!]?.resposta || ""}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setAnswers((prev) => ({
                    ...prev,
                    [q.id!]: { ...prev[q.id!], resposta: v },
                  }));
                }}
                styles={{
                  input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
                }}
              />
            )}
          </Stack>
        ))}

        <Group justify="flex-end">
          <Button
            radius="xl" size="sm" variant="gradient"
            gradient={{ from: "violet", to: "blue" }}
            loading={submitting}
            disabled={!hasAnyAnswer}
            onClick={handleSubmit}
          >
            Enviar avaliação
          </Button>
        </Group>

      </Stack>
    </Paper>
  );
}
