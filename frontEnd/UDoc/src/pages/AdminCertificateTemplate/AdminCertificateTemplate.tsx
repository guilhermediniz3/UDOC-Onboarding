import {
  Alert,
  Badge,
  Button,
  ColorInput,
  Divider,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";

import {
  IconAt,
  IconBuilding,
  IconCertificate,
  IconCheck,
  IconChevronDown,
  IconId,
  IconRoute,
  IconSchool,
  IconStar,
  IconUser,
  IconX,
} from "@tabler/icons-react";

import { useEffect, useRef, useState } from "react";

import {
  getCertificateTemplate,
  saveCertificateTemplate,
  type CertificateTemplate,
} from "../../services/trailLearnerService";

/* ── Tags disponíveis ── */
const TAGS = [
  { tag: "@{funcionario}",    label: "Nome do funcionário",          Icon: IconUser     },
  { tag: "@{empresa}",        label: "Empresa do funcionário",       Icon: IconBuilding },
  { tag: "@{ism}",            label: "ISM responsável",              Icon: IconSchool   },
  { tag: "@{trilha}",         label: "Nome da trilha",               Icon: IconRoute    },
  { tag: "@{data}",           label: "Data de emissão",              Icon: IconId       },
  { tag: "@{nota}",           label: "Nota obtida",                  Icon: IconStar     },
  { tag: "@{duracaoTotal}",   label: "Duração total (ex: 4h 32min)", Icon: IconId       },
  { tag: "@{duracaoHoras}",   label: "Horas dedicadas (número)",     Icon: IconId       },
  { tag: "@{duracaoMinutos}", label: "Minutos restantes (número)",   Icon: IconId       },
  { tag: "@{dataInicio}",     label: "Data de início da trilha",     Icon: IconId       },
  { tag: "@{dataConclusao}",  label: "Data de conclusão",            Icon: IconId       },
];

/* ── Preview com tags destacadas ── */
function TagPreview({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(@\{[^}]+\})/g);
  return (
    <div style={{
      padding: "10px 16px",
      borderRadius: 12,
      background: "var(--app-bg)",
      border: "1px solid var(--border-color)",
      fontSize: 13,
      lineHeight: 1.8,
      color: "var(--text-secondary)",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}>
      {parts.map((part, i) =>
        /^@\{[^}]+\}$/.test(part)
          ? (
            <span key={i} style={{
              color: "#7c3aed",
              fontWeight: 700,
              background: "rgba(124,58,237,0.12)",
              padding: "1px 6px",
              borderRadius: 6,
              fontSize: 12,
            }}>
              {part}
            </span>
          )
          : <span key={i}>{part}</span>
      )}
    </div>
  );
}

