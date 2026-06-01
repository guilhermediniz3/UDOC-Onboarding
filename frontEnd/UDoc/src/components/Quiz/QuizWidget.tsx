/**
 * QuizWidget — exibido após cada card e ao final da trilha.
 * Suporta VF e múltipla escolha. Calcula nota e retorna resultado.
 */
import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Radio,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import {
  IconCheck,
  IconRefresh,
  IconStar,
  IconX,
} from "@tabler/icons-react";

import { useState } from "react";
import type { CardQuestion } from "../../services/trailLearnerService";

interface Props {
  questions: CardQuestion[];
  notaMinima: number;                    // 0-100 (percentual mínimo para aprovação)
  title?: string;
  onAprovado?: (nota: number) => void;   // passa a nota obtida (0-10)
  onReprovado?: (nota: number) => void;  // passa a nota obtida (0-10)
}

export default function QuizWidget({ questions, notaMinima, title, onAprovado, onReprovado }: Props) {

  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [resultado, setResultado] = useState<{ nota: number; aprovado: boolean } | null>(null);

  const totalPontos = questions.reduce((s, q) => s + q.pontos, 0);

  function setResposta(index: number, value: string) {
    if (submitted) return;
    setRespostas((prev) => ({ ...prev, [index]: value }));
  }

  function handleSubmit() {
    let pontosObtidos = 0;
    questions.forEach((q, i) => {
      const resp = respostas[i];
      if (resp && resp.trim().toLowerCase() === q.respostaCorreta.trim().toLowerCase()) {
        pontosObtidos += q.pontos;
      }
    });

    const nota = totalPontos > 0 ? (pontosObtidos / totalPontos) * 10 : 0;
    const aprovado = nota >= (notaMinima / 10);
    setResultado({ nota: Math.round(nota * 10) / 10, aprovado });
    setSubmitted(true);

    if (aprovado) onAprovado?.(nota);
    else onReprovado?.(nota);
  }

  function handleRetry() {
    setRespostas({});
    setSubmitted(false);
    setResultado(null);
  }

  const allAnswered = questions.every((_, i) => !!respostas[i]);

  if (questions.length === 0) return null;

  return (
    <Paper p="28px" radius="24px" mt="xl"
      style={{ background: "var(--card-bg)", border: "2px solid rgba(124,58,237,0.3)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
      <Stack gap="24px">

        <Group gap="sm">
          <IconStar size={22} color="#7c3aed" />
          <Title order={4} c="var(--text-primary)">
            {title || "Quiz de verificação"}
          </Title>
          <Badge variant="light" color="violet" radius="xl" size="sm">
            {questions.length} {questions.length === 1 ? "pergunta" : "perguntas"}
          </Badge>
        </Group>

        {/* Resultado */}
        {submitted && resultado && (
          <Alert
            color={resultado.aprovado ? "green" : "red"}
            radius="xl"
            icon={resultado.aprovado ? <IconCheck size={20} /> : <IconX size={20} />}
          >
            <Stack gap={4}>
              <Text fw={700}>
                {resultado.aprovado
                  ? `Parabéns! Você foi aprovado com nota ${resultado.nota.toFixed(1)}!`
                  : `Não foi dessa vez. Sua nota foi ${resultado.nota.toFixed(1)} (mínimo: ${(notaMinima / 10).toFixed(1)}).`
                }
              </Text>
              {!resultado.aprovado && (
                <Text fz="sm">Revise o conteúdo e tente novamente.</Text>
              )}
            </Stack>
          </Alert>
        )}

        {/* Perguntas */}
        {questions.map((q, i) => {
          const respostaUsuario = respostas[i];
          const isCorrect = submitted && respostaUsuario?.trim().toLowerCase() === q.respostaCorreta.trim().toLowerCase();
          const isWrong = submitted && !isCorrect && !!respostaUsuario;

          return (
            <Paper key={i} px="20px" py="16px" radius="16px"
              style={{
                background: "var(--app-bg)",
                border: `1px solid ${submitted ? (isCorrect ? "#22c55e" : isWrong ? "#ef4444" : "var(--border-color)") : "var(--border-color)"}`,
              }}>
              <Stack gap="14px">

                <Group gap="sm" align="flex-start">
                  <Badge variant="light" color="violet" radius="xl" size="sm">{i + 1}</Badge>
                  <Text fz="sm" fw={600} c="var(--text-primary)" style={{ flex: 1 }}>
                    {q.enunciado}
                  </Text>
                  {submitted && (
                    isCorrect
                      ? <IconCheck size={18} color="#22c55e" />
                      : isWrong
                      ? <IconX size={18} color="#ef4444" />
                      : null
                  )}
                </Group>

                {q.tipo === "vf" ? (
                  <Radio.Group value={respostas[i] || ""} onChange={(v) => setResposta(i, v)}>
                    <Group gap="lg" mt={4}>
                      {["verdadeiro", "falso"].map((opt) => (
                        <Radio key={opt} value={opt} label={opt.charAt(0).toUpperCase() + opt.slice(1)}
                          disabled={submitted}
                          styles={{ label: { color: "var(--text-primary)", cursor: submitted ? "default" : "pointer" } }}
                        />
                      ))}
                    </Group>
                  </Radio.Group>
                ) : (
                  <Radio.Group value={respostas[i] || ""} onChange={(v) => setResposta(i, v)}>
                    <Stack gap="8px" mt={4}>
                      {(q.opcoes || []).map((opt) => (
                        <Radio key={opt} value={opt} label={opt}
                          disabled={submitted}
                          styles={{ label: { color: "var(--text-primary)", cursor: submitted ? "default" : "pointer" } }}
                        />
                      ))}
                    </Stack>
                  </Radio.Group>
                )}

                {submitted && !isCorrect && respostaUsuario && (
                  <Text fz="xs" c="green">
                    Resposta correta: <b>{q.respostaCorreta}</b>
                  </Text>
                )}
              </Stack>
            </Paper>
          );
        })}

        {/* Ações */}
        <Group justify="flex-end" gap="sm">
          {submitted && resultado && !resultado.aprovado && (
            <Button leftSection={<IconRefresh size={16} />} variant="light" color="violet" radius="xl"
              onClick={handleRetry}>
              Tentar novamente
            </Button>
          )}
          {!submitted && (
            <Button variant="gradient" gradient={{ from: "violet", to: "blue" }} radius="xl"
              disabled={!allAnswered} onClick={handleSubmit}>
              Enviar respostas
            </Button>
          )}
        </Group>

      </Stack>
    </Paper>
  );
}
