import {
  ActionIcon, Badge, Button, Group, Modal, Pagination,
  Paper, Select, Stack, Table, Text, TextInput, useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteEmployee, getEmployees } from "../../services/employeeService";
import type { Employee } from "../../types/Employee";

export default function AdminListFuncionarios() {

  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState("10");
  const [totalPages, setTotalPages] = useState(1);

  const [opened, { open, close }] = useDisclosure(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  async function load() {
    const active = activeFilter === null ? null : activeFilter === "true";
    const response = await getEmployees({ page: page - 1, size: Number(size), search, active });
    setEmployees(response.content);
    setTotalPages(response.totalPages);
  }

  useEffect(() => { load(); }, [search, activeFilter, page, size]);

  async function handleDelete() {
    if (!selectedId) return;
    await deleteEmployee(selectedId);
    close(); load();
  }

  const s = { input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } };

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Modal opened={opened} onClose={close} centered radius="xl" title="Remover funcionário externo">
        <Text mb="lg">Deseja remover este funcionário externo?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button color="red" onClick={handleDelete}>Remover</Button>
        </Group>
      </Modal>

      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Text c="var(--text-primary)" fw={700} fz={36}>Funcionários Externos</Text>
            <Text c="var(--text-secondary)">Gerencie os funcionários externos (clientes de treinamento)</Text>
          </div>
          <Button leftSection={<IconPlus size={18} />} radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }} onClick={() => navigate("/admin/funcionario")}>
            Novo Funcionário Externo
          </Button>
        </Group>
      </Paper>

      <Paper p="20px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group mb="20px">
          <TextInput placeholder="Buscar funcionário externo..." leftSection={<IconSearch size={18} />} value={search} onChange={(e) => setSearch(e.currentTarget.value)} radius="xl" size="md" styles={s} />
          <Select placeholder="Status" radius="xl" size="md" clearable value={activeFilter} onChange={setActiveFilter} data={[{ label: "Ativos", value: "true" }, { label: "Inativos", value: "false" }]} styles={s} />
        </Group>

        <Table verticalSpacing="lg" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th c="var(--text-primary)">Nome</Table.Th>
              <Table.Th c="var(--text-primary)">E-mail</Table.Th>
              <Table.Th c="var(--text-primary)">Empresa</Table.Th>
              <Table.Th c="var(--text-primary)">Status</Table.Th>
              <Table.Th c="var(--text-primary)">Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {employees.map((emp) => (
              <Table.Tr key={emp.id}>
                <Table.Td><Text fw={700} c="var(--text-primary)">{emp.name}</Text></Table.Td>
                <Table.Td><Text c="var(--text-secondary)">{emp.email || "—"}</Text></Table.Td>
                <Table.Td><Text c="var(--text-secondary)">{emp.companyName || "—"}</Text></Table.Td>
                <Table.Td><Badge color={emp.active ? "green" : "red"} radius="xl" size="lg">{emp.active ? "ATIVO" : "INATIVO"}</Badge></Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon radius="xl" size="lg" color="blue" variant={dark ? "light" : "filled"} onClick={() => navigate(`/admin/funcionario/${emp.id}`)}><IconEdit size={18} /></ActionIcon>
                    <ActionIcon radius="xl" size="lg" color="red" variant={dark ? "light" : "filled"} onClick={() => { setSelectedId(emp.id!); open(); }}><IconTrash size={18} /></ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="space-between" mt="30px">
          <Pagination value={page} onChange={setPage} total={totalPages} radius="xl" />
          <Select value={size} onChange={(v) => { setSize(v || "10"); setPage(1); }} data={["10", "20", "50", "100"]} w={120} radius="xl" styles={s} />
        </Group>
      </Paper>

    </Stack>
  );
}
