import {
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";

import {
  IconAward,
  IconCalendar,
  IconCertificate,
  IconClock,
  IconStar,
} from "@tabler/icons-react";

import { useEffect, useState } from "react";

import {
  getMyCertificates,
  type CertificateInfo,
} from "../../services/trailLearnerService";

import CertificatePreview from "../../components/Quiz/CertificatePreview";
import { formatSeconds } from "../../hooks/useTrailTimer";

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── Card de certificado na grade ─────────────────────────────────────────────
function CertCard({
  cert,
  onClick,
}: {
  cert: CertificateInfo;
  onClick: () => void;
}) {
  return (
    <Paper
      p="24px"
      radius="20px"
      onClick={onClick}
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border-color)",
        boxShadow: "0 4px 20px var(--shadow-color)",
        cursor: "pointer",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 12px 32px var(--shadow-color)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 4px 20px var(--shadow-color)";
      }}
    >
      <Stack align="center" gap="16px">
        {/* Ícone de medalha */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(245,158,11,0.4)",
            flexShrink: 0,
          }}
        >
          <IconAward size={36} color="white" />
        </div>

        {/* Nome da trilha */}
        <Stack align="center" gap="4px">
          <Text
            fw={700}
            fz="md"
            c="var(--text-primary)"
            ta="center"
            lineClamp={2}
          >
            {cert.trailName}
          </Text>
          {cert.companyName && (
            <Text fz="xs" c="var(--text-secondary)" ta="center">
              {cert.companyName}
            </Text>
          )}
        </Stack>

        {/* Badges de info */}
        <Stack gap="6px" w="100%">
          {cert.notaObtida !== undefined && cert.notaObtida !== null && (
            <Group gap="6px" justify="center">
              <IconStar size={13} color="#f59e0b" />
              <Text fz="xs" c="var(--text-secondary)">
                Nota:{" "}
                <b style={{ color: "var(--text-primary)" }}>
                  {Math.round(cert.notaObtida)}%
                </b>
              </Text>
            </Group>
          )}
          {cert.concluidoEm && (
            <Group gap="6px" justify="center">
              <IconCalendar size={13} color="var(--text-secondary)" />
              <Text fz="xs" c="var(--text-secondary)">
                {formatDate(cert.concluidoEm)}
              </Text>
            </Group>
          )}
          {cert.tempoTotalSegundos > 0 && (
            <Group gap="6px" justify="center">
              <IconClock size={13} color="var(--text-secondary)" />
              <Text fz="xs" c="var(--text-secondary)">
                {formatSeconds(cert.tempoTotalSegundos)}
              </Text>
            </Group>
          )}
        </Stack>

        <Button
          size="xs"
          radius="xl"
          variant="light"
          color="violet"
          leftSection={<IconCertificate size={13} />}
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Ver certificado
        </Button>
      </Stack>
    </Paper>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MeusCertificados() {
  const [certs, setCerts] = useState<CertificateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CertificateInfo | null>(null);

  useEffect(() => {
    getMyCertificates()
      .then(setCerts)
      .catch(() => setCerts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">
      {/* Cabeçalho */}
      <Paper
        p="30px"
        radius="24px"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 10px 30px var(--shadow-color)",
        }}
      >
        <Group gap="sm">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconAward size={26} color="white" />
          </div>
          <div>
            <Title order={2} c="var(--text-primary)">
              Meus Certificados
            </Title>
            <Text c="var(--text-secondary)" mt={2}>
              Certificados obtidos ao concluir trilhas com aprovação no quiz
            </Text>
          </div>
          {!loading && certs.length > 0 && (
            <Badge
              variant="light"
              color="amber"
              radius="xl"
              size="lg"
              ml="auto"
            >
              {certs.length}{" "}
              {certs.length === 1 ? "certificado" : "certificados"}
            </Badge>
          )}
        </Group>
      </Paper>

      {/* Conteúdo */}
      {loading ? (
        <Center py="80px">
          <Loader size="lg" />
        </Center>
      ) : certs.length === 0 ? (
        <Paper
          p="60px"
          radius="24px"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
          }}
        >
          <Stack align="center" gap="16px">
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: "rgba(245,158,11,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconAward size={48} color="#f59e0b" />
            </div>
            <Title order={3} c="var(--text-primary)">
              Nenhum certificado ainda
            </Title>
            <Text c="var(--text-secondary)" ta="center" maw={420}>
              Conclua trilhas e seja aprovado no quiz de certificação para
              receber seus certificados aqui.
            </Text>
          </Stack>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
          {certs.map((cert) => (
            <CertCard
              key={cert.trailId}
              cert={cert}
              onClick={() => setSelected(cert)}
            />
          ))}
        </SimpleGrid>
      )}

      {/* Modal com o certificado completo */}
      <Modal
        opened={selected !== null}
        onClose={() => setSelected(null)}
        size="90%"
        radius="24px"
        title={
          <Group gap="sm">
            <IconCertificate size={20} color="#7c3aed" />
            <Text fw={700} c="var(--text-primary)">
              {selected?.trailName}
            </Text>
          </Group>
        }
        styles={{
          header: {
            background: "var(--card-bg)",
            borderBottom: "1px solid var(--border-color)",
          },
          body: { background: "var(--card-bg)", padding: "24px" },
          content: { background: "var(--card-bg)" },
        }}
      >
        {selected && (
          <Tooltip.Group>
            <CertificatePreview
              type="trail"
              title={selected.trailName}
              description={selected.trailDescription}
              recipientName={selected.employeeName ?? ""}
              companyName={selected.companyName}
              ismName={selected.ismName}
              nota={selected.notaObtida ?? null}
              tempoTotalSegundos={selected.tempoTotalSegundos}
              iniciadoEm={selected.iniciadoEm}
              concluidoEm={selected.concluidoEm}
            />
          </Tooltip.Group>
        )}
      </Modal>
    </Stack>
  );
}
