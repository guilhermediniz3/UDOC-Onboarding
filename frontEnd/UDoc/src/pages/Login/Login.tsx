import {
  Alert,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import { IconAlertCircle, IconLock, IconMail } from "@tabler/icons-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login as loginService } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {

  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await loginService(email, password);
      login(data.token, {
        id: data.id,
        name: data.name,
        email: data.email,
        photo: data.photo,
        role: data.role,
        forcePasswordChange: data.forcePasswordChange,
      });
      // Redireciona para troca obrigatória antes de acessar o sistema
      navigate(data.forcePasswordChange ? "/force-change-password" : "/");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } };
      const errors = e?.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors).join(" | "));
      } else {
        setError(e?.response?.data?.message || "E-mail ou senha inválidos.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (

    <Center bg="var(--app-bg)" mih="100vh" p="xl">

      <Paper p="40px" radius="24px" w="100%" maw={420}
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 20px 60px var(--shadow-color)" }}>

        <Stack gap="24px">

          <Stack gap={4} align="center">
            <Title order={2} c="var(--text-primary)" fw={800}>UDoc</Title>
            <Text c="var(--text-secondary)" fz="sm">Faça login para continuar</Text>
          </Stack>

          {error && (
            <Alert icon={<IconAlertCircle size={18} />} color="red" radius="xl">
              {error}
            </Alert>
          )}

          <TextInput
            label="E-mail" placeholder="seu@email.com"
            leftSection={<IconMail size={16} />}
            radius="xl" size="md"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }, label: { color: "var(--text-primary)", marginBottom: 6 } }}
          />

          <PasswordInput
            label="Senha" placeholder="••••••"
            leftSection={<IconLock size={16} />}
            radius="xl" size="md"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            styles={{ input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }, label: { color: "var(--text-primary)", marginBottom: 6 } }}
          />

          <Button fullWidth radius="xl" size="md" variant="gradient"
            gradient={{ from: "violet", to: "blue" }}
            loading={loading} onClick={handleLogin}>
            Entrar
          </Button>

          <Button variant="subtle" color="gray" size="sm" radius="xl"
            onClick={() => navigate("/forgot-password")}>
            Esqueci minha senha
          </Button>

        </Stack>

      </Paper>

    </Center>
  );
}
