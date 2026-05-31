import { useEffect, useState } from "react";

import {
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";

import { IconPencil } from "@tabler/icons-react";

import { HexColorPicker } from "react-colorful";

interface PromptBadgeProps {
  open: boolean;
  title: string;
  message: string;
  placeholder?: string;
  initialValue?: string;
  initialColor?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: (
    value: string,
    color: string
  ) => void;
  onCancel: () => void;
}

export default function PromptBadge({
  open,
  title,
  message,
  placeholder = "",
  initialValue = "1",
  initialColor = "#2563eb",
  confirmText = "Inserir",
  cancelText = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}: PromptBadgeProps) {

  const [value, setValue] =
    useState("");

  const [color, setColor] =
    useState(initialColor);

  useEffect(() => {

    if (open) {

      setValue(
        initialValue ?? ""
      );

      setColor(
        initialColor ?? "#2563eb"
      );
    }

    else {

      setValue("");

      setColor("#2563eb");
    }

  }, [
    open,
    initialValue,
    initialColor,
  ]);

  function handleConfirm() {

    const trimmedValue =
      value.trim();

    if (
      !trimmedValue ||
      loading
    ) {
      return;
    }

    onConfirm(
      trimmedValue,
      color
    );
  }

  function handleCancel() {

    setValue("");

    setColor(
      initialColor ?? "#2563eb"
    );

    onCancel();
  }

  return (

    <Modal
      opened={open}

      onClose={handleCancel}

      title={

        <Group gap="xs">

          <IconPencil size={18} />

          <Text fw={700}>
            {title}
          </Text>

        </Group>
      }

      centered

      size="md"

      closeOnClickOutside={!loading}

      closeOnEscape={!loading}

      withCloseButton
    >

      <Stack>

        <Text size="sm">
          {message}
        </Text>

        <TextInput
          value={value}

          placeholder={placeholder}

          onChange={(e) =>
            setValue(
              e.currentTarget.value
            )
          }

          autoFocus

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

              handleCancel();
            }
          }}
        />

        <Stack gap="sm">

          <Text fw={600}>
            Cor do badge
          </Text>

          <HexColorPicker
            color={color}
            onChange={setColor}
          />

          <TextInput
            value={color}

            onChange={(e) =>
              setColor(
                e.currentTarget.value
              )
            }
          />

        </Stack>

        <Group>

          <Text fw={600}>
            Pré-visualização:
          </Text>

          <Badge
            size="xl"

            radius="xl"

            color={undefined}

            style={{
              backgroundColor:
                color,

              color: "#fff",
            }}
          >
            {value.trim() || "1"}
          </Badge>

        </Group>

        <Group
          justify="flex-end"
          mt="md"
        >

          <Button
            variant="default"

            onClick={handleCancel}

            disabled={loading}
          >
            {cancelText}
          </Button>

          <Button
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