/* ── Campo de texto com dropdown de tags ao digitar @ ── */
function TagTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [atPos, setAtPos] = useState(0);          // índice do @ no texto
  const [filter, setFilter] = useState("");        // texto digitado após @

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.currentTarget.value;
    const cursor = e.currentTarget.selectionStart ?? val.length;
    onChange(val);

    // Detecta se cursor está logo após um @ (e não após @{...})
    const textBefore = val.slice(0, cursor);
    const atMatch = textBefore.match(/@([a-z]*)$/);
    if (atMatch) {
      setAtPos(cursor - atMatch[0].length);   // posição do @
      setFilter(atMatch[1]);                  // letras após @
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setFilter("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") { setShowDropdown(false); }
  }

  function insertTag(tag: string) {
    const ta = taRef.current;
    if (!ta) return;

    const cursor = ta.selectionStart ?? value.length;
    const textBefore = value.slice(0, cursor);

    // Substitui o trecho "@filter" pelo tag completo
    const atMatch = textBefore.match(/@([a-z]*)$/);
    const replaceLen = atMatch ? atMatch[0].length : 0;
    const newVal =
      value.slice(0, cursor - replaceLen) +
      tag +
      value.slice(cursor);

    onChange(newVal);
    setShowDropdown(false);
    setFilter("");

    const newCursor = cursor - replaceLen + tag.length;
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(newCursor, newCursor);
    }, 0);
  }

  const filteredTags = TAGS.filter(
    (t) => filter === "" || t.tag.includes(filter) || t.label.toLowerCase().includes(filter)
  );

  return (
    <div style={{ position: "relative" }}>
      <textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={4}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid var(--border-color)",
          background: "var(--input-bg)",
          color: "var(--text-primary)",
          fontSize: 14,
          lineHeight: 1.7,
          resize: "vertical",
          outline: "none",
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#7c3aed";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border-color)";
          // Delay para permitir clique no dropdown
          setTimeout(() => setShowDropdown(false), 200);
        }}
      />

      {/* Dropdown de tags */}
      {showDropdown && filteredTags.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 200,
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
            borderRadius: 12,
            boxShadow: "0 8px 24px var(--shadow-color)",
            minWidth: 280,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "6px 12px", borderBottom: "1px solid var(--border-color)" }}>
            <Text fz="xs" c="var(--text-secondary)" fw={600} tt="uppercase">
              Inserir tag
            </Text>
          </div>
          {filteredTags.map((t) => (
            <div
              key={t.tag}
              onMouseDown={(e) => { e.preventDefault(); insertTag(t.tag); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px",
                cursor: "pointer",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <t.Icon size={14} color="#7c3aed" />
              <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>
                {t.tag}
              </span>
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                {t.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Página principal ── */
export default function AdminCertificateTemplate() {

  const [tmpl, setTmpl] = useState<CertificateTemplate>({ primaryColor: "#7c3aed" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");
  const logoRef = useRef<HTMLInputElement>(null);

  function showMsg(type: "success" | "error", text: string) {
    setMsgType(type); setMessage(text); setTimeout(() => setMessage(""), 3500);
  }

  useEffect(() => { getCertificateTemplate().then(setTmpl).catch(() => {}); }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setTmpl((p) => ({ ...p, logoBase64: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }

  function insertTagInField(tag: string) {
    setTmpl((p) => ({ ...p, additionalContent: (p.additionalContent || "") + tag }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveCertificateTemplate(tmpl);
      showMsg("success", "Template de certificado salvo com sucesso!");
    } catch { showMsg("error", "Erro ao salvar o template."); }
    finally { setSaving(false); }
  }

  const inputStyles = {
    input: { background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-primary)" },
    label: { color: "var(--text-primary)", marginBottom: 6 },
  };

  return (
    <Stack p="30px" gap="20px" bg="var(--app-bg)" mih="100vh">

      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Group gap="sm">
          <IconCertificate size={28} color="var(--mantine-color-violet-5)" />
          <div>
            <Title order={2} c="var(--text-primary)">Template de Certificado</Title>
            <Text c="var(--text-secondary)" mt={4}>
              Configure o visual do certificado. Use <Badge variant="light" color="violet" radius="xl" size="xs" style={{ fontFamily: "monospace" }}>@{"{tag}"}</Badge> para inserir dados dinâmicos.
            </Text>
          </div>
        </Group>
      </Paper>

      <Paper p="30px" radius="24px"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px var(--shadow-color)" }}>
        <Stack gap="24px">

          {message && <Alert color={msgType === "success" ? "green" : "red"}
            icon={msgType === "success" ? <IconCheck size={18} /> : <IconX size={18} />} radius="xl">
            {message}
          </Alert>}

          <Divider label="Identidade visual" labelPosition="left" />

          {/* Logo */}
          <Group align="flex-end" gap="lg">
            <div>
              <Text fz="sm" fw={500} c="var(--text-primary)" mb={6}>Logo da empresa</Text>
              {tmpl.logoBase64 && (
                <img src={tmpl.logoBase64} alt="logo"
                  style={{ maxHeight: 70, maxWidth: 200, borderRadius: 8, marginBottom: 8 }} />
              )}
              <Group gap="sm">
                <Button size="xs" radius="xl" variant="light" color="violet"
                  onClick={() => logoRef.current?.click()}>
                  {tmpl.logoBase64 ? "Trocar logo" : "Selecionar logo"}
                </Button>
                {tmpl.logoBase64 && (
                  <Button size="xs" radius="xl" variant="subtle" color="red"
                    onClick={() => setTmpl((p) => ({ ...p, logoBase64: undefined }))}>
                    Remover
                  </Button>
                )}
              </Group>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoChange} />
            </div>

            <ColorInput label="Cor principal" description="Cor dos títulos e bordas"
              value={tmpl.primaryColor || "#7c3aed"}
              onChange={(v) => setTmpl((p) => ({ ...p, primaryColor: v }))}
              radius="xl" size="sm" w={200} styles={inputStyles} />
          </Group>

          <Divider label="Assinatura" labelPosition="left" />

          <Group grow>
            <TextInput label="Nome do responsável" placeholder="Ex: João Silva" radius="xl" size="md"
              value={tmpl.signatureName || ""}
              onChange={(e) => { const v = e.currentTarget.value; setTmpl((p) => ({ ...p, signatureName: v })); }}
              styles={inputStyles} />
            <TextInput label="Cargo / Título" placeholder="Ex: Diretor de Treinamento" radius="xl" size="md"
              value={tmpl.signatureTitle || ""}
              onChange={(e) => { const v = e.currentTarget.value; setTmpl((p) => ({ ...p, signatureTitle: v })); }}
              styles={inputStyles} />
          </Group>

          <Divider label="Conteúdo adicional com tags dinâmicas" labelPosition="left" />

          {/* Referência rápida das tags */}
          <Group gap="sm" wrap="wrap">
            <Text fz="xs" c="var(--text-secondary)" fw={600}>Tags disponíveis:</Text>
            {TAGS.map((t) => (
              <Badge
                key={t.tag}
                variant="light"
                color="violet"
                radius="xl"
                size="sm"
                style={{ cursor: "pointer", fontFamily: "monospace" }}
                onClick={() => insertTagInField(t.tag)}
                title={t.label}
              >
                {t.tag}
              </Badge>
            ))}
          </Group>

          {/* Campo de texto com suporte a tags + botão inserir */}
          <Stack gap="8px">
            <Group justify="space-between" align="center">
              <Text fz="sm" fw={500} c="var(--text-primary)">
                Texto adicional
              </Text>
              <Menu shadow="md" radius="xl" width={280} position="bottom-end">
                <Menu.Target>
                  <Button
                    size="xs" radius="xl" variant="light" color="violet"
                    leftSection={<IconAt size={13} />}
                    rightSection={<IconChevronDown size={13} />}
                  >
                    Inserir tag
                  </Button>
                </Menu.Target>
                <Menu.Dropdown style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 16,
                }}>
                  <Menu.Label>Clique para inserir no campo</Menu.Label>
                  {TAGS.map((t) => (
                    <Menu.Item
                      key={t.tag}
                      leftSection={<t.Icon size={14} color="#7c3aed" />}
                      onClick={() => insertTagInField(t.tag)}
                    >
                      <Group gap="sm" align="center">
                        <span style={{ color: "#7c3aed", fontWeight: 700, fontFamily: "monospace", fontSize: 12 }}>
                          {t.tag}
                        </span>
                        <Text fz="xs" c="var(--text-secondary)">{t.label}</Text>
                      </Group>
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            </Group>

            {/* Textarea com detecção de @ */}
            <TagTextarea
              value={tmpl.additionalContent || ""}
              onChange={(v) => setTmpl((p) => ({ ...p, additionalContent: v }))}
              placeholder="Ex: A @{empresa} certifica que @{funcionario} concluiu a trilha @{trilha} com nota @{nota} em @{data}."
            />

            <Text fz="xs" c="var(--text-secondary)">
              Digite <strong>@</strong> para abrir o seletor de tags. Clique nas badges acima ou use o botão "Inserir tag".
            </Text>

            {/* Preview com tags destacadas */}
            {tmpl.additionalContent && (
              <Stack gap="4px">
                <Text fz="xs" c="var(--text-secondary)" fw={600}>Preview:</Text>
                <TagPreview text={tmpl.additionalContent} />
              </Stack>
            )}
          </Stack>

          <Alert color="blue" radius="xl" variant="light">
            <Text fz="sm">
              O certificado inclui automaticamente: <b>nome do aluno</b>, <b>título</b> e <b>descrição</b> do card/trilha e <b>data de emissão</b>.
              As tags acima permitem personalizar o texto adicional com dados do treinamento.
            </Text>
          </Alert>

          <Group justify="flex-end">
            <Button radius="xl" size="md" variant="gradient" gradient={{ from: "violet", to: "blue" }}
              loading={saving} onClick={handleSave}>
              Salvar template
            </Button>
          </Group>

        </Stack>
      </Paper>

    </Stack>
  );
}
