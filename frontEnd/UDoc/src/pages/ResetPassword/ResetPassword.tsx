import {
  Alert,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import { IconAlertCircle, IconCheck, IconLock } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { resetPassword } from "../../services/emailConfigService";

export default function ResetPassword() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Token inválido. Solicite um novo link de redefinição.");
  }, [token]);

  async function handleSubmit() {
    if (!newPassword || !confirmPassword) {
      setError("Preencha os dois campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }
    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Token inválido ou expirado. Solicite um novo link.");
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
            <Text c="var(--text-secondary)" fz="sm">Definir nova senha</Text>
          </Stack>

          {success ? (
            <Alert icon={<IconCheck size={18} />} color="green" radius="xl">
              <Text fw={600}>Senha redefinida com sucesso!</Text>
              <Text fz="sm" mt={4}>Redirecionando para o login...</Text>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert icon={<IconAlertCircle size={18} />} color="red" radius="xl">
                  {error}
                </Alert>
              )}

              <PasswordInput
                label="Nova senha"
                placeholder="Mínimo 6 caracteres"
                leftSection={<IconLock size={16} />}
                radius="xl" size="md"
                value={newPassword}
                onChange={(e) => setNewPassword(e.currentTarget.value)}
                styles={{
                  input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
                  label: { color: "var(--text-primary)", marginBottom: 6 },
                }}
              />

              <PasswordInput
                label="Confirmar nova senha"
                placeholder="Repita a senha"
                leftSection={<IconLock size={16} />}
                radius="xl" size="md"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                styles={{
                  input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
                  label: { color: "var(--text-primary)", marginBottom: 6 },
                }}
              />

              <Button fullWidth radius="xl" size="md" variant="gradient"
                gradient={{ from: "violet", to: "blue" }}
                loading={loading} onClick={handleSubmit}
                disabled={!token}>
                Salvar nova senha
              </Button>
            </>
          )}

        </Stack>

      </Paper>
    </Center>
  );
}
