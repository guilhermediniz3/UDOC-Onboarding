import {
  ActionIcon, Box, Button, Divider, Group, Indicator,
  Popover, ScrollArea, Stack, Text,
} from "@mantine/core";
import {
  IconBell, IconBook, IconCheck, IconRoute,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { NotificationItem } from "../../services/notificationService";
import {
  getNotifications, getUnreadCount,
  markAllAsRead, markAsRead,
} from "../../services/notificationService";

const TYPE_ICON: Record<string, React.ReactNode> = {
  CARD_CREATED:  <IconBook   size={16} color="#7c3aed" />,
  CARD_UPDATED:  <IconBook   size={16} color="#2563eb" />,
  TRAIL_CREATED: <IconRoute  size={16} color="#059669" />,
  TRAIL_UPDATED: <IconRoute  size={16} color="#d97706" />,
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [opened, setOpened]       = useState(false);
  const [unread, setUnread]       = useState(0);
  const [items, setItems]         = useState<NotificationItem[]>([]);
  const [loading, setLoading]     = useState(false);

  // Polling do badge a cada 30 s
  useEffect(() => {
    const fetch = () => getUnreadCount().then(setUnread).catch(() => {});
    fetch();
    const t = setInterval(fetch, 30_000);
    return () => clearInterval(t);
  }, []);

  async function onOpen(open: boolean) {
    setOpened(open);
    if (open) {
      setLoading(true);
      try {
        const r = await getNotifications(0, 30);
        setItems(r.content);
        setUnread(r.content.filter(n => !n.read).length);
      } catch {} finally { setLoading(false); }
    }
  }

  async function handleClick(n: NotificationItem) {
    if (!n.read) {
      await markAsRead(n.id).catch(() => {});
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      setUnread(u => Math.max(0, u - 1));
    }
    setOpened(false);
    if (n.referenceType === "CARD" && n.referenceId)  navigate(`/view/card/${n.referenceId}`);
    if (n.referenceType === "TRAIL" && n.referenceId) navigate(`/minhas-trilhas/${n.referenceId}`);
  }

  async function handleMarkAll() {
    await markAllAsRead().catch(() => {});
    setItems(prev => prev.map(x => ({ ...x, read: true })));
    setUnread(0);
  }

  return (
    <Popover
      width={340} position="bottom-end" shadow="md"
      opened={opened} onChange={onOpen} withArrow
    >
      <Popover.Target>
        <Indicator
          label={unread > 99 ? "99+" : unread}
          size={16} color="red"
          disabled={unread === 0}
          processing={unread > 0}
        >
          <ActionIcon
            variant="subtle" color="gray" radius="xl" size="lg"
            onClick={() => onOpen(!opened)}
          >
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p={0} style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)" }}>
        <Group px="md" py="sm" justify="space-between"
          style={{ borderBottom: "1px solid var(--border-color)" }}>
          <Text fw={700} fz="sm" c="var(--text-primary)">Notificações</Text>
          {items.some(n => !n.read) && (
            <Button size="compact-xs" variant="subtle" color="violet"
              leftSection={<IconCheck size={12} />} onClick={handleMarkAll}>
              Marcar todas
            </Button>
          )}
        </Group>

        <ScrollArea h={360} scrollbarSize={4}>
          {loading ? (
            <Text ta="center" c="var(--text-secondary)" fz="xs" py="xl">Carregando...</Text>
          ) : items.length === 0 ? (
            <Text ta="center" c="var(--text-secondary)" fz="xs" py="xl">Nenhuma notificação</Text>
          ) : (
            <Stack gap={0}>
              {items.map((n, i) => (
                <Box key={n.id}>
                  <Box
                    px="md" py="sm"
                    onClick={() => handleClick(n)}
                    style={{
                      cursor: "pointer",
                      background: n.read ? "transparent" : "rgba(124,58,237,0.06)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--app-bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = n.read ? "transparent" : "rgba(124,58,237,0.06)")}
                  >
                    <Group gap="sm" wrap="nowrap" align="flex-start">
                      <Box mt={2}>{TYPE_ICON[n.type] ?? <IconBell size={16} />}</Box>
                      <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text fz="xs" fw={n.read ? 400 : 600} c="var(--text-primary)" truncate>
                          {n.title}
                        </Text>
                        <Text fz="10px" c="var(--text-secondary)">
                          {new Date(n.createdAt).toLocaleString("pt-BR")}
                        </Text>
                      </Stack>
                      {!n.read && (
                        <Box style={{ width: 7, height: 7, borderRadius: "50%", background: "#7c3aed", flexShrink: 0, marginTop: 5 }} />
                      )}
                    </Group>
                  </Box>
                  {i < items.length - 1 && <Divider />}
                </Box>
              ))}
            </Stack>
          )}
        </ScrollArea>
      </Popover.Dropdown>
    </Popover>
  );
}
