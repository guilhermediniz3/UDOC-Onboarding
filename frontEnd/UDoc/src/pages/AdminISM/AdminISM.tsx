import { Alert, Avatar, Badge, Button, Group, Paper, Select, Stack, Switch, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconCamera, IconCheck, IconInfoCircle, IconLink, IconUser, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { createIsm, getIsmById, updateIsm } from "../../services/ismService";
import api from "../../services/api";
import type { ISM } from "../../types/ISM";

interface UserOption { id: number; name: string; email: string; }

const EMPTY: ISM = { name: "", email: "", phone: "", active: true };

export default function AdminISM() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [ism, setIsm]           = useState<ISM>(EMPTY);
  const [ismUsers, setIsmUsers] = useState<UserOption[]>([]);
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const fileRef = useRef<HTMLInputElement>(null);

  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type); setMessage(text); setTimeout(() => setMessage(""), 3000);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b = ev.target?.result as string;
      setIsm((p) => ({ ...p, photo: b }));
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    // Carrega usuários com role ISM para o select de vinculação
    api.get<UserOption[]>("/users/by-role/ISM")
      .then((r) => setIsmUsers(r.data))
      .catch(() => {});

    if (!isNew) getIsmById(Number(id)).then(setIsm);
  }, [id]);

  async function handleSave() {
    if (!ism.name.trim()) { showMessage("error", "O nome do ISM é obrigatório."); return; }
    setSaving(true);
    try {
      const payload = {
        name: ism.name, email: ism.email, phone: ism.phone,
        photo: ism.photo, active: ism.active,
        userId: ism.userId ?? null,
      };
      if (isNew) {
        await createIsm(payload);
        showMessage("success", "ISM criado com sucesso!");
        setTimeout(() => navigate("/admin/ismsAdmin"), 1200);
      } else {
        await updateIsm(Number(id), payload);
        showMessage("success", "ISM atualizado com sucesso!");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showMessage("error", error?.response?.data?.message || "Erro ao salvar o ISM.");
    } finally { setSaving(false); }
  }

  const inputStyles = {
    input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
    label: { color: "var(--text-primary)", marginBottom: 6 },
    description: { color: "var(--text-secondary)" },
  };

  const linkedUser = ismUsers.find((u) => u.id === ism.userId);

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} c="var(--text-primary)">{isNew ? "Novo ISM" : "Editar ISM"}</Title>
            <Text c="var(--text-secondary)" mt={4}>{isNew ? "Preencha os dados para criar um novo ISM" : "Altere os dados do ISM"}</Text>
          </div>
          <Button leftSection={<IconArrowLeft size={18} />} variant="default" radius="xl" size="md"
            onClick={() => navigate("/admin/ismsAdmin")}>
            Voltar
          </Button>
        </Group>
      </Paper>

      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Stack gap="20px">
          {message && (
            <Alert color={messageType === "success" ? "green" : "red"}
              icon={messageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />}
              radius="xl">
              {message}
            </Alert>
          )}

          <Group align="flex-end" gap="lg">
            <div style={{ position: "relative", width: 90, height: 90 }}>
              <Avatar src={ism.photo || null} radius="50%" size={90}
                style={{ border: "3px solid rgba(139,92,246,0.6)", cursor: "pointer" }}
                onClick={() => fileRef.current?.click()}>
                {!ism.photo && <IconUser size={38} />}
              </Avatar>
              <div onClick={() => fileRef.current?.click()}
                style={{ position: "absolute", bottom: 0, right: 0, background: "rgba(139,92,246,0.9)", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <IconCamera size={13} color="white" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            </div>
            <Stack gap={2}>
              <Text fw={600} c="var(--text-primary)" fz="sm">Foto do ISM</Text>
              <Text c="var(--text-secondary)" fz="xs">Clique para selecionar</Text>
            </Stack>
          </Group>

          <TextInput
            label="Nome" placeholder="Nome do ISM" required
            radius="xl" size="md" value={ism.name}
            onChange={(e) => { const v = e.currentTarget.value; setIsm((p) => ({ ...p, name: v })); }}
            styles={inputStyles}
          />
          <TextInput
            label="E-mail" placeholder="ism@empresa.com"
            radius="xl" size="md" value={ism.email}
            onChange={(e) => { const v = e.currentTarget.value; setIsm((p) => ({ ...p, email: v })); }}
            styles={inputStyles}
          />
          <TextInput
            label="Telefone" placeholder="(00) 00000-0000"
            radius="xl" size="md" value={ism.phone}
            onChange={(e) => { const v = e.currentTarget.value; setIsm((p) => ({ ...p, phone: v })); }}
            styles={inputStyles}
          />

          {/* Vínculo com conta de usuário — ESSENCIAL para o chat funcionar */}
          <Stack gap="6px">
            <Group gap="xs" align="center">
              <IconLink size={16} color="var(--mantine-color-violet-5)" />
              <Text fz="sm" fw={600} c="var(--text-primary)">Conta de acesso vinculada</Text>
              {ism.userId ? (
                <Badge color="green" variant="dot" size="sm">Vinculada</Badge>
              ) : (
                <Tooltip
                  label="Sem vínculo: o ISM não conseguirá ver as conversas no chat. Selecione a conta de login do ISM."
                  withArrow multiline w={300} color="orange"
                >
                  <Badge color="orange" variant="dot" size="sm" style={{ cursor: "help" }}>
                    Não vinculada
                  </Badge>
                </Tooltip>
              )}
            </Group>
            <Text fz="xs" c="var(--text-secondary)">
              Selecione qual conta de login (role ISM) corresponde a este cadastro de ISM.
              Sem este vínculo, o chat não funciona corretamente.
            </Text>
            <Select
              placeholder="Selecione a conta de login do ISM..."
              clearable searchable
              radius="xl" size="md"
              data={ismUsers.map((u) => ({
                value: String(u.id),
                label: `${u.name} — ${u.email}`,
              }))}
              value={ism.userId ? String(ism.userId) : null}
              onChange={(v) => setIsm((p) => ({ ...p, userId: v ? Number(v) : undefined }))}
              styles={inputStyles}
            />
            {linkedUser && (
              <Text fz="xs" c="green">
                Vinculado a: {linkedUser.name} ({linkedUser.email})
              </Text>
            )}
          </Stack>

          <Alert color="blue" radius="xl" variant="light" icon={<IconInfoCircle size={15} />}>
            <Text fz="xs">
              O <strong>E-mail</strong> acima é o contato/cadastro do ISM.
              A <strong>Conta de acesso</strong> é o login que o ISM usa para entrar no sistema.
              Ambos podem ser iguais ou diferentes.
            </Text>
          </Alert>

          <Group>
            <Switch
              label={ism.active ? "Ativo" : "Inativo"}
              checked={ism.active}
              onChange={(e) => { const c = e.currentTarget.checked; setIsm((p) => ({ ...p, active: c })); }}
              size="md" color="violet"
              styles={{ label: { color: "var(--text-primary)", cursor: "pointer" } }}
            />
          </Group>

          <Group justify="flex-end" mt="10px">
            <Button variant="default" radius="xl" size="md" onClick={() => navigate("/admin/ismsAdmin")}>
              Cancelar
            </Button>
            <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }}
              loading={saving} onClick={handleSave}>
              {isNew ? "Criar ISM" : "Salvar Alterações"}
            </Button>
          </Group>
        </Stack>
      </Paper>

    </Stack>
  );
}
