import {
  Accordion, Alert, Badge, Checkbox, Divider, Group,
  Loader, Paper, Stack, Text, Title, Tooltip, Button, SimpleGrid,
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
  ISM:                 "ISM",
  GESTOR:              "Gestor",
};

// Mantine color tokens
const GROUP_COLOR: Record<GroupType, string> = {
  FUNCIONARIO_INTERNO: "blue",
  FUNCIONARIO_EXTERNO: "teal",
  ISM:                 "violet",
  GESTOR:              "orange",
};

// Cor de borda/fundo do card de grupo
const GROUP_BORDER: Record<GroupType, string> = {
  FUNCIONARIO_INTERNO: "rgba(37,99,235,0.25)",
  FUNCIONARIO_EXTERNO: "rgba(5,150,105,0.25)",
  ISM:                 "rgba(124,58,237,0.25)",
  GESTOR:              "rgba(234,88,12,0.25)",
};

const GROUP_BG: Record<GroupType, string> = {
  FUNCIONARIO_INTERNO: "rgba(37,99,235,0.06)",
  FUNCIONARIO_EXTERNO: "rgba(5,150,105,0.06)",
  ISM:                 "rgba(124,58,237,0.06)",
  GESTOR:              "rgba(234,88,12,0.06)",
};

const ACTION_LABELS: Record<string, string> = {
  VIEW: "Visualizar", CREATE: "Criar", EDIT: "Editar", DELETE: "Deletar",
};

const MODULE_LABELS: Record<string, string> = {
  CARD:               "Documentos (Cards)",
  TRILHA:             "Trilhas",
  SALA:               "Salas de Treinamento",
  FUNCIONARIO:        "Funcionários",
  USUARIO:            "Usuários",
  EMPRESA:            "Empresas",
  ISM:                "ISM",
  TRAINING:           "Treinamentos",
  DOCUMENTO:          "Documentos (menu)",
  CADASTRO_DOCUMENTO: "Cadastro de Documentos (menu)",
  DASHBOARD:          "Dashboard (menu)",
  MATRICULA:          "Matrícula (menu)",
  RANKING:            "Ranking (Gamificação)",
};

// Módulos que só têm a ação VIEW relevante (controle de visibilidade de menu)
const VIEW_ONLY_MODULES = new Set(["DOCUMENTO", "CADASTRO_DOCUMENTO", "DASHBOARD", "MATRICULA", "RANKING"]);

const ACTIONS_ORDER = ["VIEW", "CREATE", "EDIT", "DELETE"];
const GROUPS_ORDER: GroupType[] = ["FUNCIONARIO_INTERNO", "FUNCIONARIO_EXTERNO", "ISM", "GESTOR"];

type ModuleMap = Record<string, Record<GroupType, Record<string, PermissionDTO>>>;

function buildModuleMap(perms: PermissionDTO[]): ModuleMap {
  const map: ModuleMap = {};
  for (const p of perms) {
    if (!map[p.module]) map[p.module] = {} as ModuleMap[string];
    if (!map[p.module][p.groupType]) map[p.module][p.groupType] = {};
    map[p.module][p.groupType][p.action] = p;
  }
  return map;
}

// Ações extras (não são CRUD padrão — cada uma tem sua própria descrição/escopo)
const SPECIAL_ACTIONS = [
  "ISM_RESPONSAVEL", "OUTRO_ISM_MANAGE", "ENVIAR_CONVITE",
  "EDITAR_ISM_OUTRO", "EDITAR_INTERNO_OUTRO", "EDITAR_EXTERNO", "EDITAR_EXTERNO_OUTRO_ISM",
  "VER_ISM_OUTRO", "VER_INTERNO_OUTRO", "VER_EXTERNO", "VER_EXTERNO_OUTRO_ISM",
];

const SPECIAL_ACTION_LABELS: Record<string, string> = {
  ISM_RESPONSAVEL:          "Alterar ISM responsável de funcionário externo",
  OUTRO_ISM_MANAGE:         "Gerenciar salas de outro ISM",
  ENVIAR_CONVITE:           "Enviar link de redefinição de senha (e-mail/WhatsApp)",
  EDITAR_ISM_OUTRO:         "Editar outros usuários ISM",
  EDITAR_INTERNO_OUTRO:     "Editar outros usuários internos",
  EDITAR_EXTERNO:           "Editar usuários externos",
  EDITAR_EXTERNO_OUTRO_ISM: "Editar externos (ISM não responsável)",
  VER_ISM_OUTRO:            "Visualizar outros usuários ISM",
  VER_INTERNO_OUTRO:        "Visualizar outros usuários internos",
  VER_EXTERNO:              "Visualizar usuários externos",
  VER_EXTERNO_OUTRO_ISM:    "Visualizar externos (ISM não responsável)",
};

