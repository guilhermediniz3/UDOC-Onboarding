import {
  Accordion, Alert, Badge, Checkbox, Group,
  Loader, Paper, Stack, Text, Title, Tooltip, Button,
} from "@mantine/core";
import {
  IconAlertTriangle, IconCheck, IconLock, IconSettings2, IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import type { PermissionDTO, PermissionUpdateDTO, GroupType } from "../../services/permissionService";
import { getAllPermissions, updatePermissions } from "../../services/permissionService";

const GROUP_LABELS: Record<GroupType, string> = {
  FUNCIONARIO_INTERNO: "Func. Interno",
  FUNCIONARIO_EXTERNO: "Func. Externo",
  ISM: "ISM",
};

const GROUP_COLORS: Record<GroupType, string> = {
  FUNCIONARIO_INTERNO: "blue",
  FUNCIONARIO_EXTERNO: "teal",
  ISM: "violet",
};

const ACTION_LABELS: Record<string, string> = {
  VIEW: "Visualizar", CREATE: "Criar", EDIT: "Editar", DELETE: "Deletar",
};

const MODULE_LABELS: Record<string, string> = {
  CARD: "Documentos (Cards)", TRILHA: "Trilhas", SALA: "Salas de Treinamento",
  FUNCIONARIO: "Funcionários", USUARIO: "Usuários", EMPRESA: "Empresas",
  ISM: "ISM", TRAINING: "Treinamentos",
};

const ACTIONS_ORDER = ["VIEW", "CREATE", "EDIT", "DELETE"];
const GROUPS_ORDER: GroupType[] = ["FUNCIONARIO_INTERNO", "FUNCIONARIO_EXTERNO", "ISM"];

type ModuleMap = Record<string, Record<GroupType, Record<string, PermissionDTO>>>;

function buildModuleMap(perms: PermissionDTO[]): ModuleMap {
  const map: ModuleMap = {};
  for (const p of perms) {
    if (!map[p.module]) map[p.module] = {} as any;
    if (!map[p.module][p.groupType]) map[p.module][p.groupType] = {};
    map[p.module][p.groupType][p.action] = p;
  }
  return map;
}

export default function AdminPermissions() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [allPerms, setAllPerms]   = useState<PermissionDTO[]>([]);
  const [dirty, setDirty]         = useState<Record<number, boolean>>({});
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState<string | null>(null);
  const [msg, setMsg]             = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user?.role !== "ADMIN") { navigate("/403", { replace: true }); return; }
    getAllPermissions()
      .then(setAllPerms)
      .catch(() => setMsg({ type: "error", text: "Erro ao carregar permissões." }))
      .finally(() => setLoading(false));
  }, []);

  function toggle(perm: PermissionDTO) {
    setAllPerms(prev => prev.map(p =>
      p.id === perm.id ? { ...p, granted: !p.granted } : p
    ));
    setDirty(prev => ({ ...prev, [perm.id]: true }));
  }

  async function saveModule(module: string) {
    const toSave: PermissionUpdateDTO[] = allPerms
      .filter(p => p.module === module && dirty[p.id] !== undefined)
      .map(p => ({ id: p.id, granted: p.granted }));

    if (toSave.length === 0) return;
    setSaving(module);
    try {
      await updatePermissions(toSave);
      setDirty(prev => {
        const next = { ...prev };
        toSave.forEach(u => delete next[u.id]);
        return next;
      });
      setMsg({ type: "success", text: `Permissões de "${MODULE_LABELS[module] ?? module}" salvas.` });
      setTimeout(() => setMsg(null), 3000);
    } catch {
      setMsg({ type: "error", text: "Erro ao salvar. Tente novamente." });
    } finally {
      setSaving(null);
    }
  }

  if (loading) return (
    <Stack p="30px" align="center" pt="xl"><Loader color="violet" /></Stack>
  );

  const moduleMap = buildModuleMap(allPerms);
  const modules   = Object.keys(moduleMap).sort();

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group gap="sm">
          <IconLock size={28} color="var(--mantine-color-violet-5)" />
          <div>
            <Title order={2} c="var(--text-primary)">Permissões</Title>
            <Text c="var(--text-secondary)" mt={2}>
              Configure o acesso de cada perfil aos módulos do sistema
            </Text>
          </div>
        </Group>
      </Paper>

      {msg && (
        <Alert color={msg.type === "success" ? "green" : "red"} radius="xl" variant="light"
          icon={msg.type === "success" ? <IconCheck size={16} /> : <IconX size={16} />}
          onClose={() => setMsg(null)} withCloseButton>
          {msg.text}
        </Alert>
      )}

      <Alert color="blue" radius="xl" variant="light" icon={<IconSettings2 size={16} />}>
        <Text fz="sm">
          Todas as permissões iniciam <b>concedidas</b>. Desmarque o que não quer permitir e salve por módulo.
          Regras de segurança fixas (Auditoria, Permissões, chat ISM) não aparecem aqui.
        </Text>
      </Alert>

      <Paper p="24px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
        <Accordion multiple chevronPosition="left" variant="separated">
          {modules.map(module => {
            const groups = moduleMap[module];
            const hasUnsaved = allPerms.some(p => p.module === module && dirty[p.id] !== undefined);

            return (
              <Accordion.Item key={module} value={module}
                style={{ border: "1px solid var(--border-color)", borderRadius: 12 }}>
                <Accordion.Control>
                  <Group justify="space-between" pr="md">
                    <Text fw={600} c="var(--text-primary)">
                      {MODULE_LABELS[module] ?? module}
                    </Text>
                    {hasUnsaved && (
                      <Badge color="orange" variant="light" size="sm">não salvo</Badge>
                    )}
                  </Group>
                </Accordion.Control>

                <Accordion.Panel>
                  <Stack gap="16px">
                    {/* Tabela de grupos x ações */}
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--text-secondary)", fontSize: 12 }}>
                              Ação
                            </th>
                            {GROUPS_ORDER.map(gt => (
                              <th key={gt} style={{ padding: "8px 16px", minWidth: 150 }}>
                                <Badge color={GROUP_COLORS[gt]} variant="light" radius="xl">
                                  {GROUP_LABELS[gt]}
                                </Badge>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ACTIONS_ORDER.map(action => (
                            <tr key={action}
                              style={{ borderTop: "1px solid var(--border-color)" }}>
                              <td style={{ padding: "10px 12px", color: "var(--text-primary)", fontSize: 13 }}>
                                {ACTION_LABELS[action] ?? action}
                              </td>
                              {GROUPS_ORDER.map(gt => {
                                const perm = groups[gt]?.[action];
                                if (!perm) {
                                  return <td key={gt} style={{ padding: "10px 16px" }}>
                                    <Text fz="xs" c="var(--text-secondary)">—</Text>
                                  </td>;
                                }
                                return (
                                  <td key={gt} style={{ padding: "10px 16px" }}>
                                    <Group gap="xs">
                                      <Checkbox
                                        checked={perm.granted}
                                        onChange={() => toggle(perm)}
                                        color="violet"
                                        styles={{ input: { cursor: "pointer" } }}
                                      />
                                      {perm.sensitive && (
                                        <Tooltip
                                          label="Permissão sensível: envolve recursos de outro ISM"
                                          withArrow multiline w={240}
                                        >
                                          <IconAlertTriangle size={14} color="#f97316" style={{ cursor: "help" }} />
                                        </Tooltip>
                                      )}
                                    </Group>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <Group justify="flex-end">
                      <Button
                        radius="xl" size="sm"
                        variant="gradient" gradient={{ from: "violet", to: "blue" }}
                        loading={saving === module}
                        onClick={() => saveModule(module)}
                        disabled={!hasUnsaved}
                        leftSection={<IconCheck size={14} />}
                      >
                        Salvar alterações
                      </Button>
                    </Group>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </Paper>
    </Stack>
  );
}
