import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  useMantineColorScheme,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import {
  IconEdit,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  deleteTrainingRoom,
  getTrainingRooms,
} from "../../services/trainingRoomService";


import type { TrainingRoom } from "../../types/TrainingRoom";

const STATUS_LABEL: Record<string, string> = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  AGENDADA: "blue",
  EM_ANDAMENTO: "orange",
  CONCLUIDA: "green",
  CANCELADA: "red",
};

export default function AdminListTrainingRooms() {

  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  const [rooms, setRooms] = useState<TrainingRoom[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState("10");
  const [totalPages, setTotalPages] = useState(1);

  const [opened, { open, close }] = useDisclosure(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  async function loadRooms() {
    const active = activeFilter === null ? null : activeFilter === "true";
    const response = await getTrainingRooms({
      page: page - 1,
      size: Number(size),
      search,
      active,
    });
    setRooms(response.content);
    setTotalPages(response.totalPages);
  }

  useEffect(() => {
    loadRooms();
  }, [search, activeFilter, page, size]);

  async function handleDelete() {
    if (!selectedId) return;
    await deleteTrainingRoom(selectedId);
    close();
    loadRooms();
  }

  return (

    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Modal opened={opened} onClose={close} centered radius="xl" title="Remover sala de treinamento">
        <Text mb="lg">Deseja remover esta sala de treinamento?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button color="red" onClick={handleDelete}>Remover</Button>
        </Group>
      </Modal>

      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Text c="var(--text-primary)" fw={700} fz={36}>Salas de Treinamento</Text>
            <Text c="var(--text-secondary)">Gerencie as salas de treinamento</Text>
          </div>
          <Button
            leftSection={<IconPlus size={18} />}
            radius="xl" size="md" variant="gradient"
            gradient={{ from: "violet", to: "blue" }}
            onClick={() => navigate("/admin/training-room")}
          >
            Nova Sala
          </Button>
        </Group>
      </Paper>

      <Paper p="20px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>

        <Group mb="20px">
          <TextInput
            placeholder="Buscar sala..."
            leftSection={<IconSearch size={18} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            radius="xl" size="md"
            styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } }}
          />
          <Select
            placeholder="Status" radius="xl" size="md" clearable
            value={activeFilter} onChange={setActiveFilter}
            data={[{ label: "Ativos", value: "true" }, { label: "Inativos", value: "false" }]}
            styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } }}
          />
        </Group>

        <Table verticalSpacing="lg" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th c="var(--text-primary)">Título</Table.Th>
              <Table.Th c="var(--text-primary)">ISM</Table.Th>
              <Table.Th c="var(--text-primary)">Empresa</Table.Th>
              <Table.Th c="var(--text-primary)">Situação</Table.Th>
              <Table.Th c="var(--text-primary)">Status</Table.Th>
              <Table.Th c="var(--text-primary)">Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rooms.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="var(--text-secondary)" py="xl">
                    Nenhuma sala de treinamento cadastrada.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {rooms.map((room) => (
              <Table.Tr key={room.id}>
                <Table.Td><Text fw={700} c="var(--text-primary)">{room.title}</Text></Table.Td>
                <Table.Td><Text c="var(--text-secondary)">{room.ismName || "—"}</Text></Table.Td>
                <Table.Td><Text c="var(--text-secondary)">{room.companyName || "—"}</Text></Table.Td>
                <Table.Td>
                  <Badge
                    color={STATUS_COLOR[room.status] || "gray"}
                    radius="xl" size="lg"
                  >
                    {STATUS_LABEL[room.status] || room.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={room.active ? "green" : "red"} radius="xl" size="lg">
                    {room.active ? "ATIVA" : "INATIVA"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon radius="xl" size="lg" color="blue" variant={dark ? "light" : "filled"}
                      onClick={() => navigate(`/admin/training-room/${room.id}`)}>
                      <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon radius="xl" size="lg" color="red" variant={dark ? "light" : "filled"}
                      onClick={() => { setSelectedId(room.id!); open(); }}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="space-between" mt="30px">
          <Pagination value={page} onChange={setPage} total={totalPages} radius="xl" />
          <Select
            value={size}
            onChange={(v) => { setSize(v || "10"); setPage(1); }}
            data={["10", "20", "50", "100"]} w={120} radius="xl"
            styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } }}
          />
        </Group>

      </Paper>

    </Stack>
  );
}
