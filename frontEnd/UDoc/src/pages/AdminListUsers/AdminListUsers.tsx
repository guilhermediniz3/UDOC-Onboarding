import {
  ActionIcon, Avatar, Badge, Button, Group, Pagination,
  Paper, Select, Stack, Table, Text, TextInput, Tooltip, useMantineColorScheme,
} from "@mantine/core";
import { IconBuilding, IconEdit, IconPlus, IconSearch, IconUser } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getUsers, type UserData } from "../../services/userService";

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", ISM: "ISM", FUNCIONARIO_EXTERNO: "Funcionário" };
const ROLE_COLOR: Record<string, string> = { ADMIN: "violet", ISM: "blue", FUNCIONARIO_EXTERNO: "teal" };

export default function AdminListUsers() {

  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";

  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [tipoFilter, setTipoFilter] = useState<string | null>(null);
  const [companySearch, setCompanySearch] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState("10");
  const [totalPages, setTotalPages] = useState(1);

  async function load() {
    const active = activeFilter === null ? null : activeFilter === "true";
    const response = await getUsers({
      page: page - 1, size: Number(size),
      search, active,
      tipo: tipoFilter,
      company: companySearch,
    });
    setUsers(response.content);
    setTotalPages(response.totalPages);
  }

  useEffect(() => { load(); }, [search, activeFilter, tipoFilter, companySearch, page, size]);

  const s = { input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" } };

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Text c="var(--text-primary)" fw={700} fz={36}>Usuários</Text>
            <Text c="var(--text-secondary)">Gerencie os usuários do sistema</Text>
          </div>
          <Button leftSection={<IconPlus size={18} />} radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }} onClick={() => navigate("/admin/user")}>Novo Usuário</Button>
        </Group>
      </Paper>

      <Paper p="20px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group mb="20px" wrap="wrap">
          <TextInput
            placeholder="Buscar por nome ou e-mail..."
            leftSection={<IconSearch size={18} />}
            value={search}
            onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }}
            radius="xl" size="md" styles={s} miw={220}
          />
          <TextInput
            placeholder="Filtrar por empresa..."
            leftSection={<IconBuilding size={16} />}
            value={companySearch}
            onChange={(e) => { setCompanySearch(e.currentTarget.value); setPage(1); }}
            radius="xl" size="md" styles={s} miw={180}
          />
          <Select
            placeholder="Tipo"
            radius="xl" size="md" clearable
            value={tipoFilter}
            onChange={(v) => { setTipoFilter(v); setPage(1); }}
            data={[{ label: "Interno", value: "INTERNO" }, { label: "Externo", value: "EXTERNO" }]}
            styles={s} w={140}
          />
          <Select
            placeholder="Status"
            radius="xl" size="md" clearable
            value={activeFilter}
            onChange={(v) => { setActiveFilter(v); setPage(1); }}
            data={[{ label: "Ativos", value: "true" }, { label: "Inativos", value: "false" }]}
            styles={s} w={140}
          />
        </Group>

        <Table verticalSpacing="lg" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={48} />
              <Table.Th c="var(--text-primary)">Nome</Table.Th>
              <Table.Th c="var(--text-primary)">E-mail</Table.Th>
              <Table.Th c="var(--text-primary)">Role</Table.Th>
              <Table.Th c="var(--text-primary)">Tipo</Table.Th>
              <Table.Th c="var(--text-primary)">Empresa</Table.Th>
              <Table.Th c="var(--text-primary)">Status</Table.Th>
              <Table.Th c="var(--text-primary)">Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td><Avatar src={u.photo || null} radius="xl" size={36} style={{ border: "2px solid rgba(139,92,246,0.4)" }}>{!u.photo && <IconUser size={18} />}</Avatar></Table.Td>
                <Table.Td><Text fw={700} c="var(--text-primary)">{u.name}</Text></Table.Td>
                <Table.Td><Text c="var(--text-secondary)">{u.email}</Text></Table.Td>
                <Table.Td><Badge color={ROLE_COLOR[u.role] || "gray"} radius="xl" size="md" variant="light">{ROLE_LABEL[u.role] || u.role}</Badge></Table.Td>
                <Table.Td>
                  {u.employeeTipo ? (
                    <Badge color={u.employeeTipo === "INTERNO" ? "blue" : "teal"} radius="xl" size="sm" variant="light">
                      {u.employeeTipo === "INTERNO" ? "Interno" : "Externo"}
                    </Badge>
                  ) : (
                    <Text fz="xs" c="var(--text-secondary)">—</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {u.companyName ? (
                    <Tooltip label={u.companyName} withArrow disabled={u.companyName.length <= 24}>
                      <Group gap={5} wrap="nowrap" style={{ maxWidth: 180 }}>
                        <IconBuilding size={13} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                        <Text fz="sm" c="var(--text-primary)" truncate>{u.companyName}</Text>
                      </Group>
                    </Tooltip>
                  ) : (
                    <Text fz="xs" c="var(--text-secondary)">—</Text>
                  )}
                </Table.Td>
                <Table.Td><Badge color={u.active ? "green" : "red"} radius="xl" size="lg">{u.active ? "ATIVO" : "INATIVO"}</Badge></Table.Td>
                <Table.Td>
                  <ActionIcon radius="xl" size="lg" color="blue" variant={dark ? "light" : "filled"} onClick={() => navigate(`/admin/user/${u.id}`)}><IconEdit size={18} /></ActionIcon>
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
