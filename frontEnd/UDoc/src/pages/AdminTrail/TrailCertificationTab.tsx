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
  Title,
} from "@mantine/core";

import {
  IconCheck,
  IconPlus,
  IconRobot,
  IconStar,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";
import { useActiveAILabel } from "../../hooks/useActiveAILabel";

import {
  getCertificationConfig,
  getTrailQuestions,
  replaceTrailQuestions,
  saveCertificationConfig,
  generateQuestionsWithGroq,
  type TrailQuestion,
  type CertificationConfig,
} from "../../services/trailCertificationService";

interface Props { trailId: number; }

const EMPTY_QUESTION: TrailQuestion = {
  enunciado: "",
  tipo: "vf",
  opcoes: [],
  respostaCorreta: "",
  pontos: 1,
};

/* ── Editor de uma pergunta ── */
function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
}: {
  question: TrailQuestion;
  index: number;
  onChange: (q: TrailQuestion) => void;
  onRemove: () => void;
}) {
  const s = { input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }, label: { color: "var(--text-primary)", marginBottom: 4 } };

  return (
    <Paper px="20px" py="16px" radius="16px"
      style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
      <Stack gap="14px">

        <Group justify="space-between" align="center">
          <Badge variant="light" color="violet" radius="xl">Pergunta {index + 1}</Badge>
          <ActionIcon size="sm" radius="xl" color="red" variant="light" onClick={onRemove}>
            <IconTrash size={14} />
          </ActionIcon>
        </Group>

        <Textarea
          label="Enunciado"
          placeholder="Digite o enunciado da pergunta"
          required radius="xl" size="sm" minRows={2} autosize
          value={question.enunciado}
          onChange={(e) => { const v = e.currentTarget.value; onChange({ ...question, enunciado: v }); }}
          styles={s}
        />

        <Group gap="xl">
          <Radio.Group label="Tipo" value={question.tipo}
            onChange={(v) => onChange({ ...question, tipo: v as "vf" | "multipla", opcoes: v === "vf" ? [] : question.opcoes })}>
            <Group mt={8} gap="lg">
              <Radio value="vf" label="Verdadeiro/Falso" styles={{ label: { color: "var(--text-primary)" } }} />
              <Radio value="multipla" label="Múltipla escolha" styles={{ label: { color: "var(--text-primary)" } }} />
            </Group>
          </Radio.Group>

          <NumberInput label="Pontos" min={0.5} step={0.5} radius="xl" size="sm" w={100}
            value={question.pontos}
            onChange={(v) => onChange({ ...question, pontos: Number(v) || 1 })}
            styles={s} />
        </Group>

        {question.tipo === "vf" ? (
          <Radio.Group label="Resposta correta" value={question.respostaCorreta}
            onChange={(v) => onChange({ ...question, respostaCorreta: v })}>
            <Group mt={8} gap="lg">
              <Radio value="verdadeiro" label="Verdadeiro" styles={{ label: { color: "var(--text-primary)" } }} />
              <Radio value="falso" label="Falso" styles={{ label: { color: "var(--text-primary)" } }} />
            </Group>
          </Radio.Group>
        ) : (
          <Stack gap="8px">
            <Text fz="sm" c="var(--text-primary)" fw={500}>Opções</Text>
            {(question.opcoes || []).map((opt, oi) => (
              <Group key={oi} gap="sm">
                <Radio
                  checked={question.respostaCorreta === opt}
                  onChange={() => onChange({ ...question, respostaCorreta: opt })}
                  label=""
                  styles={{ radio: { cursor: "pointer" } }}
                />
                <TextInput
                  placeholder={`Opção ${oi + 1}`}
                  radius="xl" size="sm" style={{ flex: 1 }}
                  value={opt}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    const newOpts = [...(question.opcoes || [])];
                    newOpts[oi] = v;
                    onChange({ ...question, opcoes: newOpts });
                  }}
                  styles={s}
                />
                <ActionIcon size="sm" radius="xl" color="red" variant="subtle"
                  onClick={() => {
                    const newOpts = (question.opcoes || []).filter((_, i) => i !== oi);
                    onChange({ ...question, opcoes: newOpts, respostaCorreta: question.respostaCorreta === opt ? "" : question.respostaCorreta });
                  }}>
                  <IconX size={12} />
                </ActionIcon>
              </Group>
            ))}
            <Button size="xs" variant="subtle" radius="xl" leftSection={<IconPlus size={12} />}
              onClick={() => onChange({ ...question, opcoes: [...(question.opcoes || []), ""] })}>
              Adicionar opção
            </Button>
            {!question.respostaCorreta && <Text fz="xs" c="orange">Selecione a resposta correta clicando no círculo ao lado da opção.</Text>}
          </Stack>
        )}

      </Stack>
    </Paper>
  );
}

