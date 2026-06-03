import "./index.css";

import { ActionIcon, Avatar, Burger, Group, Text } from "@mantine/core";
import { IconMoon, IconSun, IconUser } from "@tabler/icons-react";
import { useAuth } from "../../contexts/AuthContext";
import NotificationBell from "../NotificationBell/NotificationBell";

interface HeaderProps {
  colorScheme: "light" | "dark";
  toggleTheme: () => void;
  opened: boolean;
  toggle: () => void;
}

function Header({ colorScheme, toggleTheme, opened, toggle }: HeaderProps) {

  const dark = colorScheme === "dark";
  const { user } = useAuth();

  return (

    <header className="header">

      <Group gap="sm" align="center">
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
        <h1>UDoc</h1>
      </Group>

      <Group gap="md" align="center">

        {user && (
          <Group gap="sm" align="center" visibleFrom="sm">
            <Avatar
              src={user.photo || null}
              radius="xl"
              size={38}
              style={{ border: "2px solid rgba(139,92,246,0.6)", flexShrink: 0 }}
            >
              {!user.photo && <IconUser size={20} />}
            </Avatar>
            <Text fz="sm" fw={500} c="white" style={{ whiteSpace: "nowrap" }}>
              Bem-vindo, {user.name?.split(" ")[0] ?? user.email}!
            </Text>
          </Group>
        )}

        {user && <NotificationBell />}

        <ActionIcon variant="light" radius="xl" size="lg" onClick={toggleTheme}>
          {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
        </ActionIcon>

      </Group>

    </header>
  );
}

export default Header;
