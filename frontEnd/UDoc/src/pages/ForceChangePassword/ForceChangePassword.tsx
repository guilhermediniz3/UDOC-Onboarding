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
import { IconAlertCircle, IconCheck, IconLock, IconShieldLock } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { changePassword } from "../../services/userService";

export default function ForceChangePassword() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState(false);

  async function handleSubmit() {
    setError("");
    if (!newPassword || !confirmPassword) {
      setError("Preencha os dois campos.");
      return;
    }
    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(user!.id, { newPassword, confirmPassword });
      // Limpa a flag localmente — backend já zerou no banco
      updateUser({ ...user!, forcePasswordChange: false });
      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Erro ao alterar a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Center
      style={{
        minHeight: "100vh",
        background: "var(--app-bg)",
      }}
    >
      <Paper
        p="40px"
        radius="24px"
        w={420}
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 20px 60px var(--shadow-color)",
        }}
      >
        <Stack gap="24px">
          <Stack gap="4px" align="center">
            <div
              style={{
                width: 56, height: 56, borderRadius: 16,
                background: "rgba(124,58,237,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <IconShieldLock size={28} color="var(--mantine-color-violet-5)" />
            </div>
            <Title order={2} c="var(--text-primary)" ta="center">
              Defina sua senha
            </Title>
            <Text c="var(--text-secondary)" fz="sm" ta="center">
              Esta é sua primeira entrada. Por segurança, crie uma senha pessoal
              antes de continuar.
            </Text>
          </Stack>

          {error && (
            <Alert
              color="red" radius="xl" variant="light"
              icon={<IconAlertCircle size={16} />}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              color="green" radius="xl" variant="light"
              icon={<IconCheck size={16} />}
            >
              Senha definida com sucesso! Redirecionando...
            </Alert>
          )}

          <PasswordInput
            label="Nova senha"
            placeholder="Mínimo 6 caracteres"
            leftSection={<IconLock size={16} />}
            radius="xl" size="md"
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={success}
            styles={{
              input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
              label: { color: "var(--text-primary)", marginBottom: 6 },
            }}
          />

          <PasswordInput
            label="Confirmar senha"
            placeholder="Repita a nova senha"
            leftSection={<IconLock size={16} />}
            radius="xl" size="md"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={success}
            styles={{
              input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
              label: { color: "var(--text-primary)", marginBottom: 6 },
            }}
          />

          <Button
            radius="xl" size="md" fullWidth
            variant="gradient" gradient={{ from: "violet", to: "blue" }}
            loading={loading}
            disabled={success}
            onClick={handleSubmit}
          >
            Definir senha e entrar
          </Button>
        </Stack>
      </Paper>
    </Center>
  );
}
