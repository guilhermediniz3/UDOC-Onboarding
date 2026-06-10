import {
  ActionIcon,
  Group,
  NavLink,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";

import { useMediaQuery } from "@mantine/hooks";

import {
  IconBriefcase,
  IconBuilding,
  IconBook2,
  IconBookmark,
  IconCertificate,
  IconChartBar,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconFileText,
  IconLayoutKanban,
  IconListDetails,
  IconLogout,
  IconRoute,
  IconSchool,
  IconKey,
  IconSettings,
  IconShieldCheck,
  IconTrophy,
  IconUserCog,
  IconUsers,
} from "@tabler/icons-react";

import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { usePermission } from "../../contexts/PermissionContext";
import SidebarXpWidget from "../SidebarXpWidget/SidebarXpWidget";

import "./index.css";

interface NavChild {
  label: string;
  path: string;
  Icon: React.ComponentType<{ size?: string | number }>;
  isActive: (pathname: string) => boolean;
  adminOnly?: boolean;
}

interface NavItemType {
  label: string;
  Icon: React.ComponentType<{ size?: string | number }>;
  path?: string;
  collapsedPath?: string;
  isActive: (pathname: string) => boolean;
  children?: NavChild[];
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItemType[] = [
  {
    label: "Cadastro",
    Icon: IconFileText,
    collapsedPath: "/admin/cards",
    isActive: (p) =>
      p.startsWith("/admin/card") ||
      p === "/" ||
      p.startsWith("/admin/company") ||
      p.startsWith("/admin/employee") ||
      p.startsWith("/admin/ism") ||
      p.startsWith("/admin/user") ||
      p === "/admin/certificate-template",
    children: [
      {
        label: "Cadastro de Documentos",
        path: "/admin/cards",
        Icon: IconListDetails,
        isActive: (p) => p.startsWith("/admin/card"),
      },
      {
        label: "Documentos",
        path: "/",
        Icon: IconEye,
        isActive: (p) => p === "/",
      },
      {
        label: "Empresa",
        path: "/admin/companies",
        Icon: IconBuilding,
        isActive: (p) => p.startsWith("/admin/company"),
      },
      {
        label: "Funcionário",
        path: "/admin/employees",
        Icon: IconUsers,
        isActive: (p) => p.startsWith("/admin/employee"),
      },
      {
        label: "ISM",
        path: "/admin/ismsAdmin",
        Icon: IconBriefcase,
        isActive: (p) => p.startsWith("/admin/ism"),
      },
      {
        label: "Usuários",
        path: "/admin/users",
        Icon: IconUserCog,
        isActive: (p) => p.startsWith("/admin/user"),
      },
      {
        label: "Template Certificado",
        path: "/admin/certificate-template",
        Icon: IconCertificate,
        isActive: (p) => p === "/admin/certificate-template",
        adminOnly: true,
      },
    ],
  },
  {
    label: "Trilha",
    Icon: IconRoute,
    collapsedPath: "/admin/trails",
    isActive: (p) => p.startsWith("/admin/trail"),
    children: [
      {
        label: "Trilha",
        path: "/admin/trails",
        Icon: IconListDetails,
        isActive: (p) =>
          p === "/admin/trails" ||
          (p.startsWith("/admin/trail") && !p.includes("kanban")),
      },
      {
        label: "Gestão de Trilhas",
        path: "/admin/trails/kanban",
        Icon: IconLayoutKanban,
        isActive: (p) => p === "/admin/trails/kanban",
      },
    ],
  },
  {
    label: "Sala de Treinamento",
    Icon: IconSchool,
    collapsedPath: "/admin/training-rooms",
    isActive: (p) =>
      p.startsWith("/admin/training-room") ||
      p === "/admin/training-calendar",
    children: [
      {
        label: "Salas",
        path: "/admin/training-rooms",
        Icon: IconListDetails,
        isActive: (p) => p.startsWith("/admin/training-room") && !p.includes("calendar"),
      },
      {
        label: "Calendário",
        path: "/admin/training-calendar",
        Icon: IconLayoutKanban,
        isActive: (p) => p === "/admin/training-calendar",
      },
    ],
  },
  {
    label: "Matrícula",
    Icon: IconBook2,
    path: "/catalogo",
    isActive: (p) => p === "/catalogo",
    // Visível para todos os perfis — sem adminOnly e sem módulo de filtro extra
    // (módulo MATRICULA VIEW controla a visibilidade via can())
  },
  {
    label: "Minhas Trilhas",
    Icon: IconBookmark,
    path: "/minhas-trilhas",
    isActive: (p) => p.startsWith("/minhas-trilhas"),
  },
  {
    label: "Meus Certificados",
    Icon: IconCertificate,
    path: "/meus-certificados",
    isActive: (p) => p.startsWith("/meus-certificados"),
  },
  {
    label: "Dashboard",
    Icon: IconChartBar,
    path: "/dashboard",
    isActive: (p) => p === "/dashboard",
  },
  {
    label: "Ranking",
    Icon: IconTrophy,
    path: "/ranking",
    isActive: (p) => p === "/ranking",
  },
  {
    label: "Configurações",
    Icon: IconSettings,
    path: "/admin/settings",
    isActive: (p) => p === "/admin/settings",
    adminOnly: true,
  },
  {
    label: "Permissões",
    Icon: IconKey,
    path: "/admin/permissions",
    isActive: (p) => p === "/admin/permissions",
    adminOnly: true,
  },
  {
    label: "Auditoria",
    Icon: IconShieldCheck,
    path: "/admin/auditoria",
    isActive: (p) => p.startsWith("/admin/auditoria"),
    adminOnly: true,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { can } = usePermission();
  const isMobile = useMediaQuery("(max-width: 48em)");
  const isCollapsed = collapsed && !isMobile;

  // Mapeamento item de menu → módulo de permissão (VIEW)
  // Itens sem módulo mapeado = sempre visíveis (ex: Dashboard, Configurações, Auditoria)
  const MODULE_FOR_ITEM: Record<string, string> = {
    // Cadastro (filhos)
    "Cadastro de Documentos": "CADASTRO_DOCUMENTO",
    "Documentos":             "DOCUMENTO",
    "Empresa":                "EMPRESA",
    "Funcionário":            "FUNCIONARIO",
    "ISM":                    "ISM",
    "Usuários":               "USUARIO",
    // Template Certificado: adminOnly no NavChild, não precisa de módulo

    // Trilha (filhos e item autônomo)
    "Trilha":                 "TRILHA",
    "Gestão de Trilhas":      "TRILHA",

    // Sala de Treinamento (filhos)
    "Salas":                  "SALA",
    "Calendário":             "SALA",

    // Itens autônomos
    "Matrícula":              "MATRICULA",
    "Dashboard":              "DASHBOARD",
    "Minhas Trilhas":         "TRILHA",
    "Meus Certificados":      "TRILHA",

    // Admin-only (controlado por adminOnly: true, não por módulo)
    "Ranking":                "RANKING",
  };

  return (

    <Stack gap={4} py="md" className="sidebar" style={{ height: "100%", justifyContent: "space-between" }}>

      <Stack gap={4}>

        <Group
          justify={isCollapsed ? "center" : "space-between"}
          px="md"
          mb="xs"
        >
          {!isCollapsed && (
            <Text fw={700} fz="xs" c="dimmed" tt="uppercase">
              Menu
            </Text>
          )}
          <ActionIcon
            variant="subtle" radius="xl" size="sm" color="gray"
            onClick={onToggle} visibleFrom="sm"
          >
            {isCollapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
          </ActionIcon>
        </Group>

        {NAV_ITEMS.filter((item) => {
          if (item.adminOnly && user?.role !== "ADMIN" && user?.role !== "GESTOR") return false;
          // Oculta item se permissão VIEW foi revogada para este grupo
          const mod = MODULE_FOR_ITEM[item.label];
          if (mod && !can(mod, "VIEW")) return false;
          return true;
        }).map((item) => {
          const itemIsActive = item.isActive(pathname);

          if (isCollapsed) {
            const targetPath = item.collapsedPath ?? item.path ?? "/";
            return (
              <Tooltip key={item.label} label={item.label} position="right" withArrow>
                <ActionIcon
                  size={40} radius="md"
                  variant={itemIsActive ? "light" : "subtle"}
                  color={itemIsActive ? "violet" : "gray"}
                  onClick={() => navigate(targetPath)}
                  mx="auto"
                >
                  <item.Icon size={20} />
                </ActionIcon>
              </Tooltip>
            );
          }

          if (item.children) {
            const visibleChildren = item.children.filter(child => {
              // Filho com adminOnly: oculto para não-ADMIN
              if (child.adminOnly && user?.role !== "ADMIN" && user?.role !== "GESTOR") return false;
              // Filho com módulo mapeado: verifica permissão VIEW
              const mod = MODULE_FOR_ITEM[child.label];
              return !mod || can(mod, "VIEW");
            });
            if (visibleChildren.length === 0) return null;
            return (
              <NavLink
                key={item.label}
                label={item.label}
                leftSection={<item.Icon size={18} />}
                active={itemIsActive}
                defaultOpened={itemIsActive}
                className="sidebar-navlink"
              >
                {visibleChildren.map((child) => (
                  <NavLink
                    key={child.label}
                    label={child.label}
                    leftSection={<child.Icon size={16} />}
                    active={child.isActive(pathname)}
                    onClick={() => navigate(child.path)}
                    className="sidebar-navlink sidebar-child"
                  />
                ))}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.label}
              label={item.label}
              leftSection={<item.Icon size={18} />}
              active={itemIsActive}
              onClick={() => item.path && navigate(item.path)}
              className="sidebar-navlink"
            />
          );
        })}

      </Stack>

      {/* Rodapé: XP + usuário + logout */}
      {!isCollapsed ? (
        <Stack px="md" pb="md" gap={4}>
          <SidebarXpWidget collapsed={false} />
          <Text fz="xs" c="dimmed" truncate>{user?.name}</Text>
          <Text fz="xs" c="dimmed" truncate>{user?.role}</Text>
          <NavLink
            label="Sair"
            leftSection={<IconLogout size={16} />}
            onClick={logout}
            className="sidebar-navlink"
            color="red"
          />
        </Stack>
      ) : (
        <Stack align="center" pb="md" gap={4}>
          <SidebarXpWidget collapsed={true} />
          <Tooltip label="Sair" position="right" withArrow>
            <ActionIcon
              size={40} radius="md" variant="subtle" color="red"
              onClick={logout}
            >
              <IconLogout size={20} />
            </ActionIcon>
          </Tooltip>
        </Stack>
      )}

    </Stack>
  );
}
