import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";

import {
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconFilter,
  IconX,
} from "@tabler/icons-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getCalendarSessions,
  type CalendarSession,
} from "../../services/trainingSessionService";

import { getAllCompaniesSimple } from "../../services/companyService";
import { getAllIsmsSimple } from "../../services/ismService";
import { getEmployees } from "../../services/employeeService";

import type { Company } from "../../types/Company";
import type { ISM } from "../../types/ISM";
import type { Employee } from "../../types/Employee";

/* ── constantes ── */

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const STATUS_COLOR: Record<string, string> = {
  AGENDADA: "blue",
  EM_ANDAMENTO: "orange",
  CONCLUIDA: "green",
  CANCELADA: "red",
};

const STATUS_LABEL: Record<string, string> = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

/* ── helpers ── */

function buildCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatTime(t: string): string {
  return t ? t.substring(0, 5) : "";
}

/* ── componente principal ── */

export default function TrainingCalendar() {

  const navigate = useNavigate();
  const now = new Date();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based

  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [loading, setLoading] = useState(false);

  /* filtros */
  const [ismFilter, setIsmFilter] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState<string | null>(null);

  /* opções de filtros */
  const [ismsOpts, setIsmsOpts] = useState<ISM[]>([]);
  const [companiesOpts, setCompaniesOpts] = useState<Company[]>([]);
  const [employeesOpts, setEmployeesOpts] = useState<Employee[]>([]);

  /* modal */
  const [selected, setSelected] = useState<CalendarSession | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  /* ── carga das opções de filtro ── */
  useEffect(() => {
    getAllIsmsSimple().then(setIsmsOpts);
    getAllCompaniesSimple().then(setCompaniesOpts);
    getEmployees({ size: 1000 }).then((r) => setEmployeesOpts(r.content));
  }, []);

  /* ── carga das sessões ── */
  useEffect(() => {
    setLoading(true);
    getCalendarSessions({
      month: month + 1, // API espera 1-based
      year,
      ismId: ismFilter ? Number(ismFilter) : null,
      companyId: companyFilter ? Number(companyFilter) : null,
      employeeId: employeeFilter ? Number(employeeFilter) : null,
    })
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [month, year, ismFilter, companyFilter, employeeFilter]);

  /* ── calendário ── */
  const calendarDays = useMemo(() => buildCalendarDays(year, month), [year, month]);

  function sessionsForDay(date: Date): CalendarSession[] {
    const key = isoDate(date);
    return sessions.filter((s) => s.date === key);
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  function clearFilters() {
    setIsmFilter(null); setCompanyFilter(null); setEmployeeFilter(null);
  }

  const hasFilter = ismFilter || companyFilter || employeeFilter;

  const inputStyles = {
    input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
  };

  /* ── render ── */
  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      {/* Modal de detalhe */}
      {selected && (
        <Modal
          opened={opened}
          onClose={close}
          centered
          radius="xl"
          size="md"
          title={
            <Group gap="sm">
              <Badge color={STATUS_COLOR[selected.trainingRoomStatus] || "gray"} radius="xl">
                {STATUS_LABEL[selected.trainingRoomStatus] || selected.trainingRoomStatus}
              </Badge>
              <Text fw={700} c="var(--text-primary)">{selected.trainingRoomTitle}</Text>
            </Group>
          }
        >
          <Stack gap="12px">
            <Group gap={6}>
              <Text fz="sm" c="var(--text-secondary)" w={120}>Data:</Text>
              <Text fz="sm" fw={600} c="var(--text-primary)">{selected.date}</Text>
            </Group>
            <Group gap={6}>
              <Text fz="sm" c="var(--text-secondary)" w={120}>Horário:</Text>
              <Text fz="sm" fw={600} c="var(--text-primary)">
                {formatTime(selected.startTime)} → {formatTime(selected.endTime)}
              </Text>
            </Group>
            {selected.ismName && (
              <Group gap={6}>
                <Text fz="sm" c="var(--text-secondary)" w={120}>ISM:</Text>
                <Text fz="sm" fw={600} c="var(--text-primary)">{selected.ismName}</Text>
              </Group>
            )}
            {selected.companyName && (
              <Group gap={6}>
                <Text fz="sm" c="var(--text-secondary)" w={120}>Empresa:</Text>
                <Text fz="sm" fw={600} c="var(--text-primary)">{selected.companyName}</Text>
              </Group>
            )}
            {selected.invitedEmployeeNames && selected.invitedEmployeeNames.length > 0 && (
              <Group gap={6} align="flex-start">
                <Text fz="sm" c="var(--text-secondary)" w={120}>Convidados:</Text>
                <Stack gap={4}>
                  {selected.invitedEmployeeNames.map((name) => (
                    <Badge key={name} variant="light" color="teal" radius="xl" size="sm">{name}</Badge>
                  ))}
                </Stack>
              </Group>
            )}
            <Group justify="flex-end" mt="sm">
              <Button
                leftSection={<IconExternalLink size={16} />}
                radius="xl" size="sm" variant="gradient"
                gradient={{ from: "violet", to: "blue" }}
                onClick={() => { close(); navigate(`/admin/training-room/${selected.trainingRoomId}`); }}
              >
                Abrir sala
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}

      {/* Header */}
      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} c="var(--text-primary)" fw={700}>Calendário de Treinamentos</Title>
            <Text c="var(--text-secondary)" mt={4}>Visualize todos os treinamentos agendados</Text>
          </div>
          {/* Navegação de mês */}
          <Group gap="sm">
            <ActionIcon variant="light" radius="xl" size="lg" onClick={prevMonth}>
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Text fw={700} c="var(--text-primary)" w={160} ta="center">
              {MONTHS[month]} {year}
            </Text>
            <ActionIcon variant="light" radius="xl" size="lg" onClick={nextMonth}>
              <IconChevronRight size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Paper>

      {/* Filtros */}
      <Paper px="24px" py="16px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 16px var(--shadow-color)" }}>
        <Group gap="md" wrap="wrap" align="flex-end">
          <Group gap={6} align="center">
            <IconFilter size={16} color="var(--text-secondary)" />
            <Text fz="sm" c="var(--text-secondary)">Filtros:</Text>
          </Group>
          <Select
            placeholder="ISM"
            clearable searchable
            radius="xl" size="sm"
            data={ismsOpts.map((i) => ({ value: String(i.id), label: i.name }))}
            value={ismFilter} onChange={setIsmFilter}
            styles={inputStyles}
            w={180}
          />
          <Select
            placeholder="Empresa"
            clearable searchable
            radius="xl" size="sm"
            data={companiesOpts.map((c) => ({ value: String(c.id), label: c.name }))}
            value={companyFilter} onChange={setCompanyFilter}
            styles={inputStyles}
            w={180}
          />
          <Select
            placeholder="Funcionário Externo"
            clearable searchable
            radius="xl" size="sm"
            data={employeesOpts.map((e) => ({ value: String(e.id), label: e.name }))}
            value={employeeFilter} onChange={setEmployeeFilter}
            styles={inputStyles}
            w={200}
          />
          {hasFilter && (
            <Button leftSection={<IconX size={14} />} variant="subtle" color="gray" radius="xl" size="sm"
              onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </Group>
      </Paper>

      {/* Calendário */}
      <Paper p="24px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>

        {/* Legenda de status */}
        <Group gap="md" mb="xl">
          {Object.entries(STATUS_LABEL).map(([status, label]) => (
            <Group key={status} gap={6}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: `var(--mantine-color-${STATUS_COLOR[status]}-6)` }} />
              <Text fz="xs" c="var(--text-secondary)">{label}</Text>
            </Group>
          ))}
        </Group>

        {/* Grid de dias da semana */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: 1 }}>
          {WEEKDAYS.map((d) => (
            <div key={d} style={{ padding: "8px 4px", textAlign: "center", background: "var(--app-bg)" }}>
              <Text fz="xs" fw={700} c="var(--text-secondary)" tt="uppercase">{d}</Text>
            </div>
          ))}
        </div>

        {/* Grid de células */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
          {calendarDays.map((date, idx) => {
            const daySessions = date ? sessionsForDay(date) : [];
            const isToday = date ? isoDate(date) === isoDate(now) : false;

            return (
              <div
                key={idx}
                style={{
                  minHeight: 100,
                  background: isToday ? "rgba(139,92,246,0.06)" : "var(--app-bg)",
                  border: isToday ? "1px solid rgba(139,92,246,0.3)" : "1px solid var(--border-color)",
                  borderRadius: 8,
                  padding: "6px 4px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                {date && (
                  <>
                    <Text
                      fz="sm" fw={isToday ? 800 : 500}
                      c={isToday ? "violet" : "var(--text-primary)"}
                      mb={2}
                      style={{ lineHeight: 1 }}
                    >
                      {date.getDate()}
                    </Text>
                    {daySessions.slice(0, 3).map((s) => (
                      <Tooltip
                        key={s.sessionId}
                        label={`${s.trainingRoomTitle} — ${formatTime(s.startTime)} às ${formatTime(s.endTime)}`}
                        position="top"
                        withArrow
                      >
                        <Badge
                          color={STATUS_COLOR[s.trainingRoomStatus] || "gray"}
                          radius="xl"
                          size="xs"
                          variant="light"
                          style={{ cursor: "pointer", maxWidth: "100%", overflow: "hidden" }}
                          onClick={() => { setSelected(s); open(); }}
                        >
                          {s.companyName || s.ismName || s.trainingRoomTitle}
                        </Badge>
                      </Tooltip>
                    ))}
                    {daySessions.length > 3 && (
                      <Text fz="xs" c="var(--text-secondary)">+{daySessions.length - 3} mais</Text>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {loading && (
          <Text ta="center" c="var(--text-secondary)" mt="xl">Carregando...</Text>
        )}

        {!loading && sessions.length === 0 && (
          <Text ta="center" c="var(--text-secondary)" mt="xl">
            Nenhum treinamento agendado para {MONTHS[month]} {year}.
          </Text>
        )}

      </Paper>

    </Stack>
  );
}
