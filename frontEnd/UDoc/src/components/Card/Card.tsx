import {
  Card as MantineCard,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Box,
  useMantineColorScheme,
} from "@mantine/core";

import * as FaIcons from "react-icons/fa";
import * as ImIcons from "react-icons/im";
import * as MdIcons from "react-icons/md";
import * as AiIcons from "react-icons/ai";
import * as BsIcons from "react-icons/bs";
import * as FiIcons from "react-icons/fi";
import * as HiIcons from "react-icons/hi";
import * as RiIcons from "react-icons/ri";
import * as TbIcons from "react-icons/tb";

interface CardProps {
  title: string;

  description: string;

  icon?: string | null;
}

const icons = {
  ...FaIcons,
  ...ImIcons,
  ...MdIcons,
  ...AiIcons,
  ...BsIcons,
  ...FiIcons,
  ...HiIcons,
  ...RiIcons,
  ...TbIcons,
};

export default function Card({
  title,
  description,
  icon,
}: CardProps) {

  const { colorScheme } =
    useMantineColorScheme();

  const isDark =
    colorScheme === "dark";

  const iconName =
    icon?.trim() || "";

  const IconComponent =
    iconName &&
    icons[
      iconName as keyof typeof icons
    ]
      ? icons[
          iconName as keyof typeof icons
        ]
      : FaIcons.FaRegFileAlt;

  function handleMouseMove(
    e: React.MouseEvent<HTMLDivElement>
  ) {

    const card =
      e.currentTarget;

    const rect =
      card.getBoundingClientRect();

    const x =
      e.clientX - rect.left;

    const y =
      e.clientY - rect.top;

    const centerX =
      rect.width / 2;

    const centerY =
      rect.height / 2;

    const rotateX =
      ((y - centerY) / 28) * -1;

    const rotateY =
      (x - centerX) / 28;

    card.style.transform = `
      perspective(1200px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      translateY(-6px)
      scale(1.015)
    `;
  }

  function handleMouseLeave(
    e: React.MouseEvent<HTMLDivElement>
  ) {

    e.currentTarget.style.transform = `
      perspective(1200px)
      rotateX(0deg)
      rotateY(0deg)
      translateY(0px)
      scale(1)
    `;
  }

  return (

    <MantineCard
      radius={24}
      padding="md"
      withBorder
      onMouseMove={
        handleMouseMove
      }
      onMouseLeave={
        handleMouseLeave
      }
      style={{

        position: "relative",

        overflow: "hidden",

        height: 190,

        display: "flex",

        flexDirection: "column",

        justifyContent:
          "space-between",

        background: isDark
          ? "rgba(255,255,255,0.018)"
          : "rgba(255,255,255,0.92)",

        backdropFilter:
          "blur(18px)",

        WebkitBackdropFilter:
          "blur(18px)",

        border: isDark
          ? "1px solid rgba(255,255,255,0.04)"
          : "1px solid rgba(0,0,0,0.06)",

        transition:
          "all 0.28s cubic-bezier(0.22, 1, 0.36, 1)",

        cursor: "pointer",

        transformStyle:
          "preserve-3d",

        willChange:
          "transform",

        boxShadow: isDark

          ? `
            0 10px 25px rgba(0,0,0,0.18),
            inset 0 1px 0 rgba(255,255,255,0.03)
          `

          : `
            0 10px 25px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,0.7)
          `,
      }}

      styles={{
        root: {
          ":hover": {

            background: isDark
              ? "rgba(255,255,255,0.03)"
              : "rgba(255,255,255,1)",

            border:
              "1px solid rgba(139,92,246,0.18)",

            boxShadow:
              `
              0 18px 45px rgba(0,0,0,0.16),
              0 0 30px rgba(139,92,246,0.10)
            `,
          },
        },
      }}
    >

      <div
        style={{

          position: "absolute",

          top: -120,

          right: -120,

          width: 220,

          height: 220,

          borderRadius: "50%",

          background:
            "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0) 72%)",

          filter: "blur(18px)",

          pointerEvents: "none",
        }}
      />

      <div
        style={{

          position: "absolute",

          inset: 0,

          background:
            "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.025) 50%, transparent 80%)",

          opacity: 0.6,

          pointerEvents:
            "none",
        }}
      />

      <Stack
        justify="space-between"
        h="100%"
      >

        <Group justify="space-between">

          <ThemeIcon
            size={54}
            radius={18}
            variant="gradient"
            gradient={{
              from: "violet",
              to: "blue",
              deg: 135,
            }}
          >

            <IconComponent size={24} />

          </ThemeIcon>

        </Group>

        <Box>

          <Text
            fw={700}
            size="lg"
            mb={6}
            style={{
              color:
                "var(--mantine-color-text)",
            }}
          >
            {title}
          </Text>

          <Text
            size="sm"
            lineClamp={3}
            style={{
              color:
                "var(--mantine-color-dimmed)",
            }}
          >
            {description}
          </Text>

        </Box>

      </Stack>

    </MantineCard>
  );
}