import { Box, Paper, Progress, Text, Tooltip } from "@mantine/core";
import { useEffect, useState } from "react";
import type { XpSummary } from "../../services/xpService";
import { getMyXp } from "../../services/xpService";

interface Props { collapsed?: boolean; }

export default function SidebarXpWidget({ collapsed = false }: Props) {
  const [xp, setXp] = useState<XpSummary | null>(null);

  useEffect(() => {
    getMyXp().then(setXp).catch(() => {});
  }, []);

  if (!xp) return null;

  const tooltipLabel = `${xp.levelIcon} ${xp.levelName} • ${xp.totalXp} XP`;

  if (collapsed) {
    return (
      <Tooltip label={tooltipLabel} position="right" withArrow>
        <Text ta="center" fz="lg" style={{ cursor: "default" }} mb={4}>
          {xp.levelIcon}
        </Text>
      </Tooltip>
    );
  }

  return (
    <Paper
      p="xs" radius="md" mb={4}
      style={{ background: "var(--app-bg)", border: "1px solid var(--border-color)" }}
    >
      <Box>
        <Text fz="xs" fw={600} c="var(--mantine-color-violet-4)">
          {xp.levelIcon} {xp.levelName}
        </Text>
        <Text fz="10px" c="var(--text-secondary)">
          {xp.totalXp} XP
          {xp.xpNextLevel > xp.xpCurrentLevel
            ? ` / ${xp.xpNextLevel} para próximo nível`
            : " — Expert máximo!"}
        </Text>
        <Progress
          value={xp.progressPct} size="xs" radius="xs" mt={4}
          color={xp.level >= 5 ? "yellow" : "violet"}
        />
      </Box>
    </Paper>
  );
}
