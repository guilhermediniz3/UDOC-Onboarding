import {
  ActionIcon,
  Alert,
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
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

import {
  IconCalendar,
  IconCopy,
  IconEdit,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  cloneTrail,
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState("10");
  const [totalPages, setTotalPages] = useState(1);

  const [opened, { open, close }] = useDisclosure(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [cloning, setCloningId] = useState<number | null>(null);

  const isDateFiltered = dateFrom !== "" || dateTo !== "";

  async function loadTrails() {
    const active = activeFilter === null ? null : activeFilter === "true";

    const response = await getTrails({
      page: isDateFiltered ? 0 : page - 1,
      size: isDateFiltered ? 1000 : Number(size),
      search,
      active,
    });

    let content = response.content;

    if (isDateFiltered) {
      content = content.filter((t) => {
        const d = t.createdAt ? t.createdAt.slice(0, 10) : "";
        if (!d) return false;
        if (dateFrom && d < dateFrom) return false;
        if (dateTo   && d > dateTo)   return false;
        return true;
      });
    }

    setTrails(content);
    setTotalPages(isDateFiltered ? 1 : response.totalPages);
  }

  useEffect(() => {
    loadTrails();
  }, [search, activeFilter, page, size, dateFrom, dateTo]);

  async function handleDelete() {
    if (!selectedId) return;
    setDeleteError(null);
    try {
      await deleteTrail(selectedId);
      close();
      loadTrails();
      notifications.show({
        title: "Trilha removida",
        message: "A trilha foi excluída com sucesso.",
        color: "green",
        autoClose: 3000,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao excluir a trilha.";
      setDeleteError(msg);
    }
  }

  async function handleClone(id: number) {
    setCloningId(id);
    try {
      const cloned = await cloneTrail(id);
      notifications.show({
        title: "Trilha clonada",
        message: `"${cloned.name}" criada como inativa. Clique em editar para configurá-la.`,
        color: "violet",
        autoClose: 4000,
      });
      loadTrails();
    } catch {
      notifications.show({
        title: "Erro ao clonar",
        message: "Não foi possível clonar a trilha.",
        color: "red",
        autoClose: 3000,
      });
    } finally {
      setCloningId(null);
    }
  }

  const inputStyles = {
    input: {
      background: "var(--input-bg)",
      border: "1px solid var(--border-color)",
      color: "var(--text-primary)",
    },
  };

  return (

    <Stack
      p="30px"
      gap="20px"
      bg="var(--app-bg)"
      mih="100vh"
    >

      <Modal
        opened={opened}
        onClose={() => { close(); setDeleteError(null); }}
        centered
        radius="xl"
        title="Remover trilha"
        styles={{ header: { background: "var(--card-bg)" }, body: { background: "var(--card-bg)" }, content: { background: "var(--card-bg)" } }}
      >
        <Stack gap="md">
          {deleteError ? (
            <Alert color="red" radius="xl" variant="light" icon={<IconX size={16} />}>
              {deleteError}
            </Alert>
          ) : (
            <Text c="var(--text-secondary)">
              Deseja remover esta trilha permanentemente? Esta ação não pode ser desfeita.
            </Text>
          )}
          <Group justify="flex-end">
            <Button variant="default" radius="xl" onClick={() => { close(); setDeleteError(null); }}>
              {deleteError ? "Fechar" : "Cancelar"}
            </Button>
            {!deleteError && (
              <Button color="red" radius="xl" onClick={handleDelete}>Remover</Button>
            )}
          </Group>
        </Stack>
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

        <Group mb="20px" wrap="wrap">

          <TextInput
            placeholder="Buscar trilha..."
            leftSection={<IconSearch size={18} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            radius="xl"
            size="md"
            styles={inputStyles}
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
            styles={inputStyles}
          />

          <Group gap={6} align="center">
            <IconCalendar size={16} color="var(--text-secondary)" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.currentTarget.value)}
              title="Data inicial"
              style={{ padding: "7px 14px", borderRadius: 20, border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
            />
            <Text fz="sm" c="var(--text-secondary)">até</Text>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.currentTarget.value)}
              title="Data final"
              style={{ padding: "7px 14px", borderRadius: 20, border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
            />
          </Group>

          {isDateFiltered && (
            <Badge color="violet" variant="light" radius="xl" size="lg">
              {trails.length} trilha{trails.length !== 1 ? "s" : ""} no período
            </Badge>
          )}

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

                    <Tooltip label="Editar trilha" withArrow>
                      <ActionIcon
                        radius="xl"
                        size="lg"
                        color="blue"
                        variant={dark ? "light" : "filled"}
                        onClick={() => navigate(`/admin/trail/${trail.id}`)}
                      >
                        <IconEdit size={18} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Clonar trilha" withArrow>
                      <ActionIcon
                        radius="xl"
                        size="lg"
                        color="violet"
                        variant={dark ? "light" : "filled"}
                        loading={cloning === trail.id}
                        onClick={() => handleClone(trail.id!)}
                      >
                        <IconCopy size={18} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Remover trilha" withArrow>
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
                    </Tooltip>

                  </Group>
                </Table.Td>

              </Table.Tr>
            ))}
          </Table.Tbody>

        </Table>

        {!isDateFiltered && (
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
              styles={inputStyles}
            />

          </Group>
        )}

      </Paper>

    </Stack>
  );
}
