import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Pagination,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";

import {
  IconChartBar,
  IconEye,
  IconInfoCircle,
  IconMoodNeutral,
  IconMoodSad,
  IconMoodSmile,
  IconMoodSmileBeam,
  IconRoute,
  IconSearch,
  IconStar,
  IconX,
} from "@tabler/icons-react";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useEffect, useState } from "react";

import {
  getNpsDashboard,
  type NpsDashboard,
} from "../../services/npsService";

// Mesmas cores do NpsResponseWidget — mantém consistência visual no sistema
const FACES = [
  { score: 1, label: "Insatisfeito",     Icon: IconMoodSad,       color: "#ef4444", bg: "rgba(239,68,68,0.08)"   },
  { score: 2, label: "Normal",           Icon: IconMoodNeutral,   color: "#f97316", bg: "rgba(249,115,22,0.08)"  },
  { score: 3, label: "Satisfeito",       Icon: IconMoodSmile,     color: "#22c55e", bg: "rgba(34,197,94,0.08)"   },
  { score: 4, label: "Muito satisfeito", Icon: IconMoodSmileBeam, color: "#7c3aed", bg: "rgba(124,58,237,0.08)"  },
];

function MetricCard({ label, value, icon: Icon, color, tooltip }: { label: string; value: string | number; icon: React.ElementType; color: string; tooltip?: string }) {
  return (
    <Paper p="24px" radius="20px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)", flex: 1 }}>
      <Group gap="lg" align="center">
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={26} color={color} />
        </div>
        <div>
          <Group gap={5} align="center">
            <Text fz="xs" c="var(--text-secondary)" tt="uppercase" fw={600}>{label}</Text>
            {tooltip && (
              <Tooltip label={tooltip} withArrow multiline w={270} position="top">
                <IconInfoCircle size={13} color="var(--text-secondary)" style={{ cursor: "help", opacity: 0.65 }} />
              </Tooltip>
            )}
          </Group>
          <Text fz="2rem" fw={800} c="var(--text-primary)" style={{ lineHeight: 1 }}>{value}</Text>
        </div>
      </Group>
    </Paper>
  );
}

const PAGE_SIZE = 10;

// ── Linha de uma carinha NPS compacta ─────────────────────────────────────────
function FaceBadge({ Icon, color, count }: { Icon: React.ElementType; color: string; count: number }) {
  return (
    <Group gap={3} align="center" style={{ minWidth: 32 }}>
      <Icon size={16} color={color} />
      <Text fz="xs" fw={700} c={color}>{count}</Text>
    </Group>
  );
}

