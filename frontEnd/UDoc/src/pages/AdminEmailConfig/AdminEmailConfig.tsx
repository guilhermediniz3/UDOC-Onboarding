import {
  Alert,
  Button,
  Divider,
  Group,
  NumberInput,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import { IconCheck, IconMail, IconSend, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import {
  getEmailConfig,
  saveEmailConfig,
  type EmailConfigData,
} from "../../services/emailConfigService";

const EMPTY: EmailConfigData = {
  host: "",
  port: 587,
  username: "",
  password: "",
  sslEnabled: false,
  tlsEnabled: true,
  fromName: "UDoc",
};

export default function AdminEmailConfig() {

  const [config, setConfig] = useState<EmailConfigData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [hasExisting, setHasExisting] = useState(false);

  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  }

  useEffect(() => {
    getEmailConfig()
      .then((data) => {
        setConfig({ ...data, password: "" }); // senha não é retornada
        setHasExisting(true);
      })
      .catch(() => {
        // sem config ainda, usa empty
      });
  }, []);

  async function handleSave() {
    if (!config.host.trim() || !config.username.trim()) {
      showMessage("error", "Host e e-mail são obrigatórios.");
      return;
    }
    if (!hasExisting && (!config.password || !config.password.trim())) {
      showMessage("error", "A senha de app é obrigatória na primeira configuração.");
      return;
    }
    setSaving(true);
    try {
      await saveEmailConfig(config);
      setHasExisting(true);
      showMessage("success", "Configurações de e-mail salvas com sucesso!");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showMessage("error", e?.response?.data?.message || "Erro ao salvar as configurações.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyles = {
    input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
    label: { color: "var(--text-primary)", marginBottom: 6 },
    description: { color: "var(--text-secondary)" },
  };

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group gap="md" align="center">
          <IconMail size={28} color="var(--text-secondary)" />
          <div>
            <Title order={2} c="var(--text-primary)">Configuração de E-mail</Title>
            <Text c="var(--text-secondary)" mt={4}>
              Configure o servidor SMTP para envio de e-mails (recuperação de senha, notificações)
            </Text>
          </div>
        </Group>
      </Paper>

      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Stack gap="20px">

          {message && (
            <Alert color={messageType === "success" ? "green" : "red"}
              icon={messageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />}
              radius="xl">
              {message}
            </Alert>
          )}

          <Text fw={600} c="var(--text-primary)">Servidor SMTP</Text>
          <Divider />

          <Group grow>
            <TextInput
              label="Host SMTP"
              placeholder="smtp.gmail.com"
              description="Endereço do servidor de e-mail"
              radius="xl" size="md"
              value={config.host}
              onChange={(e) => { const v = e.currentTarget.value; setConfig((p) => ({ ...p, host: v })); }}
              styles={inputStyles}
            />
            <NumberInput
              label="Porta"
              placeholder="587"
              description="587 (TLS) ou 465 (SSL)"
              radius="xl" size="md"
              min={1} max={65535}
              value={config.port}
              onChange={(v) => setConfig((p) => ({ ...p, port: Number(v) || 587 }))}
              styles={inputStyles}
            />
          </Group>

          <TextInput
            label="E-mail remetente"
            placeholder="seu@gmail.com"
            description="E-mail usado para enviar as mensagens"
            radius="xl" size="md"
            value={config.username}
            onChange={(e) => { const v = e.currentTarget.value; setConfig((p) => ({ ...p, username: v })); }}
            styles={inputStyles}
          />

          <TextInput
            label={hasExisting ? "Senha de app (deixe em branco para manter)" : "Senha de app"}
            placeholder="Senha de aplicativo gerada no provedor de e-mail"
            description="Para Gmail: gere em Conta Google → Segurança → Senhas de app"
            radius="xl" size="md"
            type="password"
            value={config.password || ""}
            onChange={(e) => { const v = e.currentTarget.value; setConfig((p) => ({ ...p, password: v })); }}
            styles={inputStyles}
          />

          <TextInput
            label="Nome do remetente"
            placeholder="UDoc"
            radius="xl" size="md"
            value={config.fromName}
            onChange={(e) => { const v = e.currentTarget.value; setConfig((p) => ({ ...p, fromName: v })); }}
            styles={inputStyles}
          />

          <Divider />
          <Text fw={600} c="var(--text-primary)">Criptografia</Text>

          <Group gap="xl">
            <Switch
              label="TLS (STARTTLS)"
              description="Recomendado para porta 587"
              checked={config.tlsEnabled}
              onChange={(e) => { const c = e.currentTarget.checked; setConfig((p) => ({ ...p, tlsEnabled: c })); }}
              size="md" color="violet"
              styles={{ label: { color: "var(--text-primary)" }, description: { color: "var(--text-secondary)" } }}
            />
            <Switch
              label="SSL"
              description="Para porta 465"
              checked={config.sslEnabled}
              onChange={(e) => { const c = e.currentTarget.checked; setConfig((p) => ({ ...p, sslEnabled: c })); }}
              size="md" color="violet"
              styles={{ label: { color: "var(--text-primary)" }, description: { color: "var(--text-secondary)" } }}
            />
          </Group>

          <Alert color="blue" radius="xl" variant="light">
            <Text fz="sm">
              <strong>Gmail:</strong> host = smtp.gmail.com, porta = 587, TLS ativo. Use uma{" "}
              <strong>senha de aplicativo</strong> (não sua senha normal). Ative a verificação em duas etapas primeiro.
            </Text>
          </Alert>

          <Group justify="flex-end" mt="8px">
            <Button radius="xl" size="md" variant="gradient"
              gradient={{ from: "violet", to: "blue" }}
              leftSection={<IconSend size={16} />}
              loading={saving} onClick={handleSave}>
              Salvar configurações
            </Button>
          </Group>

        </Stack>
      </Paper>

    </Stack>
  );
}
