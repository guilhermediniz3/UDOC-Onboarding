import { useEffect, useState } from "react";

import {
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  useMantineColorScheme,
} from "@mantine/core";

import { IconPencil } from "@tabler/icons-react";

interface PromptDialogProps {
  open: boolean;

  title: string;

  message: string;

  placeholder?: string;

  initialValue?: string;

  confirmText?: string;

  cancelText?: string;

  loading?: boolean;

  onConfirm: (value: string) => void;

  onCancel: () => void;
}

export default function PromptDialog({
  open,
  title,
  message,
  placeholder = "",
  initialValue = "",
  confirmText = "Inserir",
  cancelText = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}: PromptDialogProps) {

  const { colorScheme } =
    useMantineColorScheme();

  const dark =
    colorScheme === "dark";

  const [value, setValue] =
    useState("");

  useEffect(() => {

    if (open) {
      setValue(initialValue ?? "");
    }

  }, [open, initialValue]);

  function handleConfirm() {

    const trimmedValue =
      value.trim();

    if (
      !trimmedValue ||
      loading
    ) {
      return;
    }

    onConfirm(trimmedValue);
  }

  function handleClose() {

    if (loading) {
      return;
    }

    setValue("");

    onCancel();
  }

  return (
    <Modal
      opened={open}

      onClose={handleClose}

      centered

      size="lg"

      radius="xl"

      padding="xl"

      closeOnClickOutside={!loading}

      closeOnEscape={!loading}

      withCloseButton={false}

      overlayProps={{
        blur: 6,

        backgroundOpacity: dark
          ? 0.55
          : 0.35,
      }}

      transitionProps={{
        transition: "fade-up",

        duration: 220,
      }}

      styles={{

        content: {

          background: dark
            ? "linear-gradient(180deg, #111827 0%, #0f172a 100%)"
            : "#ffffff",

          border: dark
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid #d1d5db",

          boxShadow: dark
            ? "0 25px 80px rgba(0,0,0,0.55)"
            : "0 25px 80px rgba(0,0,0,0.12)",
        },
      }}
    >

      <Stack gap="xl">

        <Group gap="md">

          <ThemeIcon
            size={52}

            radius="xl"

            variant="gradient"

            gradient={{
              from: "violet",
              to: "blue",
              deg: 135,
            }}
          >
            <IconPencil size={24} />
          </ThemeIcon>

          <div>

            <Text
              size="xl"

              fw={800}

              c={
                dark
                  ? "white"
                  : "dark"
              }
            >
              {title}
            </Text>

            <Text
              size="sm"

              c={
                dark
                  ? "dimmed"
                  : "gray.7"
              }

              mt={4}
            >
              {message}
            </Text>

          </div>

        </Group>

        <Paper
          radius="xl"

          p="md"

          bg={
            dark
              ? "rgba(255,255,255,0.03)"
              : "#f8fafc"
          }

          style={{

            border: dark
              ? "1px solid rgba(255,255,255,0.06)"
              : "1px solid #d1d5db",
          }}
        >

          <TextInput
            value={value}

            placeholder={placeholder}

            autoFocus

            size="lg"

            radius="lg"

            variant="filled"

            onChange={(e) =>
              setValue(
                e.currentTarget.value
              )
            }

            onKeyDown={(e) => {

              if (
                e.key === "Enter"
              ) {

                e.preventDefault();

                handleConfirm();
              }

              if (
                e.key === "Escape"
              ) {

                e.preventDefault();

                handleClose();
              }
            }}

            styles={{

              input: {

                background: dark
                  ? "#111827"
                  : "#ffffff",

                border: dark
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid #d1d5db",

                color: dark
                  ? "#ffffff"
                  : "#111827",

                fontSize: "16px",

                height: "54px",
              },
            }}
          />

        </Paper>

        <Group justify="flex-end">

          <Button
            variant="subtle"

            color="gray"

            radius="xl"

            size="md"

            onClick={() => {

              setValue("");

              handleClose();
            }}

            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
            radius="xl"

            size="md"

            variant="gradient"

            gradient={{
              from: "violet",
              to: "blue",
              deg: 135,
            }}

            onClick={handleConfirm}

            loading={loading}

            disabled={!value.trim()}
          >
            {confirmText}
          </Button>

        </Group>

      </Stack>

    </Modal>
  );
}