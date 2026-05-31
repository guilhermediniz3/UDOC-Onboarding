import { Alert, Button, Group, NumberInput, Paper, Stack, Switch, Text, TextInput, Title } from "@mantine/core";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { createCompany, getCompanyById, updateCompany } from "../../services/companyService";
import type { Company } from "../../types/Company";

const EMPTY: Company = { headquarters: 1, name: "", phone: "", cnpj: "", email: "", employeeCount: 0, active: true };

export default function AdminEmpresa() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [company, setCompany] = useState<Company>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  function showMessage(type: "success" | "error", text: string) {
    setMessageType(type); setMessage(text); setTimeout(() => setMessage(""), 3000);
  }

  useEffect(() => { if (!isNew) getCompanyById(Number(id)).then(setCompany); }, [id]);

  async function handleSave() {
    if (!company.name.trim()) { showMessage("error", "O nome da empresa é obrigatório."); return; }
    if (!company.cnpj.trim()) { showMessage("error", "O CNPJ é obrigatório."); return; }
    setSaving(true);
    try {
      const payload = { headquarters: company.headquarters, name: company.name, phone: company.phone, cnpj: company.cnpj, email: company.email, employeeCount: company.employeeCount, active: company.active };
      if (isNew) { await createCompany(payload); showMessage("success", "Empresa criada com sucesso!"); setTimeout(() => navigate("/admin/empresas"), 1200); }
      else { await updateCompany(Number(id), payload); showMessage("success", "Empresa atualizada com sucesso!"); }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showMessage("error", error?.response?.data?.message || "Erro ao salvar a empresa.");
    } finally { setSaving(false); }
  }

  const inputStyles = { input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }, label: { color: "var(--text-primary)", marginBottom: 6 } };

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} c="var(--text-primary)">{isNew ? "Nova Empresa" : "Editar Empresa"}</Title>
            <Text c="var(--text-secondary)" mt={4}>{isNew ? "Preencha os dados para criar uma nova empresa" : "Altere os dados da empresa"}</Text>
          </div>
          <Button leftSection={<IconArrowLeft size={18} />} variant="default" radius="xl" size="md" onClick={() => navigate("/admin/empresas")}>Voltar</Button>
        </Group>
      </Paper>

      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Stack gap="20px">
          {message && <Alert color={messageType === "success" ? "green" : "red"} icon={messageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />} radius="xl">{message}</Alert>}

          <NumberInput label="Matriz" placeholder="Número da matriz" required radius="xl" size="md" min={1} value={company.headquarters} onChange={(v) => setCompany((p) => ({ ...p, headquarters: Number(v) || 1 }))} styles={inputStyles} />
          <TextInput label="Nome" placeholder="Nome da empresa" required radius="xl" size="md" value={company.name} onChange={(e) => { const v = e.currentTarget.value; setCompany((p) => ({ ...p, name: v })); }} styles={inputStyles} />
          <TextInput label="CNPJ" placeholder="00.000.000/0000-00" required radius="xl" size="md" value={company.cnpj} onChange={(e) => { const v = e.currentTarget.value; setCompany((p) => ({ ...p, cnpj: v })); }} styles={inputStyles} />
          <TextInput label="Telefone" placeholder="(00) 00000-0000" radius="xl" size="md" value={company.phone} onChange={(e) => { const v = e.currentTarget.value; setCompany((p) => ({ ...p, phone: v })); }} styles={inputStyles} />
          <TextInput label="E-mail" placeholder="contato@empresa.com" radius="xl" size="md" value={company.email} onChange={(e) => { const v = e.currentTarget.value; setCompany((p) => ({ ...p, email: v })); }} styles={inputStyles} />
          <NumberInput label="Número de Funcionários" placeholder="Ex: 50" radius="xl" size="md" min={0} value={company.employeeCount} onChange={(v) => setCompany((p) => ({ ...p, employeeCount: Number(v) || 0 }))} styles={inputStyles} />

          <Group>
            <Switch label={company.active ? "Ativa" : "Inativa"} checked={company.active} onChange={(e) => { const c = e.currentTarget.checked; setCompany((p) => ({ ...p, active: c })); }} size="md" color="violet" styles={{ label: { color: "var(--text-primary)", cursor: "pointer" } }} />
          </Group>

          <Group justify="flex-end" mt="10px">
            <Button variant="default" radius="xl" size="md" onClick={() => navigate("/admin/empresas")}>Cancelar</Button>
            <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }} loading={saving} onClick={handleSave}>{isNew ? "Criar Empresa" : "Salvar Alterações"}</Button>
          </Group>
        </Stack>
      </Paper>

    </Stack>
  );
}
