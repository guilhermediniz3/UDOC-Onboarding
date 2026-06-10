import {
  ActionIcon,
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
  Tooltip,
} from "@mantine/core";

import {
  IconArrowLeft,
  IconBrandWhatsapp,
  IconCamera,
  IconCheck,
  IconInfoCircle,
  IconKey,
  IconMail,
  IconRobot,
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
  generateInviteLink,
  getMyAiProviders,
  getUserById,
  saveMyAiProviders,
  sendWelcomeEmail,
  updateUser,
  type UserData,
} from "../../services/userService";
import AIProvidersPanel from "../../components/AIProvidersPanel/AIProvidersPanel";

import {
  saveEmailConfig,
  deleteEmailConfig,
  type EmailConfigData,
} from "../../services/emailConfigService";

import { getEmployees } from "../../services/employeeService";
import type { Employee } from "../../types/Employee";

import { useAuth } from "../../contexts/AuthContext";
import { usePermission } from "../../contexts/PermissionContext";

// Role padrão para novo usuário: Admin (sem vínculo) — auto-ajustado ao selecionar funcionário
const EMPTY_USER: UserData = { name: "", email: "", photo: "", role: "ADMIN", active: true };

const EMPTY_EMAIL: EmailConfigData = {
  host: "",
  port: undefined,
  username: "",
  password: "",
  sslEnabled: false,
  tlsEnabled: true,
  fromName: "UDoc",
};

