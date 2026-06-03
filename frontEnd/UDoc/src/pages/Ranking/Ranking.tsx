import {
  Avatar, Badge, Group, Loader, Paper,
  Progress, Stack, Table, Text, Title,
} from "@mantine/core";
import { IconMedal, IconTrophy } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { RankingEntry } from "../../services/rankingService";
import { getRankingInterno } from "../../services/rankingService";

const MEDAL_COLORS: Record<number, string> = {
  1: "#FFD700",
  2: "#C0C0C0",
  3: "#CD7F32",
};

function MedalOrPosition({ position }: { position: number }) {
  if (position <= 3) {
    return <IconMedal size={20} color={MEDAL_COLORS[position]} />;
  }
  return <Text fz="sm" fw={700} c="var(--text-secondary)">#{position}</Text>;
}

export default function Ranking() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRankingInterno()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group gap="sm">
          <IconTrophy size={28} color="var(--mantine-color-yellow-5)" />
          <div>
            <Title order={2} c="var(--text-primary)">Ranking</Title>
            <Text c="var(--text-secondary)" mt={2}>Funcionários internos ordenados por XP</Text>
          </div>
        </Group>
      </Paper>

      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px var(--shadow-color)" }}>

        {loading ? (
          <Stack align="center" py="xl"><Loader color="violet" /></Stack>
        ) : entries.length === 0 ? (
          <Text ta="center" c="var(--text-secondary)" py="xl">Nenhum dado disponível ainda.</Text>
        ) : (
          <Table highlightOnHover striped
            styles={{ th: { color: "var(--text-secondary)", background: "var(--app-bg)" }, td: { color: "var(--text-primary)" } }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={60}>Pos.</Table.Th>
                <Table.Th>Funcionário</Table.Th>
                <Table.Th>Nível</Table.Th>
                <Table.Th>XP</Table.Th>
                <Table.Th>Trilhas</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {entries.map((e) => {
                const isMe = user?.name === e.employeename;
                return (
                  <Table.Tr key={e.employeeid}
                    style={isMe ? { background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)" } : {}}>
                    <Table.Td>
                      <Group justify="center"><MedalOrPosition position={e.position} /></Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar src={e.employeephoto || null} size={36} radius="xl">
                          {e.employeename?.[0]}
                        </Avatar>
                        <Stack gap={0}>
                          <Text fz="sm" fw={isMe ? 700 : 400}>{e.employeename}</Text>
                          {isMe && <Badge size="xs" color="violet" variant="light">Você</Badge>}
                        </Stack>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text fz="sm">{e.levelicon} {e.levelname}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text fz="sm" fw={600}>{e.totalxp} XP</Text>
                        <Progress value={Math.min(100, (e.totalxp / 2000) * 100)} size="xs" color="violet" w={80} />
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="green" variant="light" size="sm">
                        {e.trailscompleted} trilha{e.trailscompleted !== 1 ? "s" : ""}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}
