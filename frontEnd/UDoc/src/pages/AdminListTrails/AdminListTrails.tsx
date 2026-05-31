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

import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  deleteTrail,
  getTrails,
} from "../../services/trailService";

import type { Trail } from "../../types/Trail";

export default function AdminListTrails() {

  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  const [trails, setTrails] = useState<Trail[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState("10");
  const [totalPages, setTotalPages] = useState(1);

  const [opened, { open, close }] = useDisclosure(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  async function loadTrails() {
    const active =
      activeFilter === null ? null : activeFilter === "true";

    const response = await getTrails({
      page: page - 1,
      size: Number(size),
      search,
      active,
    });

    setTrails(response.content);
    setTotalPages(response.totalPages);
  }

  useEffect(() => {
    loadTrails();
  }, [search, activeFilter, page, size]);

  async function handleDelete() {
    if (!selectedId) return;
    await deleteTrail(selectedId);
    close();
    loadTrails();
  }

  return (

    <Stack
      p="30px"
      gap="20px"
      bg="var(--app-bg)"
      mih="100vh"
    >

      <Modal
        opened={opened}
        onClose={close}
        centered
        radius="xl"
        title="Remover trilha"
      >
        <Text mb="lg">Deseja remover esta trilha?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button color="red" onClick={handleDelete}>Remover</Button>
        </Group>
      </Modal>

      <Paper
        p="30px"
        radius="24px"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 30px var(--shadow-color)",
        }}
      >
        <Group justify="space-between" align="center">
          <div>
            <Text c="var(--text-primary)" fw={700} fz={36}>
              Administração de Trilhas
            </Text>
            <Text c="var(--text-secondary)">
              Gerencie as trilhas do sistema
            </Text>
          </div>
          <Button
            leftSection={<IconPlus size={18} />}
            radius="xl"
            size="md"
            variant="gradient"
            gradient={{ from: "violet", to: "blue" }}
            onClick={() => navigate("/admin/trail")}
          >
            Nova Trilha
          </Button>
        </Group>
      </Paper>

      <Paper
        p="20px"
        radius="24px"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 30px var(--shadow-color)",
        }}
      >

        <Group mb="20px">

          <TextInput
            placeholder="Buscar trilha..."
            leftSection={<IconSearch size={18} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            radius="xl"
            size="md"
            styles={{
              input: {
                background: "var(--input-bg)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              },
            }}
          />

          <Select
            placeholder="Status"
            radius="xl"
            size="md"
            clearable
            value={activeFilter}
            onChange={setActiveFilter}
            data={[
              { label: "Ativas", value: "true" },
              { label: "Inativas", value: "false" },
            ]}
            styles={{
              input: {
                background: "var(--input-bg)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              },
            }}
          />

        </Group>

        <Table verticalSpacing="lg" highlightOnHover>

          <Table.Thead>
            <Table.Tr>
              <Table.Th c="var(--text-primary)">Ordem</Table.Th>
              <Table.Th c="var(--text-primary)">Nome</Table.Th>
              <Table.Th c="var(--text-primary)">Descrição</Table.Th>
              <Table.Th c="var(--text-primary)">Status</Table.Th>
              <Table.Th c="var(--text-primary)">Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {trails.map((trail) => (
              <Table.Tr key={trail.id}>

                <Table.Td>
                  <Badge variant="light" color="violet" radius="xl">
                    #{trail.sortOrder}
                  </Badge>
                </Table.Td>

                <Table.Td>
                  <Text fw={700} c="var(--text-primary)">
                    {trail.name}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Text c="var(--text-secondary)">
                    {trail.description || "—"}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Badge
                    color={trail.active ? "green" : "red"}
                    radius="xl"
                    size="lg"
                  >
                    {trail.active ? "ATIVA" : "INATIVA"}
                  </Badge>
                </Table.Td>

                <Table.Td>
                  <Group gap="xs">

                    <ActionIcon
                      radius="xl"
                      size="lg"
                      color="blue"
                      variant={dark ? "light" : "filled"}
                      onClick={() => navigate(`/admin/trail/${trail.id}`)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>

                    <ActionIcon
                      radius="xl"
                      size="lg"
                      color="red"
                      variant={dark ? "light" : "filled"}
                      onClick={() => {
                        setSelectedId(trail.id!);
                        open();
                      }}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>

                  </Group>
                </Table.Td>

              </Table.Tr>
            ))}
          </Table.Tbody>

        </Table>

        <Group justify="space-between" mt="30px">

          <Pagination
            value={page}
            onChange={setPage}
            total={totalPages}
            radius="xl"
          />

          <Select
            value={size}
            onChange={(value) => {
              setSize(value || "10");
              setPage(1);
            }}
            data={["10", "20", "50", "100"]}
            w={120}
            radius="xl"
            styles={{
              input: {
                background: "var(--input-bg)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              },
            }}
          />

        </Group>

      </Paper>

    </Stack>
  );
}
