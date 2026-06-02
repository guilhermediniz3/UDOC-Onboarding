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

import { IconCheck, IconPlus, IconRobot, IconTrash, IconX } from "@tabler/icons-react";
import { Title } from "@mantine/core";
import { useEffect, useState } from "react";

import {
  generateCardQuestions,
  getCardQuestions,
  replaceCardQuestions,
  type CardQuestion,
} from "../../services/trailLearnerService";

interface Props { cardId: number; }

const EMPTY = (cardId: number): CardQuestion => ({
  enunciado: "", tipo: "vf", opcoes: [], respostaCorreta: "", pontos: 1,
});

export default function CardQuizEditor({ cardId }: Props) {

  const [questions, setQuestions]   = useState<CardQuestion[]>([]);
  const [preview, setPreview]       = useState<CardQuestion[]>([]);
  const [saving, setSaving]         = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage]       = useState("");
  const [msgType, setMsgType]       = useState<"success" | "error">("success");

  function showMsg(type: "success" | "error", text: string) {
    setMsgType(type); setMessage(text); setTimeout(() => setMessage(""), 3500);
  }

  useEffect(() => { getCardQuestions(cardId).then(setQuestions).catch(() => {}); }, [cardId]);

  function updateQ(i: number, field: keyof CardQuestion, value: any) {
    setQuestions((prev) => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  }

  async function handleGenerate() {
    setGenerating(true);
    setPreview([]);
    try {
      const generated = await generateCardQuestions(cardId);
      if (generated.length === 0) { showMsg("error", "O Groq não retornou perguntas. Verifique se o card tem conteúdo."); return; }
      setPreview(generated);
      showMsg("success", `${generated.length} perguntas geradas! Revise e clique em "Adicionar todas" para incluir.`);
    } catch (e: any) {
      showMsg("error", e?.response?.data?.message || "Erro ao gerar perguntas com IA. Verifique se o card tem conteúdo.");
    } finally { setGenerating(false); }
  }

  function addPreviewToQuestions() {
    setQuestions((prev) => [...prev, ...preview]);
    setPreview([]);
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

      <Stack gap={2}>
        <Text fw={600} c="var(--text-primary)">Perguntas de Quiz</Text>
        <Text fz="xs" c="var(--text-secondary)">
          Aparecem após o conteúdo. Total: <b>{totalPontos.toFixed(1)} pts</b> — mínimo 70% para aprovação.
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
        <Button leftSection={<IconPlus size={16} />} radius="xl" size="sm" variant="light" color="violet"
          onClick={() => setQuestions((p) => [...p, EMPTY(cardId)])}>
          Adicionar pergunta
        </Button>
      </Group>

      {message && <Alert color={msgType === "success" ? "green" : "red"}
        icon={msgType === "success" ? <IconCheck size={18} /> : <IconX size={18} />} radius="xl">
        {message}
      </Alert>}

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
                      {q.tipo === "vf" ? "Verdadeiro/Falso" : "Múltipla escolha"} — Resposta: <b>{q.respostaCorreta}</b>
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
          Nenhuma pergunta. Use os botões acima para adicionar ou gerar com IA.
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