// ── Lista de documentos com busca, paginação e NPS por linha ─────────────────
function TopCardsList({
  cards,
  maxAccess,
  hasFilter,
}: {
  cards: { id: number; title: string; access_count: number; score1?: number; score2?: number; score3?: number; score4?: number }[];
  maxAccess: number;
  hasFilter: boolean;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);

  const filtered = cards.filter((c) =>
    !search.trim() || c.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const visible    = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  // offset global para numeração correta ao paginar
  const offset     = (safePage - 1) * PAGE_SIZE;

  return (
    <Paper p="24px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>

      {/* Cabeçalho + busca */}
      <Group justify="space-between" align="center" mb="lg" wrap="wrap" gap="sm">
        <Group gap="sm" align="center">
          <IconChartBar size={20} color="var(--mantine-color-violet-5)" />
          <Text fw={700} c="var(--text-primary)">Documentos mais acessados</Text>
          {cards.length > 0 && (
            <Badge variant="light" color="violet" radius="xl" size="sm">{cards.length}</Badge>
          )}
          <Tooltip
            label={`Ranking de documentos por número de acessos. As carinhas mostram as avaliações NPS de cada documento${hasFilter ? " no período filtrado" : " (todos os tempos para acessos; período filtrado para NPS)"}.`}
            withArrow multiline w={300} position="right"
          >
            <IconInfoCircle size={15} color="var(--text-secondary)" style={{ cursor: "help", opacity: 0.7 }} />
          </Tooltip>
        </Group>
        <TextInput
          placeholder="Buscar documento..."
          leftSection={<IconSearch size={14} />}
          rightSection={search ? (
            <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => { setSearch(""); setPage(1); }}>
              <IconX size={12} />
            </ActionIcon>
          ) : null}
          value={search}
          onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
          radius="xl"
          size="sm"
          w={240}
          styles={{
            input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
          }}
        />
      </Group>

      {/* Lista */}
      {visible.length === 0 ? (
        <Text ta="center" c="var(--text-secondary)" py="xl">
          {search ? "Nenhum documento encontrado" : "Nenhum acesso registrado ainda"}
        </Text>
      ) : (
        <Stack gap="6px">
          {visible.map((card, i) => {
            const count    = Number(card.access_count);
            const barPct   = maxAccess > 0 ? Math.max(4, Math.round((count / maxAccess) * 100)) : 4;
            const s1 = Number(card.score1 || 0);
            const s2 = Number(card.score2 || 0);
            const s3 = Number(card.score3 || 0);
            const s4 = Number(card.score4 || 0);
            const _totalNps = s1 + s2 + s3 + s4;

            return (
              <div key={card.id} style={{
                background: "var(--app-bg)",
                borderRadius: 12,
                border: "1px solid var(--border-color)",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                {/* Número */}
                <Text fw={700} c="var(--mantine-color-violet-5)" style={{ minWidth: 26, textAlign: "right", flexShrink: 0 }}>
                  {offset + i + 1}.
                </Text>

                {/* Nome */}
                <Text fz="sm" fw={500} c="var(--text-primary)" style={{ flex: 1, minWidth: 0 }} truncate>
                  {card.title}
                </Text>

                {/* Barra proporcional */}
                <div style={{ width: 100, height: 5, borderRadius: 3, background: "var(--border-color)", overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ height: "100%", width: `${barPct}%`, borderRadius: 3, background: "linear-gradient(to right, #7c3aed, #2563eb)", transition: "width 0.4s" }} />
                </div>

                {/* Badge de acessos */}
                <Badge variant="light" color="violet" radius="xl" miw={76} ta="center" style={{ flexShrink: 0 }}>
                  {count.toLocaleString("pt-BR")} acessos
                </Badge>

                {/* Separador */}
                <div style={{ width: 1, height: 22, background: "var(--border-color)", flexShrink: 0 }} />

                {/* Carinhas NPS — sempre visíveis; 0 aparece em cinza */}
                <Group gap={8} style={{ flexShrink: 0 }}>
                  <FaceBadge Icon={IconMoodSad}       color="#ef4444" count={s1} />
                  <FaceBadge Icon={IconMoodNeutral}   color="#f97316" count={s2} />
                  <FaceBadge Icon={IconMoodSmile}     color="#22c55e" count={s3} />
                  <FaceBadge Icon={IconMoodSmileBeam} color="#7c3aed" count={s4} />
                </Group>
              </div>
            );
          })}
        </Stack>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <Group justify="center" mt="lg">
          <Pagination
            value={safePage}
            onChange={setPage}
            total={totalPages}
            radius="xl"
            size="sm"
            color="violet"
          />
        </Group>
      )}

    </Paper>
  );
}

export default function Dashboard() {

  const [data, setData] = useState<NpsDashboard | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [applied, setApplied] = useState<{ start?: string; end?: string }>({});

  const hasFilter = !!applied.start || !!applied.end;

  const inputStyle: React.CSSProperties = {
    padding: "6px 14px", borderRadius: 20,
    border: "1px solid var(--border-color)",
    background: "var(--input-bg)", color: "var(--text-primary)",
    fontSize: 13, outline: "none",
  };

  async function load(start?: string, end?: string) {
    try {
      const params: Record<string, string> = {};
      if (start) params.startDate = start;
      if (end)   params.endDate   = end;
      setData(await getNpsDashboard(Object.keys(params).length ? params : undefined));
    } catch { setData(null); }
  }

  useEffect(() => { load(); }, []);

  function handleFilter() {
    setApplied({ start: startDate || undefined, end: endDate || undefined });
    load(startDate || undefined, endDate || undefined);
  }

  function handleClear() {
    setStartDate(""); setEndDate(""); setApplied({});
    load();
  }

  const timelineData = (data?.npsTimeline || [])
    .map((t) => ({ dia: String(t.dia || "").slice(5), media: Number(t.media || 0) }))
    .reverse();

  const countByScore = (data?.satisfactionDistribution || []).reduce((acc, d) => {
    acc[Number(d.score)] = Number(d.total || 0);
    return acc;
  }, {} as Record<number, number>);

  const totalFaces = Object.values(countByScore).reduce((s, v) => s + v, 0);
  const maxAccess  = Number(data?.topCards?.[0]?.access_count || 1);

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      {/* Header + filtro de período */}
      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <div>
            <Title order={2} c="var(--text-primary)" fw={700}>Dashboard NPS</Title>
            <Text c="var(--text-secondary)" mt={4}>
              Acessos aos documentos e satisfação dos usuários
              {hasFilter && <Badge variant="light" color="violet" radius="xl" size="sm" ml="sm">Filtro ativo</Badge>}
            </Text>
          </div>

          <Group gap="sm" align="flex-end" wrap="wrap">
            <div>
              <Text fz="xs" c="var(--text-secondary)" mb={4}>Data início</Text>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.currentTarget.value)} style={inputStyle} />
            </div>
            <div>
              <Text fz="xs" c="var(--text-secondary)" mb={4}>Data fim</Text>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.currentTarget.value)} style={inputStyle} />
            </div>
            <Button radius="xl" size="sm" variant="gradient" gradient={{ from: "violet", to: "blue" }} onClick={handleFilter}>
              Filtrar
            </Button>
            {hasFilter && (
              <Tooltip label="Limpar filtro" withArrow>
                <ActionIcon radius="xl" size="lg" variant="light" color="gray" onClick={handleClear}><IconX size={16} /></ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Métricas */}
      <Group gap="lg" grow>
        <MetricCard
          label="Total de acessos"
          value={data?.totalCardAccesses ?? "—"}
          icon={IconEye}
          color="#7c3aed"
          tooltip="Soma de todos os acessos a documentos do sistema. Cada vez que um usuário abre um documento conta como +1 acesso, independente do usuário ou do documento."
        />
        <MetricCard
          label="Média NPS — Trilhas"
          value={data?.avgNpsScore ? `${data.avgNpsScore.toFixed(1)} / 4` : "—"}
          icon={IconStar}
          color="#f97316"
          tooltip="Média aritmética de todas as avaliações de satisfação das trilhas. Escala: 1 = Insatisfeito · 2 = Normal · 3 = Satisfeito · 4 = Muito satisfeito. Fórmula: soma de todas as notas ÷ total de respostas."
        />
        <MetricCard
          label="Respostas NPS — Trilhas"
          value={data?.totalRespostas ?? totalFaces}
          icon={IconMoodSmile}
          color="#22c55e"
          tooltip="Total de avaliações de satisfação enviadas por usuários ao concluírem trilhas de treinamento. Cada resposta representa uma avaliação distinta de um usuário em uma trilha."
        />
      </Group>

      {/* NPS de Trilhas — distribuição por carinha */}
      <Paper p="20px 24px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
        <Group gap="xs" mb="md" align="center">
          <IconRoute size={18} color="#7c3aed" />
          <Text fw={700} c="var(--text-primary)">
            Satisfação nas Trilhas {hasFilter ? "(período filtrado)" : ""}
          </Text>
          <Tooltip
            label="Distribuição das avaliações de satisfação feitas ao final das trilhas de treinamento. Não inclui avaliações de documentos individuais."
            withArrow multiline w={280} position="right"
          >
            <IconInfoCircle size={15} color="var(--text-secondary)" style={{ cursor: "help", opacity: 0.7 }} />
          </Tooltip>
          {totalFaces === 0 && (
            <Text fz="xs" c="var(--text-secondary)" ml="auto">Nenhuma avaliação de trilha registrada ainda</Text>
          )}
        </Group>
        <Group gap="lg" grow>
          {FACES.map((face) => {
            const count = countByScore[face.score] || 0;
            const pct   = totalFaces > 0 ? Math.round((count / totalFaces) * 100) : 0;
            return (
              <div key={face.score} style={{
                background: face.bg,
                border: `2px solid ${face.color}55`,
                borderRadius: 16,
                boxShadow: `0 4px 20px ${face.color}18`,
                padding: "20px 12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}>
                <face.Icon size={48} color={face.color} stroke={1.5} />
                <Text fz="2rem" fw={900} c={face.color} style={{ lineHeight: 1 }}>
                  {count}
                </Text>
                <Text fz="xs" fw={700} c={face.color} style={{ opacity: 0.8 }}>
                  {pct}%
                </Text>
              </div>
            );
          })}
        </Group>
      </Paper>

      {/* Tendência de satisfação das Trilhas */}
      <Paper p="24px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
        <Group gap="xs" mb="lg" align="center">
          <Text fw={700} c="var(--text-primary)">
            Tendência de satisfação — Trilhas {hasFilter ? "(período filtrado)" : "(últimos 30 dias)"}
          </Text>
          <Tooltip
            label="Média diária das avaliações NPS das trilhas de treinamento. Escala de 1 (Insatisfeito) a 4 (Muito satisfeito)."
            withArrow multiline w={260} position="right"
          >
            <IconInfoCircle size={15} color="var(--text-secondary)" style={{ cursor: "help", opacity: 0.7 }} />
          </Tooltip>
        </Group>
        {timelineData.length === 0 ? (
          <Text ta="center" c="var(--text-secondary)" py="xl">Sem dados de NPS no período</Text>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="dia" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <YAxis domain={[1, 4]} ticks={[1, 2, 3, 4]}
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                tickFormatter={(v) => ["", "😞", "😐", "😊", "😁"][v] || v}
              />
              <ReTooltip
                contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: 12 }}
                labelStyle={{ color: "var(--text-primary)" }}
                formatter={(v: number) => {
                  const face = FACES.find((f) => f.score === Math.round(v));
                  const emoji = ["", "😞", "😐", "😊", "😁"][Math.round(v)] || "";
                  return [`${v.toFixed(2)} ${emoji} ${face?.label || ""}`, "Média NPS"];
                }}
              />
              <Line type="monotone" dataKey="media" stroke="#7c3aed" strokeWidth={2.5}
                dot={{ r: 4, fill: "#7c3aed" }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* Top Cards — com busca, paginação e NPS por linha */}
      <TopCardsList cards={data?.topCards || []} maxAccess={maxAccess} hasFilter={hasFilter} />

    </Stack>
  );
}
