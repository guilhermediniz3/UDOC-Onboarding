import { Avatar, Badge, Group, Loader, Paper, Select, Stack, Text, TextInput } from "@mantine/core";
import {
  IconMoodConfuzed, IconMoodNeutral, IconMoodSad,
  IconMoodSmile, IconMoodSmileBeam,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import type { NpsChatIsm } from "../../services/auditoriaService";
import { getAuditoriaNpsChat } from "../../services/auditoriaService";
import { getAllIsmsSimple } from "../../services/ismService";
import type { ISM } from "../../types/ISM";

const NOTAS = [
  { nota: "nota1", Icon: IconMoodSad,       color: "#ef4444", label: "Ruim" },
  { nota: "nota2", Icon: IconMoodConfuzed,  color: "#f97316", label: "Regular" },
  { nota: "nota3", Icon: IconMoodNeutral,   color: "#eab308", label: "Normal" },
  { nota: "nota4", Icon: IconMoodSmile,     color: "#22c55e", label: "Bom" },
];

function IsmNpsCard({ ism }: { ism: NpsChatIsm }) {
  return (
    <Paper p="20px" radius="16px"
      style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
      <Group gap="md" align="center" mb="md">
        <Avatar src={ism.ismFoto || null} radius="50%" size={44}
          style={{ border: "2px solid rgba(124,58,237,0.4)" }}>
          {!ism.ismFoto && ism.ismNome?.[0]?.toUpperCase()}
        </Avatar>
        <Stack gap={2}>
          <Text fw={700} fz="sm" c="var(--text-primary)">{ism.ismNome}</Text>
          <Badge size="xs" color="violet" variant="light">{ism.total} avaliação{ism.total !== 1 ? "ões" : ""}</Badge>
        </Stack>
      </Group>

      <Group gap="lg" justify="center">
        {NOTAS.map(({ nota, Icon, color, label }) => {
          const count = ism[nota as keyof NpsChatIsm] as number;
          const pct   = ism.total > 0 ? Math.round((count / ism.total) * 100) : 0;
          return (
            <Stack key={nota} gap={4} align="center">
              <Icon size={32} color={color} />
              <Text fz="lg" fw={800} c="var(--text-primary)">{count}</Text>
              <Text fz="10px" c="var(--text-secondary)">{label}</Text>
              <Badge size="xs" color="gray" variant="light">{pct}%</Badge>
            </Stack>
          );
        })}
      </Group>
    </Paper>
  );
}

export default function AbaNpsChat() {
  const [ismsData, setIsmsData]   = useState<ISM[]>([]);
  const [ismFiltro, setIsmFiltro] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [dados, setDados]         = useState<NpsChatIsm[]>([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => { getAllIsmsSimple().then(setIsmsData).catch(() => {}); }, []);
  useEffect(() => { carregar(); }, [ismFiltro, startDate, endDate]);

  async function carregar() {
    setLoading(true);
    try {
      const r = await getAuditoriaNpsChat({
        ismId:     ismFiltro ? Number(ismFiltro) : undefined,
        startDate: startDate || undefined,
        endDate:   endDate   || undefined,
      });
      setDados(r);
    } catch {} finally { setLoading(false); }
  }

  const inputSm = { input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } };

  return (
    <Stack gap="16px">
      <Group gap="sm" wrap="wrap">
        <Select placeholder="Todos os ISMs" clearable searchable
          value={ismFiltro || null} onChange={(v) => setIsmFiltro(v ?? "")}
          data={ismsData.map((i) => ({ value: String(i.id), label: i.name }))}
          w={220} radius="xl" size="sm" styles={inputSm} />
        <TextInput type="date" label="" placeholder="Data início"
          value={startDate} onChange={(e) => setStartDate(e.currentTarget.value)}
          radius="xl" size="sm" w={160} styles={inputSm} />
        <TextInput type="date" label="" placeholder="Data fim"
          value={endDate} onChange={(e) => setEndDate(e.currentTarget.value)}
          radius="xl" size="sm" w={160} styles={inputSm} />
        <Text fz="xs" c="var(--text-secondary)" style={{ marginLeft: "auto", alignSelf: "center" }}>
          {dados.length} ISM{dados.length !== 1 ? "s" : ""} com avaliações
        </Text>
      </Group>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
          <Loader size="sm" color="violet" />
        </div>
      ) : dados.length === 0 ? (
        <Text ta="center" c="var(--text-secondary)" fz="sm" py="xl">
          Nenhuma avaliação encontrada para o período selecionado.
        </Text>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {dados.map((ism) => <IsmNpsCard key={ism.ismId} ism={ism} />)}
        </div>
      )}
    </Stack>
  );
}
