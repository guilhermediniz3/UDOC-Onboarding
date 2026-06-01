/**
 * CardQuizEditor — aba de Quiz no editor de Cards.
 * Mesma estrutura do TrailCertificationTab mas para cards.
 */
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  NumberInput,
  Paper,
  Radio,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";

import { IconCheck, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import {
  getCardQuestions,
  replaceCardQuestions,
  type CardQuestion,
} from "../../services/trailLearnerService";

interface Props { cardId: number; }

const EMPTY = (cardId: number): CardQuestion => ({
  enunciado: "", tipo: "vf", opcoes: [], respostaCorreta: "", pontos: 1,
});

export default function CardQuizEditor({ cardId }: Props) {

  const [questions, setQuestions] = useState<CardQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");

  function showMsg(type: "success" | "error", text: string) {
    setMsgType(type); setMessage(text); setTimeout(() => setMessage(""), 3500);
  }

  useEffect(() => { getCardQuestions(cardId).then(setQuestions).catch(() => {}); }, [cardId]);

  function updateQ(i: number, field: keyof CardQuestion, value: any) {
    setQuestions((prev) => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  }

  async function handleSave() {
    const incomplete = questions.some((q) => !q.enunciado.trim() || !q.respostaCorreta.trim());
    if (incomplete) { showMsg("error", "Preencha enunciado e resposta correta de todas as perguntas."); return; }
    setSaving(true);
    try {
      const saved = await replaceCardQuestions(cardId, questions.map((q, i) => ({ ...q, ordem: i })));
      setQuestions(saved);
      showMsg("success", "Perguntas de quiz salvas!");
    } catch { showMsg("error", "Erro ao salvar as perguntas."); }
    finally { setSaving(false); }
  }

  const s = { input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }, label: { color: "var(--text-primary)", marginBottom: 4 } };
  const totalPontos = questions.reduce((sum, q) => sum + (q.pontos || 0), 0);

  return (
    <Stack gap="20px">
      <Group justify="space-between">
        <Stack gap={2}>
          <Text fw={600} c="var(--text-primary)">Perguntas de Quiz</Text>
          <Text fz="xs" c="var(--text-secondary)">
            Aparecem após o conteúdo. Total: <b>{totalPontos.toFixed(1)} pts</b> — mínimo 70% para aprovação.
          </Text>
        </Stack>
        <Button leftSection={<IconPlus size={16} />} radius="xl" size="sm" variant="light" color="violet"
          onClick={() => setQuestions((p) => [...p, EMPTY(cardId)])}>
          Adicionar pergunta
        </Button>
      </Group>

      {message && <Alert color={msgType === "success" ? "green" : "red"}
        icon={msgType === "success" ? <IconCheck size={18} /> : <IconX size={18} />} radius="xl">
        {message}
      </Alert>}

      {questions.length === 0 ? (
        <Text ta="center" c="var(--text-secondary)" py="xl">
          Nenhuma pergunta. Clique em "Adicionar pergunta" para criar o quiz deste card.
        </Text>
      ) : (
        <Stack gap="12px">
          {questions.map((q, i) => (
            <Paper key={i} px="20px" py="16px" radius="16px"
              style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
              <Stack gap="14px">
                <Group justify="space-between">
                  <Badge variant="light" color="violet" radius="xl">Pergunta {i + 1}</Badge>
                  <ActionIcon size="sm" radius="xl" color="red" variant="light"
                    onClick={() => setQuestions((p) => p.filter((_, pi) => pi !== i))}>
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>

                <Textarea label="Enunciado" placeholder="Digite a pergunta..." radius="xl" size="sm" minRows={2} autosize
                  value={q.enunciado} onChange={(e) => { const v = e.currentTarget.value; updateQ(i, "enunciado", v); }}
                  styles={s} />

                <Group gap="xl">
                  <Radio.Group label="Tipo" value={q.tipo}
                    onChange={(v) => updateQ(i, "tipo", v)}>
                    <Group mt={8} gap="lg">
                      <Radio value="vf" label="Verdadeiro/Falso" styles={{ label: { color: "var(--text-primary)" } }} />
                      <Radio value="multipla" label="Múltipla escolha" styles={{ label: { color: "var(--text-primary)" } }} />
                    </Group>
                  </Radio.Group>
                  <NumberInput label="Pontos" min={0.5} step={0.5} radius="xl" size="sm" w={90}
                    value={q.pontos} onChange={(v) => updateQ(i, "pontos", Number(v) || 1)} styles={s} />
                </Group>

                {q.tipo === "vf" ? (
                  <Radio.Group label="Resposta correta" value={q.respostaCorreta}
                    onChange={(v) => updateQ(i, "respostaCorreta", v)}>
                    <Group mt={8} gap="lg">
                      <Radio value="verdadeiro" label="Verdadeiro" styles={{ label: { color: "var(--text-primary)" } }} />
                      <Radio value="falso" label="Falso" styles={{ label: { color: "var(--text-primary)" } }} />
                    </Group>
                  </Radio.Group>
                ) : (
                  <Stack gap="8px">
                    <Text fz="sm" c="var(--text-primary)" fw={500}>Opções (selecione a correta)</Text>
                    {(q.opcoes || []).map((opt, oi) => (
                      <Group key={oi} gap="sm">
                        <Radio checked={q.respostaCorreta === opt}
                          onChange={() => updateQ(i, "respostaCorreta", opt)}
                          styles={{ radio: { cursor: "pointer" } }} label="" />
                        <TextInput placeholder={`Opção ${oi + 1}`} radius="xl" size="sm" style={{ flex: 1 }}
                          value={opt}
                          onChange={(e) => {
                            const v = e.currentTarget.value;
                            const newOpts = [...(q.opcoes || [])];
                            newOpts[oi] = v;
                            updateQ(i, "opcoes", newOpts);
                          }}
                          styles={s} />
                        <ActionIcon size="sm" radius="xl" color="red" variant="subtle"
                          onClick={() => {
                            const newOpts = (q.opcoes || []).filter((_, pi) => pi !== oi);
                            updateQ(i, "opcoes", newOpts);
                            if (q.respostaCorreta === opt) updateQ(i, "respostaCorreta", "");
                          }}>
                          <IconX size={12} />
                        </ActionIcon>
                      </Group>
                    ))}
                    <Button size="xs" variant="subtle" radius="xl" leftSection={<IconPlus size={12} />}
                      onClick={() => updateQ(i, "opcoes", [...(q.opcoes || []), ""])}>
                      Adicionar opção
                    </Button>
                  </Stack>
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
            Salvar Quiz
          </Button>
        </Group>
      )}
    </Stack>
  );
}
