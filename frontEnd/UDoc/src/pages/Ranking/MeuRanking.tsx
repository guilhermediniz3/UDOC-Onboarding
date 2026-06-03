import {
  Avatar, Badge, Group, Loader, Paper, Progress,
  Stack, Table, Text,
} from "@mantine/core";
import { IconMedal } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { RankingEntry } from "../../services/rankingService";
import { getRankingExterno } from "../../services/rankingService";

const MEDAL_COLORS: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

function Pos({ p }: { p: number }) {
  if (p <= 3) return <IconMedal size={18} color={MEDAL_COLORS[p]} />;
  return <Text fz="sm" fw={700} c="var(--text-secondary)">#{p}</Text>;
}

export default function MeuRanking() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRankingExterno()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Stack align="center" py="xl"><Loader color="violet" /></Stack>;
  if (entries.length === 0) return (
    <Text ta="center" c="var(--text-secondary)" py="xl">Nenhum dado disponível ainda.</Text>
  );

  return (
    <Paper p="20px" radius="16px"
      style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}>
      <Table highlightOnHover striped
        styles={{ th: { color: "var(--text-secondary)" }, td: { color: "var(--text-primary)" } }}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={50}>#</Table.Th>
            <Table.Th>Nome</Table.Th>
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
                style={isMe ? { background: "rgba(124,58,237,0.12)" } : {}}>
                <Table.Td><Group justify="center"><Pos p={e.position} /></Group></Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Avatar src={e.employeephoto || null} size={30} radius="xl">{e.employeename?.[0]}</Avatar>
                    <Stack gap={0}>
                      <Text fz="sm" fw={isMe ? 700 : 400}>{e.employeename}</Text>
                      {isMe && <Badge size="xs" color="violet" variant="light">Você</Badge>}
                    </Stack>
                  </Group>
                </Table.Td>
                <Table.Td><Text fz="sm">{e.levelicon} {e.levelname}</Text></Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Text fz="sm" fw={600}>{e.totalxp} XP</Text>
                    <Progress value={Math.min(100, (e.totalxp / 2000) * 100)} size="xs" color="violet" w={70} />
                  </Stack>
                </Table.Td>
                <Table.Td>
                  <Badge color="green" variant="light" size="sm">
                    {e.trailscompleted}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
