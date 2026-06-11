import {
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";

import { notifications } from "@mantine/notifications";

import {
  IconBrain,
  IconCalendar,
  IconCheck,
  IconMessage2Question,
  IconRefresh,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  classificarChat,
  getTopicosChat,
  getPendentesChat,
  sugerirCardChat,
} from "../../services/chatApiService";

import type { CardSugestao, ChatTopico } from "../../services/chatApiService";

export default function AdminChatInsights() {
  const navigate = useNavigate();

  const [topicos, setTopicos] = useState<ChatTopico[]>([]);
  const [pendentes, setPendentes] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loadingTopicos, setLoadingTopicos] = useState(false);
  const [classificando, setClassificando] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [topicoSelecionado, setTopicoSelecionado] = useState<ChatTopico | null>(null);
  const [sugestao, setSugestao] = useState<CardSugestao | null>(null);
  const [loadingSugestao, setLoadingSugestao] = useState(false);
  const [criandoCard, setCriandoCard] = useState(false);

  async function carregarTopicos() {
    setLoadingTopicos(true);
    try {
      const [lista, qtdPendentes] = await Promise.all([
        getTopicosChat(dateFrom || undefined, dateTo || undefined),
        getPendentesChat(),
      ]);
      setTopicos(lista);
      setPendentes(qtdPendentes);
    } catch {
      notifications.show({
        title: "Erro",
        message: "Não foi possível carregar os tópicos.",
        color: "red",
        autoClose: 3000,
      });
    } finally {
      setLoadingTopicos(false);
    }
  }

  useEffect(() => {
    carregarTopicos();
  }, [dateFrom, dateTo]);

  async function handleClassificar() {
    setClassificando(true);
    try {
      const result = await classificarChat(50);
      notifications.show({
        title: "Análise concluída",
        message: `${result.classificadas} mensagens classificadas. Pendentes restantes: ${result.pendentes}.`,
        color: "violet",
        autoClose: 5000,
      });
      carregarTopicos();
    } catch {
      notifications.show({
        title: "Erro na análise",
        message: "Não foi possível classificar as mensagens. Verifique se há IA configurada.",
        color: "red",
        autoClose: 4000,
      });
    } finally {
      setClassificando(false);
    }
  }

  async function handleAbrirSugestao(topico: ChatTopico) {
    setTopicoSelecionado(topico);
    setSugestao(null);
    setModalAberto(true);
    setLoadingSugestao(true);
    try {
      const s = await sugerirCardChat(topico.tema, topico.total);
      setSugestao(s);
    } catch {
      notifications.show({
        title: "Erro",
        message: "Não foi possível gerar sugestão de card.",
        color: "red",
        autoClose: 3000,
      });
      setModalAberto(false);
    } finally {
      setLoadingSugestao(false);
    }
  }

  function handleCriarCard() {
    if (!sugestao) return;
    setCriandoCard(true);
    setModalAberto(false);
    navigate("/admin/card", {
      state: {
        prefill: {
          title: sugestao.tema,
          content: sugestao.conteudoHtml,
        },
      },
    });
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  const totalPerguntas = topicos.reduce((acc, t) => acc + t.total, 0);

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      {/* Header */}
      <Paper
        p="30px"
        radius="24px"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 30px var(--shadow-color)",
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <div>
            <Group gap={10} mb={4}>
              <IconMessage2Question size={28} color="var(--mantine-color-violet-5)" />
              <Text c="var(--text-primary)" fw={700} fz={32}>
                Dúvidas Frequentes do Chat
              </Text>
            </Group>
            <Text c="var(--text-secondary)">
              Perguntas dos clientes classificadas por IA, rankeadas por recorrência
            </Text>
          </div>

          <Group gap="sm">
            {pendentes !== null && pendentes > 0 && (
              <Badge color="orange" variant="light" radius="xl" size="lg">
                {pendentes} não analisadas
              </Badge>
            )}
            <Tooltip
              label={pendentes === 0 ? "Todas as mensagens já foram analisadas" : "Classificar próximas 50 mensagens com IA"}
              withArrow
            >
              <Button
                leftSection={<IconBrain size={16} />}
                radius="xl"
                variant="gradient"
                gradient={{ from: "violet", to: "indigo" }}
                loading={classificando}
                disabled={pendentes === 0}
                onClick={handleClassificar}
              >
                Analisar Dúvidas
              </Button>
            </Tooltip>
          </Group>
        </Group>
      </Paper>

      {/* Indicadores */}
      <Group gap="md" grow>
        <Paper
          p="20px"
          radius="20px"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
            textAlign: "center",
          }}
        >
          <Text fz={36} fw={800} c="violet">{topicos.length}</Text>
          <Text fz="sm" c="var(--text-secondary)">Temas identificados</Text>
        </Paper>
        <Paper
          p="20px"
          radius="20px"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
            textAlign: "center",
          }}
        >
          <Text fz={36} fw={800} c="blue">{totalPerguntas}</Text>
          <Text fz="sm" c="var(--text-secondary)">Perguntas classificadas</Text>
        </Paper>
        {topicos.length > 0 && (
          <Paper
            p="20px"
            radius="20px"
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              textAlign: "center",
            }}
          >
            <Text fz={22} fw={800} c="teal" lineClamp={2}>{topicos[0].tema}</Text>
            <Text fz="sm" c="var(--text-secondary)">Tema mais frequente</Text>
          </Paper>
        )}
      </Group>

      {/* Filtros + Tabela */}
      <Paper
        p="20px"
        radius="24px"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 30px var(--shadow-color)",
        }}
      >
        <Group mb="20px" justify="space-between" wrap="wrap">
          <Group gap={6} align="center">
            <IconCalendar size={16} color="var(--text-secondary)" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.currentTarget.value)}
              title="Data inicial"
              style={{
                padding: "7px 14px",
                borderRadius: 20,
                border: "1px solid var(--border-color)",
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                fontSize: 14,
                outline: "none",
              }}
            />
            <Text fz="sm" c="var(--text-secondary)">até</Text>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.currentTarget.value)}
              title="Data final"
              style={{
                padding: "7px 14px",
                borderRadius: 20,
                border: "1px solid var(--border-color)",
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                fontSize: 14,
                outline: "none",
              }}
            />
            {(dateFrom || dateTo) && (
              <Button
                size="xs"
                radius="xl"
                variant="subtle"
                color="gray"
                leftSection={<IconX size={12} />}
                onClick={() => { setDateFrom(""); setDateTo(""); }}
              >
                Limpar
              </Button>
            )}
          </Group>

          <Button
            size="sm"
            radius="xl"
            variant="subtle"
            color="violet"
            leftSection={<IconRefresh size={14} />}
            loading={loadingTopicos}
            onClick={carregarTopicos}
          >
            Atualizar
          </Button>
        </Group>

        {loadingTopicos ? (
          <Stack align="center" py={60}>
            <Loader color="violet" size="lg" />
            <Text c="var(--text-secondary)">Carregando tópicos...</Text>
          </Stack>
        ) : topicos.length === 0 ? (
          <Stack align="center" py={60} gap="md">
            <IconMessage2Question size={48} color="var(--text-secondary)" opacity={0.4} />
            <Text c="var(--text-secondary)" ta="center">
              Nenhum tópico encontrado.
              {pendentes !== null && pendentes > 0
                ? ` Clique em "Analisar Dúvidas" para classificar as ${pendentes} mensagens pendentes.`
                : " Aguarde novas perguntas dos clientes no chat."}
            </Text>
          </Stack>
        ) : (
          <Table verticalSpacing="md" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th c="var(--text-primary)" w={50}>#</Table.Th>
                <Table.Th c="var(--text-primary)">Tema</Table.Th>
                <Table.Th c="var(--text-primary)" w={130}>Ocorrências</Table.Th>
                <Table.Th c="var(--text-primary)" w={150}>Última pergunta</Table.Th>
                <Table.Th c="var(--text-primary)" w={150}>Ação</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {topicos.map((t, idx) => (
                <Table.Tr key={t.tema}>
                  <Table.Td>
                    <Badge
                      variant="light"
                      color={idx === 0 ? "yellow" : idx === 1 ? "gray" : idx === 2 ? "orange" : "violet"}
                      radius="xl"
                    >
                      #{idx + 1}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} c="var(--text-primary)">{t.tema}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="violet" variant="filled" radius="xl" size="lg">
                      {t.total}x
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fz="sm" c="var(--text-secondary)">{formatDate(t.ultimaOcorrencia)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      size="xs"
                      radius="xl"
                      variant="light"
                      color="violet"
                      leftSection={<IconSparkles size={13} />}
                      onClick={() => handleAbrirSugestao(t)}
                    >
                      Criar Card com IA
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Modal de sugestão de card */}
      <Modal
        opened={modalAberto}
        onClose={() => { setModalAberto(false); setSugestao(null); }}
        title={
          <Group gap={8}>
            <IconSparkles size={18} color="var(--mantine-color-violet-5)" />
            <Text fw={700} c="var(--text-primary)">
              Sugestão de Card — {topicoSelecionado?.tema}
            </Text>
          </Group>
        }
        size="xl"
        radius="xl"
        centered
        styles={{
          header: { background: "var(--card-bg)" },
          body: { background: "var(--card-bg)" },
          content: { background: "var(--card-bg)" },
        }}
      >
        {loadingSugestao ? (
          <Stack align="center" py={60} gap="md">
            <Loader color="violet" size="lg" />
            <Text c="var(--text-secondary)">
              Gerando sugestão com IA...
            </Text>
          </Stack>
        ) : sugestao ? (
          <Stack gap="md">
            <Group gap={8}>
              <Badge color="violet" variant="light" radius="xl">
                {topicoSelecionado?.total}x perguntado
              </Badge>
              {sugestao.provedor && (
                <Badge color="gray" variant="outline" radius="xl" size="sm">
                  via {sugestao.provedor}
                </Badge>
              )}
            </Group>

            <Paper
              p="md"
              radius="lg"
              style={{
                background: "var(--app-bg)",
                border: "1px solid var(--border-color)",
              }}
            >
              <ScrollArea h={360} scrollbarSize={6}>
                <div
                  style={{ color: "var(--text-primary)", fontSize: 14, lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: sugestao.conteudoHtml }}
                />
              </ScrollArea>
            </Paper>

            <Text fz="xs" c="var(--text-secondary)">
              Esta é uma sugestão gerada pela IA. Você pode editar o conteúdo após criar o card.
            </Text>

            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                radius="xl"
                leftSection={<IconX size={14} />}
                onClick={() => { setModalAberto(false); setSugestao(null); }}
              >
                Cancelar
              </Button>
              <Button
                radius="xl"
                variant="gradient"
                gradient={{ from: "violet", to: "blue" }}
                leftSection={<IconCheck size={14} />}
                loading={criandoCard}
                onClick={handleCriarCard}
              >
                Criar Card
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>

    </Stack>
  );
}
