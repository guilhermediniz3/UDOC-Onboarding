import {
  Alert,
  Button,
  Center,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import { IconAlertCircle, IconArrowLeft, IconCheck, IconMail } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { forgotPassword } from "../../services/emailConfigService";

export default function ForgotPassword() {

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Não foi possível enviar o e-mail. Verifique se o e-mail está cadastrado e se as configurações de SMTP estão definidas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Center bg="var(--app-bg)" mih="100vh" p="xl">
      <Paper p="40px" radius="24px" w="100%" maw={440}
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 20px 60px var(--shadow-color)" }}>

        <Stack gap="24px">

          <Stack gap={4} align="center">
            <Title order={2} c="var(--text-primary)" fw={800}>UDoc</Title>
            <Text c="var(--text-secondary)" fz="sm">Recuperação de senha</Text>
          </Stack>

          {success ? (
            <Alert icon={<IconCheck size={18} />} color="green" radius="xl">
              <Text fw={600}>E-mail enviado!</Text>
              <Text fz="sm" mt={4}>
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha. O link expira em 1 hora.
              </Text>
            </Alert>
          ) : (
            <>
              <Text c="var(--text-secondary)" fz="sm" ta="center">
                Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.
              </Text>

              {error && (
                <Alert icon={<IconAlertCircle size={18} />} color="red" radius="xl">
                  {error}
                </Alert>
              )}

              <TextInput
                label="E-mail"
                placeholder="seu@email.com"
                leftSection={<IconMail size={16} />}
                radius="xl"
                size="md"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                styles={{
                  input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
                  label: { color: "var(--text-primary)", marginBottom: 6 },
                }}
              />

              <Button fullWidth radius="xl" size="md" variant="gradient"
                gradient={{ from: "violet", to: "blue" }}
                loading={loading} onClick={handleSubmit}>
                Enviar link de redefinição
              </Button>
            </>
          )}

          <Button
            variant="subtle" color="gray" radius="xl" size="sm"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate("/")}
          >
            Voltar ao login
          </Button>

        </Stack>

      </Paper>
    </Center>
  );
}
