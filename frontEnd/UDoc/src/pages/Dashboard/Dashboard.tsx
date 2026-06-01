import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";

import {
  IconChartBar,
  IconEye,
  IconMoodNeutral,
  IconMoodSad,
  IconMoodSmile,
  IconMoodSmileBeam,
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

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Paper p="24px" radius="20px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)", flex: 1 }}>
      <Group gap="lg" align="center">
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={26} color={color} />
        </div>
        <div>
          <Text fz="xs" c="var(--text-secondary)" tt="uppercase" fw={600}>{label}</Text>
          <Text fz="2rem" fw={800} c="var(--text-primary)" style={{ lineHeight: 1 }}>{value}</Text>
        </div>
      </Group>
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
        <MetricCard label="Total de acessos" value={data?.totalCardAccesses ?? "—"} icon={IconEye} color="#7c3aed" />
        <MetricCard label="Média NPS" value={data?.avgNpsScore ? `${data.avgNpsScore.toFixed(1)} / 4` : "—"} icon={IconStar} color="#f97316" />
        <MetricCard label="Respostas NPS" value={data?.totalRespostas ?? totalFaces} icon={IconMoodSmile} color="#22c55e" />
      </Group>

      {/* Carinhas com contagem — destaque visual */}
      <Paper p="28px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
        <Text fw={700} c="var(--text-primary)" mb="xl">
          Distribuição de satisfação {hasFilter ? "(período filtrado)" : "(geral)"}
        </Text>
        {/* As 4 carinhas sempre com as mesmas cores do editor NPS */}
        <Group gap="md" grow>
          {FACES.map((face) => {
            const count = countByScore[face.score] || 0;
            const pct   = totalFaces > 0 ? Math.round((count / totalFaces) * 100) : 0;
            return (
              <div key={face.score} style={{
                background: face.bg,
                border: `2px solid ${face.color}44`,
                borderRadius: 20,
                padding: "24px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}>
                {/* Ícone com a cor exata do editor de perguntas NPS */}
                <face.Icon size={48} color={face.color} />
                <Text fz="2rem" fw={800} c={face.color} style={{ lineHeight: 1 }}>
                  {count}
                </Text>
                <Text fz="xs" fw={600} c="var(--text-secondary)" ta="center">
                  {face.label}
                </Text>
                <div style={{ width: "100%", height: 6, borderRadius: 3, background: "var(--border-color)" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: face.color, transition: "width 0.5s" }} />
                </div>
                <Text fz="xs" c="var(--text-secondary)">{pct}%</Text>
              </div>
            );
          })}
        </Group>
        {totalFaces === 0 && (
          <Text ta="center" fz="xs" c="var(--text-secondary)" mt="md">
            Nenhuma resposta NPS registrada ainda
          </Text>
        )}
      </Paper>

      {/* Linha de tendência */}
      <Paper p="24px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>
        <Text fw={700} c="var(--text-primary)" mb="lg">
          Tendência de satisfação {hasFilter ? "(período filtrado)" : "(últimos 30 dias)"}
        </Text>
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

      {/* Top Cards */}
      <Paper p="24px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group gap="sm" mb="lg">
          <IconChartBar size={20} color="var(--mantine-color-violet-5)" />
          <Text fw={700} c="var(--text-primary)">Documentos mais acessados</Text>
        </Group>
        {(!data?.topCards || data.topCards.length === 0) ? (
          <Text ta="center" c="var(--text-secondary)" py="xl">Nenhum acesso registrado ainda</Text>
        ) : (
          <Stack gap="8px">
            {data.topCards.map((card, i) => {
              const count = Number(card.access_count);
              const barWidth = Math.max(8, Math.round((count / maxAccess) * 180));
              return (
                <Group key={card.id} justify="space-between" align="center"
                  px="16px" py="12px"
                  style={{ background: "var(--app-bg)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
                  <Group gap="sm">
                    <Text fw={700} c="var(--mantine-color-violet-5)" w={24}>{i + 1}.</Text>
                    <Text fz="sm" fw={500} c="var(--text-primary)">{card.title}</Text>
                  </Group>
                  <Group gap="sm" align="center">
                    <div style={{ height: 6, borderRadius: 3, background: "var(--border-color)", width: 180, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: barWidth, borderRadius: 3, background: "linear-gradient(to right, #7c3aed, #2563eb)" }} />
                    </div>
                    <Badge variant="light" color="violet" radius="xl" miw={90} ta="center">
                      {count.toLocaleString("pt-BR")} acessos
                    </Badge>
                  </Group>
                </Group>
              );
            })}
          </Stack>
        )}
      </Paper>

    </Stack>
  );
}
