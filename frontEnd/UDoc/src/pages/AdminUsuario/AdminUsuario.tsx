import { Alert, Avatar, Button, Divider, Group, Paper, PasswordInput, Select, Stack, Switch, Text, TextInput, Title } from "@mantine/core";
import { IconArrowLeft, IconCamera, IconCheck, IconKey, IconUser, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { changePassword, createUser, getUserById, updateUser, type UserData } from "../../services/userService";
import { useAuth } from "../../contexts/AuthContext";

const EMPTY: UserData = { name: "", email: "", photo: "", role: "ADMIN", active: true };

export default function AdminUsuario() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;
  const { user: currentUser, updateUser: updateAuthUser } = useAuth();

  const [userData, setUserData] = useState<UserData>(EMPTY);
  const [createPassword, setCreatePassword] = useState("");
  const [createConfirmPassword, setCreateConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState("");
  const [pwdMessageType, setPwdMessageType] = useState<"success" | "error">("success");

  const fileRef = useRef<HTMLInputElement>(null);

  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type); setMessage(text); setTimeout(() => setMessage(""), 3500);
  }
  function showPwdMessage(type: "success" | "error", text: string) {
    setPwdMessageType(type); setPwdMessage(text); setTimeout(() => setPwdMessage(""), 3500);
  }

  useEffect(() => { if (!isNew) getUserById(Number(id)).then(setUserData); }, [id]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const b = ev.target?.result as string; setUserData((p) => ({ ...p, photo: b })); };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!userData.name.trim()) { showMessage("error", "O nome é obrigatório."); return; }
    if (isNew) {
      if (!createPassword) { showMessage("error", "A senha é obrigatória."); return; }
      if (createPassword.length < 6) { showMessage("error", "A senha deve ter pelo menos 6 caracteres."); return; }
      if (createPassword !== createConfirmPassword) { showMessage("error", "As senhas não conferem."); return; }
    }
    setSaving(true);
    try {
      const payload = { name: userData.name, email: userData.email, photo: userData.photo || undefined, role: userData.role, active: userData.active, password: isNew ? createPassword : undefined };
      if (isNew) { await createUser(payload); showMessage("success", "Usuário criado com sucesso!"); setTimeout(() => navigate("/admin/usuarios"), 1200); }
      else {
        const updated = await updateUser(Number(id), payload);
        showMessage("success", "Usuário atualizado com sucesso!");
        if (currentUser?.id === Number(id)) updateAuthUser({ ...currentUser, name: updated.name, photo: updated.photo });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showMessage("error", error?.response?.data?.message || "Erro ao salvar.");
    } finally { setSaving(false); }
  }

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

  const inputStyles = { input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }, label: { color: "var(--text-primary)", marginBottom: 6 } };

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} c="var(--text-primary)">{isNew ? "Novo Usuário" : "Editar Usuário"}</Title>
            <Text c="var(--text-secondary)" mt={4}>{isNew ? "Preencha os dados para criar um novo usuário" : userData.email}</Text>
          </div>
          <Button leftSection={<IconArrowLeft size={18} />} variant="default" radius="xl" size="md" onClick={() => navigate("/admin/usuarios")}>Voltar</Button>
        </Group>
      </Paper>

      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Stack gap="24px">
          {message && <Alert color={messageType === "success" ? "green" : "red"} icon={messageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />} radius="xl">{message}</Alert>}

          <Group align="flex-end" gap="lg">
            <div style={{ position: "relative", width: 100, height: 100 }}>
              <Avatar src={userData.photo || null} radius="50%" size={100} style={{ border: "3px solid rgba(139,92,246,0.6)", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
                {!userData.photo && <IconUser size={44} />}
              </Avatar>
              <div onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, background: "rgba(139,92,246,0.9)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <IconCamera size={14} color="white" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            </div>
            <Stack gap={4}>
              <Text fw={600} c="var(--text-primary)" fz="sm">Foto de perfil</Text>
              <Text c="var(--text-secondary)" fz="xs">Clique na imagem para selecionar. PNG, JPG até 2 MB.</Text>
              {userData.photo && <Button size="xs" variant="subtle" color="red" p={0} onClick={() => setUserData((p) => ({ ...p, photo: "" }))}>Remover foto</Button>}
            </Stack>
          </Group>

          <TextInput label="Nome" placeholder="Nome completo" required radius="xl" size="md" value={userData.name} onChange={(e) => { const v = e.currentTarget.value; setUserData((p) => ({ ...p, name: v })); }} styles={inputStyles} />
          <TextInput label="E-mail" placeholder="email@exemplo.com" required radius="xl" size="md" value={userData.email} onChange={(e) => { const v = e.currentTarget.value; setUserData((p) => ({ ...p, email: v })); }} styles={inputStyles} />
          <Select label="Role" placeholder="Selecione a role" required radius="xl" size="md" value={userData.role} onChange={(v) => v && setUserData((p) => ({ ...p, role: v }))} data={[{ value: "ADMIN", label: "Admin" }, { value: "ISM", label: "ISM (Instrutor)" }, { value: "FUNCIONARIO_EXTERNO", label: "Funcionário Externo" }]} styles={inputStyles} />

          {isNew && (
            <>
              <Divider label="Senha de acesso" labelPosition="left" />
              <PasswordInput label="Senha" placeholder="Mínimo 6 caracteres" required radius="xl" size="md"
                value={createPassword} onChange={(e) => setCreatePassword(e.currentTarget.value)} styles={inputStyles} />
              <PasswordInput label="Confirmar senha" placeholder="Repita a senha" required radius="xl" size="md"
                value={createConfirmPassword} onChange={(e) => setCreateConfirmPassword(e.currentTarget.value)} styles={inputStyles} />
            </>
          )}

          <Group>
            <Switch label={userData.active ? "Ativo" : "Inativo"} checked={userData.active} onChange={(e) => { const c = e.currentTarget.checked; setUserData((p) => ({ ...p, active: c })); }} size="md" color="violet" styles={{ label: { color: "var(--text-primary)", cursor: "pointer" } }} />
          </Group>

          <Group justify="flex-end" mt="4px">
            <Button variant="default" radius="xl" size="md" onClick={() => navigate("/admin/usuarios")}>Cancelar</Button>
            <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }} loading={saving} onClick={handleSave}>{isNew ? "Criar Usuário" : "Salvar Alterações"}</Button>
          </Group>
        </Stack>
      </Paper>

      {!isNew && (
        <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
          <Stack gap="20px">
            <Group gap="sm">
              <IconKey size={20} color="var(--text-secondary)" />
              <Title order={4} c="var(--text-primary)">Trocar Senha</Title>
            </Group>
            <Divider />
            {pwdMessage && <Alert color={pwdMessageType === "success" ? "green" : "red"} icon={pwdMessageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />} radius="xl">{pwdMessage}</Alert>}
            <PasswordInput label="Nova senha" placeholder="Mínimo 6 caracteres" radius="xl" size="md" value={newPassword} onChange={(e) => setNewPassword(e.currentTarget.value)} styles={inputStyles} />
            <PasswordInput label="Confirmar nova senha" placeholder="Repita a senha" radius="xl" size="md" value={confirmPassword} onChange={(e) => setConfirmPassword(e.currentTarget.value)} styles={inputStyles} />
            <Group justify="flex-end">
              <Button radius="xl" size="md" color="violet" variant="light" leftSection={<IconKey size={16} />} loading={savingPwd} onClick={handleChangePassword}>Salvar nova senha</Button>
            </Group>
          </Stack>
        </Paper>
      )}

    </Stack>
  );
}