export default function AdminUser() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;
  const { user: currentUser, updateUser: updateAuthUser } = useAuth();
  const { can } = usePermission();
  const canSendInvite = can("USUARIO", "ENVIAR_CONVITE");

  /* ── estado: dados ── */
  const [userData, setUserData] = useState<UserData>(EMPTY_USER);
  const [createPassword, setCreatePassword] = useState("");
  const [createConfirmPassword, setCreateConfirmPassword] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([]);
  const [saving, setSaving]               = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [message, setMessage]             = useState("");
  const [messageType, setMessageType]     = useState<"success" | "error">("success");

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

  /* ── estado: provedores de IA ── */
  const [aiActiveProvider, setAiActiveProvider] = useState("");
  const [aiProviderKeys, setAiProviderKeys] = useState<Record<string, string>>({});
  const [savingAiKey, setSavingAiKey] = useState(false);
  const [aiKeyMessage, setAiKeyMessage] = useState("");
  const [aiKeyMessageType, setAiKeyMessageType] = useState<"success" | "error">("success");

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
  function showAiKeyMessage(type: "success" | "error", text: string) {
    setAiKeyMessageType(type); setAiKeyMessage(text); setTimeout(() => setAiKeyMessage(""), 3500);
  }

  /* ── carregamento inicial ── */
  useEffect(() => {
    if (!isNew) {
      getUserById(Number(id))
        .then(setUserData)
        .catch(() => {
          // Usuário não encontrado (pode ter sido deletado) → volta para a lista
          navigate("/admin/users");
        });
    }
    // O formulário sempre começa vazio — host/porta/credenciais são exemplos
    // exibidos apenas como placeholder (ex.: "smtp.gmail.com" / "587"), nunca
    // como valor pré-preenchido. Isso evita salvar de novo, sem querer, uma
    // configuração de SMTP já existente (e possivelmente quebrada).
    setEmailConfig(EMPTY_EMAIL);
    getEmployees({ size: 1000, active: true })
      .then((r) => setEmployeeOptions(r.content));
  }, [id]);

  /* ── carregamento dos provedores de IA (somente ao editar o próprio perfil) ── */
  useEffect(() => {
    setAiActiveProvider("");
    setAiProviderKeys({});
    if (!isNew && currentUser?.id === Number(id)) {
      getMyAiProviders()
        .then((cfg) => {
          setAiActiveProvider(cfg.activeProvider ?? "");
          setAiProviderKeys((cfg.providerKeys as Record<string, string>) ?? {});
        })
        .catch(() => {});
    }
  }, [id, currentUser?.id]);

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

    // Vínculo obrigatório para perfis não-Admin/Gestor
    if (userData.role !== "ADMIN" && userData.role !== "GESTOR" && !userData.employeeId) {
      showMessage("error", "Selecione um Funcionário Externo (perfil Funcionário) ou Interno (perfil ISM/Funcionário/Gestor) antes de salvar.");
      return;
    }
    // Consistência Externo → Funcionário
    if (linkedTipo === "EXTERNO" && userData.role !== "FUNCIONARIO_EXTERNO") {
      showMessage("error", "Funcionário Externo só pode ter o perfil Funcionário.");
      return;
    }
    // Consistência Interno → não pode ser Admin
    if (linkedTipo === "INTERNO" && userData.role === "ADMIN") {
      showMessage("error", "Funcionário Interno não pode ter o perfil Admin.");
      return;
    }
    // Apenas Admin pode criar/promover Admin ou Gestor.
    // Ignora quando o select de Role estava travado (role elevada + viewer não-Admin → não pôde ser alterada).
    const roleSelectLocked =
      availableRoles.length <= 1 ||
      (currentUser?.role !== "ADMIN" && (userData.role === "GESTOR" || userData.role === "ADMIN"));
    if (!roleSelectLocked && (userData.role === "ADMIN" || userData.role === "GESTOR") && currentUser?.role !== "ADMIN") {
      showMessage("error", "Apenas administradores podem criar usuários com perfil Admin ou Gestor.");
      return;
    }

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
        const created = await createUser(payload);
        showMessage("success", "Usuário criado! Redirecionando para enviar o convite por e-mail...");
        setTimeout(() => navigate(`/admin/user/${created.id}`), 1000);
      } else {
        // Atualiza o estado local com a resposta do servidor para garantir
        // que os selects reflitam exatamente o que foi persistido no banco
        const updated = await updateUser(Number(id), payload);
        setUserData(updated);
        showMessage("success", "Usuário atualizado com sucesso!");
        if (currentUser?.id === Number(id)) {
          updateAuthUser({ ...currentUser, name: updated.name, photo: updated.photo });
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      if (error?.response?.status === 404) {
        navigate("/admin/users"); // usuário não existe mais
        return;
      }
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

  /* ── enviar convite via WhatsApp Web ── */
  async function handleSendWhatsApp() {
    if (!userData.email) { showMessage("error", "O usuário não tem e-mail cadastrado."); return; }
    setSendingWhatsApp(true);
    try {
      const link = await generateInviteLink(Number(id));
      const nome  = userData.name || "você";
      const texto =
        `Olá, ${nome}! 👋\n\n` +
        `Seu acesso ao UDoc está pronto.\n` +
        `Clique no link abaixo para definir sua senha:\n\n` +
        `${link}\n\n` +
        `⏰ O link expira em 24 horas.`;
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showMessage("error", error?.response?.data?.message || "Erro ao gerar o link. Tente novamente.");
    } finally {
      setSendingWhatsApp(false);
    }
  }

  /* ── enviar convite por e-mail ── */
  async function handleSendWelcomeEmail() {
    if (!userData.email) { showMessage("error", "O usuário não tem e-mail cadastrado."); return; }
    setSendingInvite(true);
    try {
      await sendWelcomeEmail(Number(id));
      showMessage("success", `Convite enviado para ${userData.email}! O link para definir a senha expira em 24 horas.`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showMessage("error", error?.response?.data?.message || "Erro ao enviar e-mail. Verifique as configurações de SMTP.");
    } finally { setSendingInvite(false); }
  }

  /* ── salvar config de e-mail ──
   * Regra: SMTP é totalmente opcional.
   *   - Formulário vazio  → remove a configuração personalizada (sistema volta a usar o SendGrid).
   *   - Formulário preenchido → exige Host + E-mail e salva como SMTP personalizado (passa a ter prioridade sobre o SendGrid).
   */
  async function handleSaveEmail() {
    const isBlank = (v?: string) => !v || !v.trim();
    const formIsEmpty =
      isBlank(emailConfig.host) && isBlank(emailConfig.username) &&
      isBlank(emailConfig.password) && isBlank(emailConfig.fromName);

    setSavingEmail(true);
    try {
      if (formIsEmpty) {
        await deleteEmailConfig();
        setHasEmailConfig(false);
        showEmailMessage("success", "Configuração de SMTP removida — o sistema voltará a usar o SendGrid padrão.");
        return;
      }

      if (isBlank(emailConfig.host) || isBlank(emailConfig.username)) {
        showEmailMessage("error", "Para configurar um SMTP próprio, Host e E-mail são obrigatórios. Ou deixe tudo em branco para usar o SendGrid padrão.");
        return;
      }
      if (!hasEmailConfig && isBlank(emailConfig.password)) {
        showEmailMessage("error", "A senha de app é obrigatória na primeira configuração.");
        return;
      }

      await saveEmailConfig(emailConfig);
      setHasEmailConfig(true);
      showEmailMessage("success", "Configurações de e-mail salvas! Serão usadas (com prioridade sobre o SendGrid) para envio de e-mails.");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showEmailMessage("error", error?.response?.data?.message || "Erro ao salvar as configurações.");
    } finally { setSavingEmail(false); }
  }

  async function handleSaveAiProviders() {
    setSavingAiKey(true);
    try {
      await saveMyAiProviders({ activeProvider: aiActiveProvider || null, providerKeys: aiProviderKeys });
      const cfg = await getMyAiProviders();
      setAiActiveProvider(cfg.activeProvider ?? "");
      setAiProviderKeys((cfg.providerKeys as Record<string, string>) ?? {});
      showAiKeyMessage("success", "Configurações de IA salvas! Suas gerações passarão a usar o provedor selecionado.");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showAiKeyMessage("error", error?.response?.data?.message || "Erro ao salvar as configurações.");
    } finally { setSavingAiKey(false); }
  }

  // ── Regras de role × vínculo ─────────────────────────────────────────────
  const linkedEmployee = employeeOptions.find((e) => e.id === userData.employeeId) ?? null;
  // userData.employeeTipo chega imediatamente via getUserById; linkedEmployee?.tipo só fica disponível
  // depois que getEmployees carrega — usar employeeTipo como fonte primária evita race condition.
  const linkedTipo = (userData.employeeTipo ?? linkedEmployee?.tipo) ?? null; // "EXTERNO" | "INTERNO" | null

  const availableRoles = (() => {
    if (linkedTipo === "EXTERNO") return [
      { value: "FUNCIONARIO_EXTERNO", label: "Funcionário" },
    ];
    if (linkedTipo === "INTERNO") {
      const roles: { value: string; label: string }[] = [
        { value: "ISM",                 label: "ISM (Instrutor)" },
        { value: "FUNCIONARIO_EXTERNO", label: "Funcionário" },
      ];
      // Apenas Admin pode atribuir/promover para Gestor
      if (currentUser?.role === "ADMIN") roles.push({ value: "GESTOR", label: "Gestor" });
      // Garante que o role atual apareça mesmo quando viewer não é Admin (ex: Gestor vendo próprio perfil)
      if (userData.role === "GESTOR" && !roles.some(r => r.value === "GESTOR")) {
        roles.push({ value: "GESTOR", label: "Gestor" });
      }
      return roles;
    }
    // Sem vínculo: apenas Admin pode definir role Admin/Gestor
    if (currentUser?.role === "ADMIN") {
      return [{ value: "ADMIN", label: "Admin" }, { value: "GESTOR", label: "Gestor" }];
    }
    // Não-Admin sem vínculo: exibe o role atual (somente leitura)
    if (userData.role === "ADMIN" || userData.role === "GESTOR") {
      const labelMap: Record<string, string> = { GESTOR: "Gestor", ADMIN: "Admin" };
      return [{ value: userData.role, label: labelMap[userData.role] }];
    }
    return [];
  })();

  // Descrição contextual do campo Role
  const roleDescription =
    linkedTipo === "EXTERNO" ? "Funcionário Externo → apenas perfil Funcionário" :
    linkedTipo === "INTERNO" ? "Funcionário Interno → ISM, Funcionário ou Gestor (sem Admin)" :
    currentUser?.role === "ADMIN" ? "Sem vínculo → perfil Admin ou Gestor" : "";

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
            onClick={() => navigate("/admin/users")}>
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
            {!isNew && currentUser?.id === Number(id) && (
              <Tabs.Tab value="ia" leftSection={<IconRobot size={16} />}>
                IA
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

              <Group gap="8px" align="flex-end">
                <TextInput
                  label="E-mail" placeholder="email@exemplo.com" required radius="xl" size="md"
                  style={{ flex: 1 }}
                  value={userData.email}
                  onChange={(e) => { const v = e.currentTarget.value; setUserData((p) => ({ ...p, email: v })); }}
                  styles={inputStyles}
                />
                {!isNew && canSendInvite && (
                  <>
                    <Tooltip
                      label="Enviar convite por e-mail — link para definir a senha (válido por 24h)"
                      withArrow multiline w={250} position="top"
                    >
                      <Button
                        radius="xl" size="md"
                        variant="light" color="violet"
                        leftSection={<IconSend size={16} />}
                        loading={sendingInvite}
                        onClick={handleSendWelcomeEmail}
                        disabled={!userData.email}
                      >
                        Enviar convite
                      </Button>
                    </Tooltip>

                    <Tooltip
                      label="Abrir WhatsApp Web com o link de acesso pré-preenchido (válido por 24h)"
                      withArrow multiline w={250} position="top"
                    >
                      <ActionIcon
                        radius="xl" size={42}
                        variant="light" color="green"
                        loading={sendingWhatsApp}
                        onClick={handleSendWhatsApp}
                        disabled={!userData.email}
                      >
                        <IconBrandWhatsapp size={20} />
                      </ActionIcon>
                    </Tooltip>
                  </>
                )}
              </Group>

              {/* Regras de vínculo */}
              <Alert color="blue" radius="xl" variant="light" icon={<IconInfoCircle size={15} />}>
                <Text fz="xs">
                  <strong>Admin</strong> — sem vínculo obrigatório (só admin pode criar)<br />
                  <strong>Gestor</strong> — visão completa como Admin; vínculo com Funcionário Interno é opcional, usado para participar de trilhas (só admin pode criar)<br />
                  <strong>ISM</strong> — vincule um Funcionário Interno<br />
                  <strong>Funcionário</strong> — vincule um Funcionário Externo
                </Text>
              </Alert>

              {/* Funcionário Externo — obrigatório para perfil Funcionário */}
              <Select
                label="Funcionário Externo vinculado"
                description="Obrigatório para perfil Funcionário — das empresas clientes de treinamento"
                placeholder="Selecione o funcionário externo..."
                radius="xl" size="md"
                clearable searchable
                data={employeeOptions
                  .filter((e) => (e.tipo || "EXTERNO") === "EXTERNO")
                  .map((e) => ({
                    value: String(e.id),
                    label: `${e.name}${e.companyName ? ` — ${e.companyName}` : ""}`,
                  }))}
                value={linkedTipo === "EXTERNO" && userData.employeeId && linkedEmployee !== null ? String(userData.employeeId) : null}
                onChange={(v) => {
                  const empId = v ? Number(v) : undefined;
                  setUserData((p) => ({
                    ...p,
                    employeeId: empId,
                    role: empId
                      ? "FUNCIONARIO_EXTERNO"
                      : (p.role === "ADMIN" || p.role === "GESTOR" ? p.role
                          : (currentUser?.role === "ADMIN" ? "ADMIN" : p.role)),
                  }));
                }}
                styles={inputStyles}
              />

              {/* Funcionário Interno — obrigatório para perfil ISM */}
              <Select
                label="Funcionário Interno vinculado"
                description="Obrigatório para perfil ISM — equipe interna que fornece o treinamento"
                placeholder="Selecione o funcionário interno..."
                radius="xl" size="md"
                clearable searchable
                data={employeeOptions
                  .filter((e) => e.tipo === "INTERNO")
                  .map((e) => ({
                    value: String(e.id),
                    label: `${e.name}${e.companyName ? ` — ${e.companyName}` : ""}`,
                  }))}
                value={linkedTipo === "INTERNO" && userData.employeeId && linkedEmployee !== null ? String(userData.employeeId) : null}
                onChange={(v) => {
                  const empId = v ? Number(v) : undefined;
                  setUserData((p) => ({
                    ...p,
                    employeeId: empId,
                    role: empId
                      ? (p.role === "ADMIN" ? "ISM" : p.role)
                      : (p.role === "ADMIN" || p.role === "GESTOR" ? p.role
                          : (currentUser?.role === "ADMIN" ? "ADMIN" : p.role)),
                  }));
                }}
                styles={inputStyles}
              />

              {/* Role — controlada dinamicamente pelo vínculo */}
              <Select
                label="Perfil (Role)"
                required
                radius="xl" size="md"
                description={roleDescription}
                value={userData.role}
                onChange={(v) => v && setUserData((p) => ({ ...p, role: v }))}
                data={availableRoles}
                disabled={
                  availableRoles.length <= 1 ||
                  // Não-Admin não pode alterar roles elevadas (GESTOR/ADMIN)
                  (currentUser?.role !== "ADMIN" && (userData.role === "GESTOR" || userData.role === "ADMIN"))
                }
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
                <Button variant="default" radius="xl" size="md" onClick={() => navigate("/admin/users")}>
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
                    Configurar um SMTP aqui é <strong>opcional</strong>. Sem nenhuma configuração,
                    o sistema usa o <strong>SendGrid</strong> normalmente. Se você preencher os
                    campos abaixo (Gmail com senha de app ou qualquer servidor SMTP), eles passam
                    a ter <strong>prioridade sobre o SendGrid</strong>. Para remover uma configuração
                    já salva e voltar ao SendGrid, deixe tudo em branco e clique em salvar.
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
                    onChange={(v) => setEmailConfig((p) => ({ ...p, port: v === "" ? undefined : Number(v) }))}
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

          {/* ── ABA IA (provedores pessoais) ── */}
          {!isNew && currentUser?.id === Number(id) && (
            <Tabs.Panel value="ia">
              <Stack gap="20px">

                <Alert color="blue" radius="xl" variant="light" icon={<IconInfoCircle size={16} />}>
                  <Text fz="sm">
                    Configure aqui seu <strong>provedor de IA pessoal</strong>. Quando preenchido,
                    suas gerações de conteúdo usam <strong>sua própria chave</strong> (maior prioridade).
                    Sem configuração pessoal, o sistema usa a chave da empresa ou de Configurações.
                  </Text>
                </Alert>

                {aiKeyMessage && (
                  <Alert color={aiKeyMessageType === "success" ? "green" : "red"}
                    icon={aiKeyMessageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />}
                    radius="xl">
                    {aiKeyMessage}
                  </Alert>
                )}

                <AIProvidersPanel
                  activeProvider={aiActiveProvider}
                  providerKeys={aiProviderKeys}
                  onActiveProviderChange={setAiActiveProvider}
                  onProviderKeyChange={(provider, value) =>
                    setAiProviderKeys((p) => ({ ...p, [provider]: value }))
                  }
                />

                <Group justify="flex-end" mt="8px">
                  <Button radius="xl" size="md" variant="gradient"
                    gradient={{ from: "violet", to: "blue" }}
                    leftSection={<IconKey size={16} />}
                    loading={savingAiKey} onClick={handleSaveAiProviders}>
                    Salvar configurações de IA
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