/* ── Aba principal ── */
export default function TrailCertificationTab({ trailId }: Props) {
  const aiLabel = useActiveAILabel();

  const [config, setConfig] = useState<CertificationConfig>({ notaMinima: 7, totalPontos: 0, quantidadePerguntas: 0 });
  const [questions, setQuestions] = useState<TrailQuestion[]>([]);
  const [preview, setPreview] = useState<TrailQuestion[]>([]); // perguntas geradas pela IA esperando aprovação
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type); setMessage(text); setTimeout(() => setMessage(""), 4000);
  }

  useEffect(() => {
    getCertificationConfig(trailId).then(setConfig).catch(() => {});
    getTrailQuestions(trailId).then(setQuestions).catch(() => {});
  }, [trailId]);

  const totalPontos = questions.reduce((sum, q) => sum + (q.pontos || 0), 0);

  async function handleSaveConfig() {
    try {
      const updated = await saveCertificationConfig(trailId, config.notaMinima);
      setConfig((prev) => ({ ...prev, ...updated }));
      showMessage("success", "Nota mínima salva!");
    } catch {
      showMessage("error", "Erro ao salvar a nota mínima.");
    }
  }

  async function handleSaveQuestions() {
    setSaving(true);
    try {
      const saved = await replaceTrailQuestions(trailId, questions);
      setQuestions(saved);
      const updated = await getCertificationConfig(trailId);
      setConfig(updated);
      showMessage("success", "Perguntas salvas com sucesso!");
    } catch {
      showMessage("error", "Erro ao salvar as perguntas.");
    } finally { setSaving(false); }
  }

  async function handleGenerateWithGroq() {
    setGeneratingAI(true);
    setPreview([]);
    try {
      const generated = await generateQuestionsWithGroq(trailId);
      setPreview(generated);
      showMessage("success", `${generated.length} perguntas geradas! Revise e clique em "Adicionar todas" para incluir.`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showMessage("error", e?.response?.data?.message || "Erro ao gerar perguntas com IA. Certifique-se de que a trilha tem cards com conteúdo vinculado.");
    } finally { setGeneratingAI(false); }
  }

  function addPreviewToQuestions() {
    setQuestions((prev) => [...prev, ...preview]);
    setPreview([]);
  }

  return (
    <Stack gap="24px">

      {message && (
        <Alert color={messageType === "success" ? "green" : "red"}
          icon={messageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />} radius="xl">
          {message}
        </Alert>
      )}

      {/* Config: nota mínima */}
      <Paper px="20px" py="16px" radius="16px"
        style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
        <Group gap="lg" align="flex-end" wrap="wrap">
          <NumberInput
            label="Nota mínima para aprovação"
            description="De 0 a 10"
            min={0} max={10} step={0.5}
            radius="xl" size="sm" w={180}
            value={config.notaMinima}
            onChange={(v) => setConfig((p) => ({ ...p, notaMinima: Number(v) || 7 }))}
            styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }, label: { color: "var(--text-primary)", marginBottom: 4 }, description: { color: "var(--text-secondary)" } }}
          />
          <Group gap="md" align="center">
            <div>
              <Text fz="xs" c="var(--text-secondary)">Total de pontos</Text>
              <Text fw={700} c="var(--text-primary)" fz="lg">{totalPontos.toFixed(1)}</Text>
            </div>
            <div>
              <Text fz="xs" c="var(--text-secondary)">Perguntas</Text>
              <Text fw={700} c="var(--text-primary)" fz="lg">{questions.length}</Text>
            </div>
          </Group>
          <Button size="sm" radius="xl" variant="light" color="violet" onClick={handleSaveConfig}>
            Salvar nota mínima
          </Button>
        </Group>
      </Paper>

      {/* Botões de ação */}
      <Group gap="sm">
        <Button
          leftSection={<IconRobot size={18} />}
          radius="xl" size="sm"
          variant="gradient" gradient={{ from: "violet", to: "blue" }}
          loading={generatingAI}
          onClick={handleGenerateWithGroq}
        >
          Gerar com {aiLabel}
        </Button>
        <Button leftSection={<IconPlus size={16} />} radius="xl" size="sm" variant="light" color="violet"
          onClick={() => setQuestions((prev) => [...prev, { ...EMPTY_QUESTION }])}>
          Adicionar pergunta
        </Button>
      </Group>

      {/* Preview das perguntas geradas por IA */}
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
              <Button size="xs" radius="xl" variant="gradient" gradient={{ from: "violet", to: "blue" }}
                onClick={addPreviewToQuestions}>
                Adicionar todas
              </Button>
            </Group>
          </Group>
          <Stack gap="8px">
            {preview.map((q, i) => (
              <QuestionEditor
                key={i} question={q} index={i}
                onChange={(updated) => setPreview((prev) => prev.map((p, pi) => pi === i ? updated : p))}
                onRemove={() => setPreview((prev) => prev.filter((_, pi) => pi !== i))}
              />
            ))}
          </Stack>
        </Paper>
      )}

      <Divider label="Perguntas da trilha" labelPosition="left" />

      {/* Lista de perguntas */}
      {questions.length === 0 ? (
        <Text ta="center" c="var(--text-secondary)" py="xl">
          Nenhuma pergunta cadastrada. Use os botões acima para adicionar ou gerar com IA.
        </Text>
      ) : (
        <Stack gap="12px">
          {questions.map((q, i) => (
            <QuestionEditor
              key={i} question={q} index={i}
              onChange={(updated) => setQuestions((prev) => prev.map((p, pi) => pi === i ? updated : p))}
              onRemove={() => setQuestions((prev) => prev.filter((_, pi) => pi !== i))}
            />
          ))}
        </Stack>
      )}

      {questions.length > 0 && (
        <Group justify="flex-end">
          <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }}
            loading={saving} onClick={handleSaveQuestions}>
            Salvar Perguntas
          </Button>
        </Group>
      )}

    </Stack>
  );
}
