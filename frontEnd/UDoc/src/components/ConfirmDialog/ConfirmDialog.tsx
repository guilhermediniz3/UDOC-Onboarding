import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";

import { IconAlertTriangle } from "@tabler/icons-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      opened={open}
      onClose={onCancel}
      centered
      size="md"
      radius="2xl"
      padding="xl"
      withCloseButton={false}
      closeOnEscape={!loading}
      closeOnClickOutside={!loading}
      overlayProps={{
        blur: 7,
        backgroundOpacity: 0.55,
      }}
      transitionProps={{
        transition: "fade-up",
        duration: 220,
      }}
      styles={{
        content: {
          background:
            "linear-gradient(180deg, #111827 0%, #0f172a 100%)",

          border:
            "1px solid rgba(255,255,255,0.08)",

          boxShadow:
            "0 25px 80px rgba(0,0,0,0.55)",
        },
      }}
    >
      <Stack gap="xl">
        {/* HEADER */}
        <Group gap="md">
          <ThemeIcon
            size={56}
            radius="xl"
            variant="gradient"
            gradient={{
              from: "red",
              to: "orange",
              deg: 135,
            }}
            style={{
              boxShadow:
                "0 10px 30px rgba(239,68,68,0.35)",
            }}
          >
            <IconAlertTriangle size={28} />
          </ThemeIcon>

          <div>
            <Text
              size="xl"
              fw={800}
              c="white"
            >
              {title}
            </Text>

            <Text
              size="sm"
              c="dimmed"
              mt={4}
            >
              {message}
            </Text>
          </div>
        </Group>

        {/* ACTIONS */}
        <Group justify="flex-end">
          <Button
            variant="subtle"
            color="gray"
            radius="xl"
            size="md"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            radius="xl"
            size="md"
            color="red"
            variant="gradient"
            gradient={{
              from: "red",
              to: "orange",
              deg: 135,
            }}
            onClick={onConfirm}
            loading={loading}
          >
            {loading
              ? "Removendo..."
              : "Remover"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}