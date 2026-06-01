/**
 * CertificatePreview — exibe o certificado na tela (inline) após aprovação
 * e oferece botão para baixar em PDF.
 */
import { Button, Group, Loader, Stack, Text } from "@mantine/core";
import { IconDownload, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import {
  getCertificateTemplate,
  type CertificateTemplate,
} from "../../services/trailLearnerService";

import {
  buildTagValues,
  replaceTags,
  type CertificateProps,
} from "./certificateUtils";

interface Props extends CertificateProps {
  onClose?: () => void;
}

export default function CertificatePreview({
  type,
  title,
  description,
  recipientName,
  date,
  companyName = "",
  ismName = "",
  nota,
  tempoTotalSegundos = 0,
  iniciadoEm,
  concluidoEm,
  onClose,
}: Props) {

  const [tmpl, setTmpl] = useState<CertificateTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const dateStr = date || new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const props: CertificateProps = {
    type, title, description, recipientName, date,
    companyName, ismName, nota, tempoTotalSegundos, iniciadoEm, concluidoEm,
  };

  const tagValues = buildTagValues(props, dateStr);

  useEffect(() => {
    getCertificateTemplate()
      .then(setTmpl)
      .catch(() => setTmpl({}))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload() {
    if (!tmpl) return;
    setDownloading(true);
    try {
      const color = tmpl.primaryColor || "#7c3aed";
      const typeLabel = type === "card" ? "documento" : "trilha de treinamento";
      const notaStr = tagValues.nota;
      const processedAdditional = tmpl.additionalContent
        ? replaceTags(tmpl.additionalContent, tagValues).replace(/\n/g, "<br/>")
        : "";

      const html = `
        <div style="font-family:'Georgia',serif;padding:60px;max-width:900px;margin:0 auto;
                    background:#fff;border:3px solid ${color};border-radius:16px;text-align:center;">
          ${tmpl.logoBase64
            ? `<img src="${tmpl.logoBase64}" style="max-height:80px;max-width:200px;margin-bottom:24px;display:block;margin-left:auto;margin-right:auto;" />`
            : ""}
          <div style="color:${color};font-size:11px;letter-spacing:4px;text-transform:uppercase;margin-bottom:8px;">Certificado de Conclusão</div>
          <div style="width:60px;height:2px;background:${color};margin:0 auto 32px;"></div>
          <div style="color:#374151;font-size:14px;margin-bottom:12px;">Certificamos que</div>
          <div style="color:#111827;font-size:30px;font-weight:bold;margin-bottom:12px;">${recipientName}</div>
          <div style="color:#374151;font-size:14px;margin-bottom:8px;">concluiu com êxito o ${typeLabel}</div>
          <div style="color:${color};font-size:20px;font-weight:bold;margin-bottom:12px;">"${title}"</div>
          ${description ? `<div style="color:#6b7280;font-size:12px;max-width:500px;margin:0 auto 20px;line-height:1.7;">${description}</div>` : ""}
          ${notaStr ? `<div style="color:#374151;font-size:13px;margin-bottom:12px;">Nota obtida: <strong style="color:${color}">${notaStr}</strong></div>` : ""}
          ${processedAdditional ? `<div style="color:#6b7280;font-size:12px;max-width:560px;margin:0 auto 24px;line-height:1.8;background:#f9f9ff;padding:12px 16px;border-radius:8px;border-left:3px solid ${color};">${processedAdditional}</div>` : ""}
          <div style="color:#9ca3af;font-size:12px;margin-bottom:40px;">${dateStr}</div>
          ${tmpl.signatureName ? `<div style="display:inline-block;margin-top:32px;"><div style="width:160px;height:1px;background:#d1d5db;margin-bottom:8px;"></div><div style="color:#374151;font-size:12px;font-weight:bold;">${tmpl.signatureName}</div>${tmpl.signatureTitle ? `<div style="color:#9ca3af;font-size:11px;">${tmpl.signatureTitle}</div>` : ""}</div>` : ""}
          <div style="margin-top:40px;color:${color};font-size:10px;letter-spacing:2px;">UDoc — Sistema de Onboarding</div>
        </div>`;

      const html2pdf = (await import("html2pdf.js")).default;
      const el = document.createElement("div");
      el.innerHTML = html;
      document.body.appendChild(el);
      await html2pdf().set({
        margin: 10,
        filename: `certificado_${type}_${title.replace(/\s+/g, "_").toLowerCase()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      }).from(el).save();
      document.body.removeChild(el);
    } finally {
      setDownloading(false);
    }
  }

  const color = tmpl?.primaryColor || "#7c3aed";
  const processedAdditional = (tmpl?.additionalContent && !loading)
    ? replaceTags(tmpl.additionalContent, tagValues)
    : "";

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Loader size="md" color="violet" />
      </div>
    );
  }

  return (
    <Stack gap="lg">

      {/* ── Certificado visual inline ── */}
      <div style={{
        background: "#ffffff",
        border: `3px solid ${color}`,
        borderRadius: 20,
        padding: "48px 56px",
        textAlign: "center",
        fontFamily: "Georgia, 'Times New Roman', serif",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        position: "relative",
        maxWidth: 740,
        margin: "0 auto",
        width: "100%",
      }}>

        {/* Fechar (opcional) */}
        {onClose && (
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none", cursor: "pointer",
            color: "#9ca3af", fontSize: 18,
          }}>✕</button>
        )}

        {/* Logo */}
        {tmpl?.logoBase64 && (
          <img src={tmpl.logoBase64} alt="logo"
            style={{ maxHeight: 72, maxWidth: 180, marginBottom: 24, display: "block", marginLeft: "auto", marginRight: "auto" }} />
        )}

        {/* Subtítulo */}
        <div style={{ color, fontSize: 10, letterSpacing: 4, textTransform: "uppercase", marginBottom: 8, fontFamily: "Arial, sans-serif" }}>
          Certificado de Conclusão
        </div>

        {/* Linha decorativa */}
        <div style={{ width: 56, height: 2, background: color, margin: "0 auto 28px" }} />

        {/* "Certificamos que" */}
        <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 10, fontFamily: "Arial, sans-serif" }}>
          Certificamos que
        </div>

        {/* Nome do aluno */}
        <div style={{ color: "#111827", fontSize: 28, fontWeight: "bold", marginBottom: 12, lineHeight: 1.2 }}>
          {recipientName}
        </div>

        {/* "concluiu..." */}
        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 8, fontFamily: "Arial, sans-serif" }}>
          concluiu com êxito o {type === "card" ? "documento" : "trilha de treinamento"}
        </div>

        {/* Título */}
        <div style={{ color, fontSize: 19, fontWeight: "bold", marginBottom: 12 }}>
          "{title}"
        </div>

        {/* Descrição */}
        {description && (
          <div style={{ color: "#6b7280", fontSize: 12, maxWidth: 480, margin: "0 auto 16px", lineHeight: 1.7, fontFamily: "Arial, sans-serif" }}>
            {description}
          </div>
        )}

        {/* Nota */}
        {tagValues.nota && (
          <div style={{ color: "#374151", fontSize: 13, marginBottom: 12, fontFamily: "Arial, sans-serif" }}>
            Nota obtida:{" "}
            <strong style={{ color }}>{tagValues.nota}</strong>
          </div>
        )}

        {/* Texto adicional (com tags substituídas) */}
        {processedAdditional && (
          <div style={{
            color: "#4b5563",
            fontSize: 12,
            maxWidth: 520,
            margin: "0 auto 20px",
            lineHeight: 1.8,
            background: "#f9f7ff",
            padding: "12px 16px",
            borderRadius: 8,
            borderLeft: `3px solid ${color}`,
            textAlign: "left",
            fontFamily: "Arial, sans-serif",
            whiteSpace: "pre-wrap",
          }}>
            {processedAdditional}
          </div>
        )}

        {/* Data */}
        <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 36, fontFamily: "Arial, sans-serif" }}>
          {dateStr}
        </div>

        {/* Assinatura */}
        {tmpl?.signatureName && (
          <div style={{ display: "inline-block" }}>
            <div style={{ width: 150, height: 1, background: "#d1d5db", marginBottom: 8 }} />
            <div style={{ color: "#374151", fontSize: 12, fontWeight: "bold", fontFamily: "Arial, sans-serif" }}>
              {tmpl.signatureName}
            </div>
            {tmpl.signatureTitle && (
              <div style={{ color: "#9ca3af", fontSize: 11, fontFamily: "Arial, sans-serif" }}>
                {tmpl.signatureTitle}
              </div>
            )}
          </div>
        )}

        {/* Rodapé */}
        <div style={{ marginTop: 32, color, fontSize: 9, letterSpacing: 2, fontFamily: "Arial, sans-serif" }}>
          UDoc — Sistema de Onboarding
        </div>

        {/* Bordas decorativas dos cantos */}
        {[
          { top: 8, left: 8 },
          { top: 8, right: 8 },
          { bottom: 8, left: 8 },
          { bottom: 8, right: 8 },
        ].map((pos, i) => (
          <div key={i} style={{
            position: "absolute", width: 20, height: 20,
            border: `2px solid ${color}`, borderRadius: 2,
            opacity: 0.4, ...pos,
          }} />
        ))}
      </div>

      {/* ── Botão de download ── */}
      <Group justify="center">
        <Button
          leftSection={<IconDownload size={16} />}
          variant="gradient"
          gradient={{ from: "green", to: "teal" }}
          radius="xl"
          size="md"
          loading={downloading}
          onClick={handleDownload}
        >
          Baixar certificado em PDF
        </Button>
      </Group>

    </Stack>
  );
}
