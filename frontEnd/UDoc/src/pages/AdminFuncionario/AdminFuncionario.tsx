import { Alert, Avatar, Badge, Button, Group, Paper, SegmentedControl, Select, Stack, Switch, Text, TextInput, Title } from "@mantine/core";
import { IconArrowLeft, IconCamera, IconCheck, IconUser, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { createEmployee, getEmployeeById, updateEmployee } from "../../services/employeeService";
import { getAllCompaniesSimple } from "../../services/companyService";
import type { Employee } from "../../types/Employee";
import type { Company } from "../../types/Company";

const EMPTY: Employee = { name: "", phone: "", email: "", companyId: 0, active: true, tipo: "EXTERNO" };

export default function AdminFuncionario() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [employee, setEmployee] = useState<Employee>(EMPTY);
  const [companies, setCompanies] = useState<Company[]>([]);
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
    reader.onload = (ev) => { const b = ev.target?.result as string; setEmployee((p) => ({ ...p, photo: b })); };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    getAllCompaniesSimple().then(setCompanies);
    if (!isNew) getEmployeeById(Number(id)).then(setEmployee);
  }, [id]);

  async function handleSave() {
    if (!employee.name.trim()) { showMessage("error", "O nome é obrigatório."); return; }
    if (!employee.companyId) { showMessage("error", "Selecione uma empresa."); return; }
    setSaving(true);
    try {
      const payload = {
        name: employee.name, phone: employee.phone, email: employee.email,
        photo: employee.photo, companyId: employee.companyId,
        active: employee.active, tipo: employee.tipo || "EXTERNO",
      };
      const tipoLabel = payload.tipo === "INTERNO" ? "interno" : "externo";
      if (isNew) {
        await createEmployee(payload);
        showMessage("success", `Funcionário ${tipoLabel} criado com sucesso!`);
        setTimeout(() => navigate("/admin/funcionarios"), 1200);
      } else {
        await updateEmployee(Number(id), payload);
        showMessage("success", "Funcionário atualizado com sucesso!");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showMessage("error", error?.response?.data?.message || "Erro ao salvar.");
    } finally { setSaving(false); }
  }

  const inputStyles = {
    input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
    label: { color: "var(--text-primary)", marginBottom: 6 },
  };
  const companyOptions = companies.map((c) => ({ value: String(c.id), label: c.name }));
  const tipo = employee.tipo || "EXTERNO";

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group justify="space-between" align="center">
          <div>
            <Group gap="sm" align="center">
              <Title order={2} c="var(--text-primary)">{isNew ? "Novo Funcionário" : "Editar Funcionário"}</Title>
              <Badge
                color={tipo === "INTERNO" ? "blue" : "violet"}
                variant="light" radius="xl"
              >
                {tipo === "INTERNO" ? "Interno" : "Externo"}
              </Badge>
            </Group>
            <Text c="var(--text-secondary)" mt={4}>
              {isNew ? "Preencha os dados do funcionário" : "Altere os dados do funcionário"}
            </Text>
          </div>
          <Button leftSection={<IconArrowLeft size={18} />} variant="default" radius="xl" size="md" onClick={() => navigate("/admin/funcionarios")}>Voltar</Button>
        </Group>
      </Paper>

      <Paper p="30px" radius="24px" style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Stack gap="20px">
          {message && <Alert color={messageType === "success" ? "green" : "red"} icon={messageType === "success" ? <IconCheck size={18} /> : <IconX size={18} />} radius="xl">{message}</Alert>}

          {/* Tipo de funcionário — seleção principal */}
          <Stack gap="6px">
            <Text fz="sm" fw={600} c="var(--text-primary)">Tipo de funcionário</Text>
            <Text fz="xs" c="var(--text-secondary)">
              Funcionário Externo = das empresas clientes • Funcionário Interno = da equipe que fornece o treinamento
            </Text>
            <SegmentedControl
              value={tipo}
              onChange={(v) => setEmployee((p) => ({ ...p, tipo: v as "EXTERNO" | "INTERNO" }))}
              data={[
                { label: "Externo", value: "EXTERNO" },
                { label: "Interno", value: "INTERNO" },
              ]}
              radius="xl"
              size="sm"
              w="fit-content"
              styles={{
                root: { background: "var(--app-bg)", border: "1px solid var(--border-color)" },
                label: { color: "var(--text-primary)", fontSize: 13, paddingLeft: 20, paddingRight: 20 },
              }}
            />
          </Stack>

          <Group align="flex-end" gap="lg">
            <div style={{ position: "relative", width: 90, height: 90 }}>
              <Avatar src={employee.photo || null} radius="50%" size={90} style={{ border: "3px solid rgba(139,92,246,0.6)", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
                {!employee.photo && <IconUser size={38} />}
              </Avatar>
              <div onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, background: "rgba(139,92,246,0.9)", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <IconCamera size={13} color="white" />
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            </div>
            <Stack gap={2}>
              <Text fw={600} c="var(--text-primary)" fz="sm">Foto do funcionário</Text>
              <Text c="var(--text-secondary)" fz="xs">Clique para selecionar</Text>
            </Stack>
          </Group>

          <TextInput label="Nome" placeholder="Nome do funcionário" required radius="xl" size="md" value={employee.name} onChange={(e) => { const v = e.currentTarget.value; setEmployee((p) => ({ ...p, name: v })); }} styles={inputStyles} />
          <TextInput label="Telefone" placeholder="(00) 00000-0000" radius="xl" size="md" value={employee.phone} onChange={(e) => { const v = e.currentTarget.value; setEmployee((p) => ({ ...p, phone: v })); }} styles={inputStyles} />
          <TextInput label="E-mail" placeholder="funcionario@empresa.com" radius="xl" size="md" value={employee.email} onChange={(e) => { const v = e.currentTarget.value; setEmployee((p) => ({ ...p, email: v })); }} styles={inputStyles} />
          <Select label="Empresa" placeholder="Selecione a empresa" required radius="xl" size="md" searchable data={companyOptions} value={employee.companyId ? String(employee.companyId) : null} onChange={(v) => setEmployee((p) => ({ ...p, companyId: Number(v) || 0 }))} styles={inputStyles} />

          <Group>
            <Switch label={employee.active ? "Ativo" : "Inativo"} checked={employee.active} onChange={(e) => { const c = e.currentTarget.checked; setEmployee((p) => ({ ...p, active: c })); }} size="md" color="violet" styles={{ label: { color: "var(--text-primary)", cursor: "pointer" } }} />
          </Group>

          <Group justify="flex-end" mt="10px">
            <Button variant="default" radius="xl" size="md" onClick={() => navigate("/admin/funcionarios")}>Cancelar</Button>
            <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }} loading={saving} onClick={handleSave}>
              {isNew ? "Criar Funcionário" : "Salvar Alterações"}
            </Button>
          </Group>
        </Stack>
      </Paper>

    </Stack>
  );
}
