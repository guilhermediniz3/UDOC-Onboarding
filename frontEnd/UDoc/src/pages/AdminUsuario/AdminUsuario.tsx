import {
  Alert,
  Avatar,
  Button,
  Divider,
  Group,
  NumberInput,
  Paper,
  PasswordInput,
  Select,
  Stack,
  Switch,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import {
  IconArrowLeft,
  IconCamera,
  IconCheck,
  IconKey,
  IconMail,
  IconSend,
  IconUser,
  IconUserCog,
  IconX,
} from "@tabler/icons-react";

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  changePassword,
  createUser,
  getUserById,
  updateUser,
  type UserData,
} from "../../services/userService";

import {
  getEmailConfig,
  saveEmailConfig,
  type EmailConfigData,
} from "../../services/emailConfigService";

import { getEmployees } from "../../services/employeeService";
import type { Employee } from "../../types/Employee";

import { useAuth } from "../../contexts/AuthContext";

const EMPTY_USER: UserData = { name: "", email: "", photo: "", role: "ADMIN", active: true };

const EMPTY_EMAIL: EmailConfigData = {
  host: "",
  port: 587,
  username: "",
  password: "",
  sslEnabled: false,
  tlsEnabled: true,
  fromName: "UDoc",
};

export default function AdminUsuario() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;
  const { user: currentUser, updateUser: updateAuthUser } = useAuth();

  /* ── estado: dados ── */
  const [userData, setUserData] = useState<UserData>(EMPTY_USER);
  const [createPassword, setCreatePassword] = useState("");
  const [createConfirmPassword, setCreateConfirmPassword] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  /* ── estado: segurança ── */
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState("");
  const [pwdMessageType, setPwdMessageType] = useState<"success" | "error">("success");

  /* ── estado: e-mail ── */
  const [emailConfig, setEmailConfig] = useState<EmailConfigData>(EMPTY_EMAIL);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailMessageType, setEmailMessageType] = useState<"success" | "error">("success");
  const [hasEmailConfig, setHasEmailConfig] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  /* ── helpers de mensagem ── */
  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type); setMessage(text); setTimeout(() => setMessage(""), 3500);
  }
  function showPwdMessage(type: "success" | "error", text: string) {
    setPwdMessageType(type); setPwdMessage(text); setTimeout(() => setPwdMessage(""), 3500);
  }
  function showEmailMessage(type: "success" | "error", text: string) {
    setEmailMessageType(type); setEmailMessage(text); setTimeout(() => setEmailMessage(""), 4000);
  }

  /* ── carregamento inicial ── */
  useEffect(() => {
    if (!isNew) {
      getUserById(Number(id)).then(setUserData);
    }
    getEmailConfig()
      .then((data) => { setEmailConfig({ ...data, password: "" }); setHasEmailConfig(true); })
      .catch(() => { /* sem config ainda */ });
    getEmployees({ size: 1000, active: true })
      .then((r) => setEmployeeOptions(r.content));
  }, [id]);

  /* ── foto ── */
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b = ev.target?.result as string;
      setUserData((p) => ({ ...p, photo: b }));
    };
    reader.readAsDataURL(file);
  }

  /* ── salvar dados ── */
  async function handleSave() {
    if (!userData.name.trim()) { showMessage("error", "O nome é obrigatório."); return; }
    if (isNew) {
      if (!createPassword) { showMessage("error", "A senha é obrigatória."); return; }
      if (createPassword.length < 6) { showMessage("error", "A senha deve ter pelo menos 6 caracteres."); return; }
      if (createPassword !== createConfirmPassword) { showMessage("error", "As senhas não conferem."); return; }
    }
    setSaving(true);
    try {
      const payload = {
        name: userData.name,
        email: userData.email,
        photo: userData.photo || undefined,
        role: userData.role,
        active: userData.active,
        password: isNew ? createPassword : undefined,
        employeeId: userData.employeeId ?? null,
      };
      if (isNew) {
        await createUser(payload);
        showMessage("success", "Usuário criado com sucesso!");
        setTimeout(() => navigate("/admin/usuarios"), 1200);
      } else {
        const updated = await updateUser(Number(id), payload);
        showMessage("success", "Usuário atualizado com sucesso!");
        if (currentUser?.id === Number(id)) {
          updateAuthUser({ ...currentUser, name: updated.name, photo: updated.photo });
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showMessage("error", error?.response?.data?.message || "Erro ao salvar.");
    } finally { setSaving(false); }
  }

  /* ── trocar senha ── */
  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) { showPwdMessage("error", "Preencha os dois campos."); return; }
    if (newPassword !== confirmPassword) { showPwdMessage("error", "As senhas não conferem."); return; }
    setSavingPwd(true);
    try {
      await changePassword(Number(id), { newPassword, confirmPassword });
      showPwdMessage("success", "Senha alterada com sucesso!");
      setNewPassword(""); setConfirmPassword("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showPwdMessage("error", error?.response?.data?.message || "Erro ao alterar senha.");
    } finally { setSavingPwd(false); }
  }

  /* ── salvar config de e-mail ── */
  async function handleSaveEmail() {
    if (!emailConfig.host.trim() || !emailConfig.username.trim()) {
      showEmailMessage("error", "Host e e-mail são obrigatórios.");
      return;
    }
    if (!hasEmailConfig && (!emailConfig.password || !emailConfig.password.trim())) {
      showEmailMessage("error", "A senha de app é obrigatória na primeira configuração.");
      return;
    }
    setSavingEmail(true);
    try {
      await saveEmailConfig(emailConfig);
      setHasEmailConfig(true);
      showEmailMessage("success", "Configurações de e-mail salvas! Serão usadas para envio de redefinição de senha.");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showEmailMessage("error", error?.response?.data?.message || "Erro ao salvar as configurações.");
    } finally { setSavingEmail(false); }
  }

  /* ── estilos ── */
  const inputStyles = {
    input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
    label: { color: "var(--text-primary)", marginBottom: 6 },
    description: { color: "var(--text-secondary)" },
  };

  /* ── render ── */
  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      {/* Header */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} c="var(--text-primary)">
              {isNew ? "Novo Usuário" : "Editar Usuário"}
            </Title>
            <Text c="var(--text-secondary)" mt={4}>
              {isNew ? "Preencha os dados para criar um novo usuário" : userData.email}
            </Text>
          </div>
          <Button leftSection={<IconArrowLeft size={18} />} variant="default" radius="xl" size="md"
            onClick={() => navigate("/admin/usuarios")}>
            Voltar
          </Button>
        </Group>
      </Paper>

      {/* Abas */}
      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>

        <Tabs defaultValue="dados" color="violet">

          <Tabs.List mb="xl">
            <Tabs.Tab value="dados" leftSection={<IconUserCog size={16} />}>
              Dados
            </Tabs.Tab>
            {!isNew && (
              <Tabs.Tab value="email" leftSection={<IconMail size={16} />}>
                E-mail
              </Tabs.Tab>
            )}
            {!isNew && (
              <Tabs.Tab value="seguranca" leftSection={<IconKey size={16} />}>
                Segurança
              </Tabs.Tab>
            )}
          </Tabs.List>

          {/* ── ABA DADOS ── */}
          <Tabs.Panel value="dados">
            <Stack gap="20px">

              {message && (
                <Alert color={messageType === "success" ? "green" : "red"}
                  icon={messageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />}
                  radius="xl">
                  {message}
                </Alert>
              )}

              {/* Foto */}
              <Group align="flex-end" gap="lg">
                <div style={{ position: "relative", width: 100, height: 100 }}>
                  <Avatar src={userData.photo || null} radius="50%" size={100}
                    style={{ border: "3px solid rgba(139,92,246,0.6)", cursor: "pointer" }}
                    onClick={() => fileRef.current?.click()}>
                    {!userData.photo && <IconUser size={44} />}
                  </Avatar>
                  <div onClick={() => fileRef.current?.click()}
                    style={{ position: "absolute", bottom: 0, right: 0, background: "rgba(139,92,246,0.9)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <IconCamera size={14} color="white" />
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
                </div>
                <Stack gap={4}>
                  <Text fw={600} c="var(--text-primary)" fz="sm">Foto de perfil</Text>
                  <Text c="var(--text-secondary)" fz="xs">Clique na imagem para selecionar.</Text>
                  {userData.photo && (
                    <Button size="xs" variant="subtle" color="red" p={0}
                      onClick={() => setUserData((p) => ({ ...p, photo: "" }))}>
                      Remover foto
                    </Button>
                  )}
                </Stack>
              </Group>

              <TextInput label="Nome" placeholder="Nome completo" required radius="xl" size="md"
                value={userData.name}
                onChange={(e) => { const v = e.currentTarget.value; setUserData((p) => ({ ...p, name: v })); }}
                styles={inputStyles} />

              <TextInput label="E-mail" placeholder="email@exemplo.com" required radius="xl" size="md"
                value={userData.email}
                onChange={(e) => { const v = e.currentTarget.value; setUserData((p) => ({ ...p, email: v })); }}
                styles={inputStyles} />

              <Select label="Role" required radius="xl" size="md"
                value={userData.role}
                onChange={(v) => v && setUserData((p) => ({ ...p, role: v }))}
                data={[
                  { value: "ADMIN", label: "Admin" },
                  { value: "ISM", label: "ISM (Instrutor)" },
                  { value: "FUNCIONARIO_EXTERNO", label: "Funcionário Externo" },
                ]}
                styles={inputStyles} />

              <Select
                label="Funcionário Externo vinculado"
                description="Opcional — vincula este usuário a um funcionário externo cadastrado"
                placeholder="Selecione o funcionário externo..."
                radius="xl" size="md"
                clearable searchable
                data={employeeOptions.map((e) => ({
                  value: String(e.id),
                  label: `${e.name}${e.companyName ? ` — ${e.companyName}` : ""}`,
                }))}
                value={userData.employeeId ? String(userData.employeeId) : null}
                onChange={(v) => setUserData((p) => ({ ...p, employeeId: v ? Number(v) : undefined }))}
                styles={inputStyles}
              />

              {isNew && (
                <>
                  <Divider label="Senha de acesso" labelPosition="left" />
                  <PasswordInput label="Senha" placeholder="Mínimo 6 caracteres" required radius="xl" size="md"
                    value={createPassword} onChange={(e) => setCreatePassword(e.currentTarget.value)}
                    styles={inputStyles} />
                  <PasswordInput label="Confirmar senha" placeholder="Repita a senha" required radius="xl" size="md"
                    value={createConfirmPassword} onChange={(e) => setCreateConfirmPassword(e.currentTarget.value)}
                    styles={inputStyles} />
                </>
              )}

              <Group>
                <Switch
                  label={userData.active ? "Ativo" : "Inativo"}
                  checked={userData.active}
                  onChange={(e) => { const c = e.currentTarget.checked; setUserData((p) => ({ ...p, active: c })); }}
                  size="md" color="violet"
                  styles={{ label: { color: "var(--text-primary)", cursor: "pointer" } }}
                />
              </Group>

              <Group justify="flex-end" mt="4px">
                <Button variant="default" radius="xl" size="md" onClick={() => navigate("/admin/usuarios")}>
                  Cancelar
                </Button>
                <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }}
                  loading={saving} onClick={handleSave}>
                  {isNew ? "Criar Usuário" : "Salvar Alterações"}
                </Button>
              </Group>

            </Stack>
          </Tabs.Panel>

          {/* ── ABA E-MAIL ── */}
          {!isNew && (
            <Tabs.Panel value="email">
              <Stack gap="20px">

                <Alert color="blue" radius="xl" variant="light">
                  <Text fz="sm">
                    Configure aqui o e-mail para envio de redefinição de senha.
                    Se preenchido, ele tem <strong>prioridade sobre o SendGrid</strong>.
                    Use Gmail com senha de app ou qualquer servidor SMTP.
                  </Text>
                </Alert>

                {emailMessage && (
                  <Alert color={emailMessageType === "success" ? "green" : "red"}
                    icon={emailMessageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />}
                    radius="xl">
                    {emailMessage}
                  </Alert>
                )}

                <Group grow>
                  <TextInput label="Host SMTP" placeholder="smtp.gmail.com"
                    description="Servidor de e-mail"
                    radius="xl" size="md"
                    value={emailConfig.host}
                    onChange={(e) => { const v = e.currentTarget.value; setEmailConfig((p) => ({ ...p, host: v })); }}
                    styles={inputStyles} />
                  <NumberInput label="Porta" placeholder="587"
                    description="587 (TLS) ou 465 (SSL)"
                    radius="xl" size="md" min={1} max={65535}
                    value={emailConfig.port}
                    onChange={(v) => setEmailConfig((p) => ({ ...p, port: Number(v) || 587 }))}
                    styles={inputStyles} />
                </Group>

                <TextInput label="E-mail remetente" placeholder="seu@gmail.com"
                  description="E-mail usado para enviar as mensagens"
                  radius="xl" size="md"
                  value={emailConfig.username}
                  onChange={(e) => { const v = e.currentTarget.value; setEmailConfig((p) => ({ ...p, username: v })); }}
                  styles={inputStyles} />

                <TextInput
                  label={hasEmailConfig ? "Senha de app (deixe em branco para manter)" : "Senha de app"}
                  placeholder="Senha de aplicativo gerada no provedor"
                  description="Gmail: Conta Google → Segurança → Senhas de app"
                  radius="xl" size="md" type="password"
                  value={emailConfig.password || ""}
                  onChange={(e) => { const v = e.currentTarget.value; setEmailConfig((p) => ({ ...p, password: v })); }}
                  styles={inputStyles} />

                <TextInput label="Nome do remetente" placeholder="UDoc"
                  radius="xl" size="md"
                  value={emailConfig.fromName}
                  onChange={(e) => { const v = e.currentTarget.value; setEmailConfig((p) => ({ ...p, fromName: v })); }}
                  styles={inputStyles} />

                <Divider label="Criptografia" labelPosition="left" />

                <Group gap="xl">
                  <Switch label="TLS (recomendado para porta 587)"
                    checked={emailConfig.tlsEnabled}
                    onChange={(e) => { const c = e.currentTarget.checked; setEmailConfig((p) => ({ ...p, tlsEnabled: c })); }}
                    size="md" color="violet"
                    styles={{ label: { color: "var(--text-primary)" } }} />
                  <Switch label="SSL (para porta 465)"
                    checked={emailConfig.sslEnabled}
                    onChange={(e) => { const c = e.currentTarget.checked; setEmailConfig((p) => ({ ...p, sslEnabled: c })); }}
                    size="md" color="violet"
                    styles={{ label: { color: "var(--text-primary)" } }} />
                </Group>

                <Group justify="flex-end" mt="8px">
                  <Button radius="xl" size="md" variant="gradient"
                    gradient={{ from: "violet", to: "blue" }}
                    leftSection={<IconSend size={16} />}
                    loading={savingEmail} onClick={handleSaveEmail}>
                    Salvar configurações de e-mail
                  </Button>
                </Group>

              </Stack>
            </Tabs.Panel>
          )}

          {/* ── ABA SEGURANÇA ── */}
          {!isNew && (
            <Tabs.Panel value="seguranca">
              <Stack gap="20px">

                {pwdMessage && (
                  <Alert color={pwdMessageType === "success" ? "green" : "red"}
                    icon={pwdMessageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />}
                    radius="xl">
                    {pwdMessage}
                  </Alert>
                )}

                <PasswordInput label="Nova senha" placeholder="Mínimo 6 caracteres"
                  radius="xl" size="md"
                  value={newPassword} onChange={(e) => setNewPassword(e.currentTarget.value)}
                  styles={inputStyles} />

                <PasswordInput label="Confirmar nova senha" placeholder="Repita a senha"
                  radius="xl" size="md"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                  styles={inputStyles} />

                <Group justify="flex-end">
                  <Button radius="xl" size="md" color="violet" variant="light"
                    leftSection={<IconKey size={16} />}
                    loading={savingPwd} onClick={handleChangePassword}>
                    Salvar nova senha
                  </Button>
                </Group>

              </Stack>
            </Tabs.Panel>
          )}

        </Tabs>

      </Paper>

    </Stack>
  );
}
