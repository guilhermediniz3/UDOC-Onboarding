import {
  ActionIcon, Avatar, Badge, Button, Group, Modal, Pagination,
  Paper, Select, Stack, Table, Text, TextInput, useMantineColorScheme,
} from "@mantine/core";
import { IconBuilding } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { IconEdit, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteCompany, getCompanies } from "../../services/companyService";
import type { Company } from "../../types/Company";

export default function AdminListCompanies() {

  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState("10");
  const [totalPages, setTotalPages] = useState(1);

  const [opened, { open, close }] = useDisclosure(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  async function load() {
    const active = activeFilter === null ? null : activeFilter === "true";
    const response = await getCompanies({ page: page - 1, size: Number(size), search, active });
    setCompanies(response.content);
    setTotalPages(response.totalPages);
  }

  useEffect(() => { load(); }, [search, activeFilter, page, size]);

  async function handleDelete() {
    if (!selectedId) return;
    await deleteCompany(selectedId);
    close(); load();
  }

  const s = { input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } };

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Modal opened={opened} onClose={close} centered radius="xl" title="Remover empresa">
        <Text mb="lg">Deseja remover esta empresa?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button color="red" onClick={handleDelete}>Remover</Button>
        </Group>
      </Modal>

      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Text c="var(--text-primary)" fw={700} fz={36}>Administração de Empresas</Text>
            <Text c="var(--text-secondary)">Gerencie as empresas do sistema</Text>
          </div>
          <Button leftSection={<IconPlus size={18} />} radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }} onClick={() => navigate("/admin/company")}>
            Nova Empresa
          </Button>
        </Group>
      </Paper>

      <Paper p="20px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group mb="20px">
          <TextInput placeholder="Buscar empresa..." leftSection={<IconSearch size={18} />} value={search} onChange={(e) => setSearch(e.currentTarget.value)} radius="xl" size="md" styles={s} />
          <Select placeholder="Status" radius="xl" size="md" clearable value={activeFilter} onChange={setActiveFilter} data={[{ label: "Ativas", value: "true" }, { label: "Inativas", value: "false" }]} styles={s} />
        </Group>

        <Table verticalSpacing="lg" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={48} />
              <Table.Th c="var(--text-primary)">Matriz</Table.Th>
              <Table.Th c="var(--text-primary)">Nome</Table.Th>
              <Table.Th c="var(--text-primary)">CNPJ</Table.Th>
              <Table.Th c="var(--text-primary)">E-mail</Table.Th>
              <Table.Th c="var(--text-primary)">Status</Table.Th>
              <Table.Th c="var(--text-primary)">Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {companies.map((company) => (
              <Table.Tr key={company.id}>
                <Table.Td>
                  <Avatar src={(company as any).logo || null} radius="xl" size={36}
                    style={{ border: "2px solid rgba(139,92,246,0.4)" }}>
                    {!(company as any).logo && <IconBuilding size={18} />}
                  </Avatar>
                </Table.Td>
                <Table.Td><Text c="var(--text-primary)">{company.headquarters ?? "—"}</Text></Table.Td>
                <Table.Td><Text fw={700} c="var(--text-primary)">{company.name}</Text></Table.Td>
                <Table.Td><Text c="var(--text-secondary)">{company.cnpj}</Text></Table.Td>
                <Table.Td><Text c="var(--text-secondary)">{company.email || "—"}</Text></Table.Td>
                <Table.Td><Badge color={company.active ? "green" : "red"} radius="xl" size="lg">{company.active ? "ATIVA" : "INATIVA"}</Badge></Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon radius="xl" size="lg" color="blue" variant={dark ? "light" : "filled"} onClick={() => navigate(`/admin/company/${company.id}`)}><IconEdit size={18} /></ActionIcon>
                    <ActionIcon radius="xl" size="lg" color="red" variant={dark ? "light" : "filled"} onClick={() => { setSelectedId(company.id!); open(); }}><IconTrash size={18} /></ActionIcon>
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