// ── Cartão de um grupo (ex: Func. Interno) ────────────────────────────────────
function GroupCard({
  module, groupType, actions, onToggle,
}: {
  module: string;
  groupType: GroupType;
  actions: Record<string, PermissionDTO>;
  onToggle: (perm: PermissionDTO) => void;
}) {
  const color  = GROUP_COLOR[groupType];
  const border = GROUP_BORDER[groupType];
  const bg     = GROUP_BG[groupType];

  const visibleActions = VIEW_ONLY_MODULES.has(module) ? ["VIEW"] : ACTIONS_ORDER;
  // Separa permissões padrão de especiais
  const standardPerms = visibleActions.map(a => actions[a]).filter(Boolean);
  const specialPerms  = SPECIAL_ACTIONS.map(a => actions[a]).filter(Boolean);

  return (
    <div style={{
      border: `1.5px solid ${border}`,
      background: bg,
      borderRadius: 14,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      minWidth: 160,
    }}>
      {/* Nome do grupo */}
      <Badge color={color} variant="light" radius="xl" size="md"
        style={{ alignSelf: "flex-start", fontWeight: 700, marginBottom: 4 }}>
        {GROUP_LABELS[groupType]}
      </Badge>

      {/* CRUD padrão — bloqueio geral (inclui recursos próprios) */}
      {visibleActions.map(action => {
        const perm = actions[action];
        if (!perm) return (
          <Text key={action} fz="xs" c="var(--text-secondary)" style={{ height: 24 }}>—</Text>
        );
        return (
          <Group key={action} gap="xs" align="center" wrap="nowrap">
            <Checkbox
              checked={perm.granted}
              onChange={() => onToggle(perm)}
              color={color} size="sm"
              styles={{ input: { cursor: "pointer" } }}
            />
            <Text fz="sm" c="var(--text-primary)" style={{ lineHeight: "20px" }}>
              {ACTION_LABELS[action] ?? action}
            </Text>
          </Group>
        );
      })}

      {/* Permissões especiais ISM — só afetam recursos de OUTRO ISM */}
      {specialPerms.length > 0 && (
        <>
          <Divider
            label={
              <Group gap={4}>
                <IconAlertTriangle size={11} color="#f97316" />
                <Text fz="10px" c="var(--text-secondary)">Permissões adicionais</Text>
              </Group>
            }
            labelPosition="left"
            my={2}
          />
          {specialPerms.map(perm => (
            <Stack key={perm.action} gap={4}>
              <Group gap="xs" align="flex-start" wrap="nowrap">
                <Checkbox
                  checked={perm.granted}
                  onChange={() => onToggle(perm)}
                  color={color} size="sm"
                  styles={{ input: { cursor: "pointer" }, root: { marginTop: 2 } }}
                />
                <Stack gap={2}>
                  <Group gap={4} wrap="nowrap">
                    <Text fz="sm" c="var(--text-primary)" style={{ lineHeight: "20px" }}>
                      {SPECIAL_ACTION_LABELS[perm.action] ?? perm.action}
                    </Text>
                    <IconAlertTriangle size={13} color="#f97316" style={{ flexShrink: 0, marginTop: 3 }} />
                  </Group>
                  {perm.description && (
                    <Text fz="10px" c="var(--text-secondary)" style={{ lineHeight: 1.4, maxWidth: 200 }}>
                      {perm.description}
                    </Text>
                  )}
                </Stack>
              </Group>
            </Stack>
          ))}
        </>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function AdminPermissions() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [allPerms, setAllPerms] = useState<PermissionDTO[]>([]);
  const [dirty, setDirty]       = useState<Record<number, boolean>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [msg, setMsg]           = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user?.role !== "ADMIN" && user?.role !== "GESTOR") { navigate("/403", { replace: true }); return; }
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
      setMsg({ type: "success", text: `"${MODULE_LABELS[module] ?? module}" salvo com sucesso.` });
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
          Todas as permissões iniciam <b>concedidas</b>. Desmarque o que não quer permitir e salve.
          Regras fixas de segurança (Auditoria, Permissões, chat ISM) não aparecem aqui.
        </Text>
      </Alert>

      <Paper p="24px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
        <Accordion multiple chevronPosition="left" variant="separated">
          {modules.map(module => {
            const groups     = moduleMap[module];
            const hasUnsaved = allPerms.some(p => p.module === module && dirty[p.id] !== undefined);

            return (
              <Accordion.Item key={module} value={module}
                style={{ border: "1px solid var(--border-color)", borderRadius: 12 }}>

                <Accordion.Control>
                  <Group justify="space-between" pr="md">
                    <Text fw={600} fz="md" c="var(--text-primary)">
                      {MODULE_LABELS[module] ?? module}
                    </Text>
                    {hasUnsaved && (
                      <Badge color="orange" variant="light" size="sm">não salvo</Badge>
                    )}
                  </Group>
                </Accordion.Control>

                <Accordion.Panel>
                  <Stack gap="16px">
                    {/* 1 card por grupo, lado a lado */}
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                      {GROUPS_ORDER.map(gt => (
                        <GroupCard
                          key={gt}
                          module={module}
                          groupType={gt}
                          actions={groups[gt] ?? {}}
                          onToggle={toggle}
                        />
                      ))}
                    </SimpleGrid>

                    <Group justify="flex-end" mt={4}>
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
