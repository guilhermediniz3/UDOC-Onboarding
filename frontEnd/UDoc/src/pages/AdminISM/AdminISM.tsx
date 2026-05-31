import { Alert, Avatar, Button, Group, Paper, Stack, Switch, Text, TextInput, Title } from "@mantine/core";
import { IconArrowLeft, IconCamera, IconCheck, IconUser, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { createIsm, getIsmById, updateIsm } from "../../services/ismService";
import type { ISM } from "../../types/ISM";

const EMPTY: ISM = { name: "", email: "", phone: "", active: true };

export default function AdminISM() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [ism, setIsm] = useState<ISM>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const fileRef = useRef<HTMLInputElement>(null);

  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type); setMessage(text); setTimeout(() => setMessage(""), 3000);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const b = ev.target?.result as string; setIsm((p) => ({ ...p, photo: b })); };
    reader.readAsDataURL(file);
  }

  useEffect(() => { if (!isNew) getIsmById(Number(id)).then(setIsm); }, [id]);

  async function handleSave() {
    if (!ism.name.trim()) { showMessage("error", "O nome do ISM é obrigatório."); return; }
    setSaving(true);
    try {
      const payload = { name: ism.name, email: ism.email, phone: ism.phone, photo: ism.photo, active: ism.active, userId: ism.userId ?? null };
      if (isNew) { await createIsm(payload); showMessage("success", "ISM criado com sucesso!"); setTimeout(() => navigate("/admin/ismsAdmin"), 1200); }
      else { await updateIsm(Number(id), payload); showMessage("success", "ISM atualizado com sucesso!"); }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showMessage("error", error?.response?.data?.message || "Erro ao salvar o ISM.");
    } finally { setSaving(false); }
  }

  const inputStyles = { input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }, label: { color: "var(--text-primary)", marginBottom: 6 } };

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} c="var(--text-primary)">{isNew ? "Novo ISM" : "Editar ISM"}</Title>
            <Text c="var(--text-secondary)" mt={4}>{isNew ? "Preencha os dados para criar um novo ISM" : "Altere os dados do ISM"}</Text>
          </div>
          <Button leftSection={<IconArrowLeft size={18} />} variant="default" radius="xl" size="md" onClick={() => navigate("/admin/ismsAdmin")}>Voltar</Button>
        </Group>
      </Paper>

      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Stack gap="20px">
          {message && <Alert color={messageType === "success" ? "green" : "red"} icon={messageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />} radius="xl">{message}</Alert>}

          <Group align="flex-end" gap="lg">
            <div style={{ position: "relative", width: 90, height: 90 }}>
              <Avatar src={ism.photo || null} radius="50%" size={90} style={{ border: "3px solid rgba(139,92,246,0.6)", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
                {!ism.photo && <IconUser size={38} />}
              </Avatar>
              <div onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, background: "rgba(139,92,246,0.9)", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <IconCamera size={13} color="white" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            </div>
            <Stack gap={2}>
              <Text fw={600} c="var(--text-primary)" fz="sm">Foto do ISM</Text>
              <Text c="var(--text-secondary)" fz="xs">Clique para selecionar</Text>
            </Stack>
          </Group>

          <TextInput label="Nome" placeholder="Nome do ISM" required radius="xl" size="md" value={ism.name} onChange={(e) => { const v = e.currentTarget.value; setIsm((p) => ({ ...p, name: v })); }} styles={inputStyles} />
          <TextInput label="E-mail" placeholder="ism@empresa.com" radius="xl" size="md" value={ism.email} onChange={(e) => { const v = e.currentTarget.value; setIsm((p) => ({ ...p, email: v })); }} styles={inputStyles} />
          <TextInput label="Telefone" placeholder="(00) 00000-0000" radius="xl" size="md" value={ism.phone} onChange={(e) => { const v = e.currentTarget.value; setIsm((p) => ({ ...p, phone: v })); }} styles={inputStyles} />

          <Group>
            <Switch label={ism.active ? "Ativo" : "Inativo"} checked={ism.active} onChange={(e) => { const c = e.currentTarget.checked; setIsm((p) => ({ ...p, active: c })); }} size="md" color="violet" styles={{ label: { color: "var(--text-primary)", cursor: "pointer" } }} />
          </Group>

          <Group justify="flex-end" mt="10px">
            <Button variant="default" radius="xl" size="md" onClick={() => navigate("/admin/ismsAdmin")}>Cancelar</Button>
            <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }} loading={saving} onClick={handleSave}>{isNew ? "Criar ISM" : "Salvar Alterações"}</Button>
          </Group>
        </Stack>
      </Paper>

    </Stack>
  );
}
