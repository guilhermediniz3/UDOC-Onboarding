/**
 * CertificatePreview — exibe o certificado em formato paisagem (inline)
 * após aprovação e oferece botão para baixar em PDF.
 */
import { Button, Group, Loader } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
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

      // HTML dimensionado para A4 landscape (297mm × 210mm)
      const html = `
        <div style="
          font-family:'Georgia',serif;
          width:277mm; height:190mm;
          padding:16mm 22mm;
          background:#fff;
          border:3px solid ${color};
          border-radius:8px;
          box-sizing:border-box;
          position:relative;
          display:flex;
          flex-direction:column;
          justify-content:space-between;
          text-align:center;
        ">

          <!-- cantos decorativos -->
          <div style="position:absolute;top:8px;left:8px;width:18px;height:18px;border-top:2px solid ${color};border-left:2px solid ${color};opacity:.45;"></div>
          <div style="position:absolute;top:8px;right:8px;width:18px;height:18px;border-top:2px solid ${color};border-right:2px solid ${color};opacity:.45;"></div>
          <div style="position:absolute;bottom:8px;left:8px;width:18px;height:18px;border-bottom:2px solid ${color};border-left:2px solid ${color};opacity:.45;"></div>
          <div style="position:absolute;bottom:8px;right:8px;width:18px;height:18px;border-bottom:2px solid ${color};border-right:2px solid ${color};opacity:.45;"></div>

          <!-- topo: logo + label -->
          <div>
            ${tmpl.logoBase64
              ? `<img src="${tmpl.logoBase64}" style="max-height:48px;max-width:160px;display:block;margin:0 auto 10px;" />`
              : ""}
            <div style="color:${color};font-size:9px;letter-spacing:5px;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:6px;">Certificado de Conclusão</div>
            <div style="width:50px;height:2px;background:${color};margin:0 auto;"></div>
          </div>

          <!-- corpo principal -->
          <div>
            <div style="color:#6b7280;font-size:11px;font-family:Arial,sans-serif;margin-bottom:6px;">Certificamos que</div>
            <div style="color:#111827;font-size:26px;font-weight:bold;margin-bottom:8px;line-height:1.2;">${recipientName || "—"}</div>
            <div style="color:#6b7280;font-size:11px;font-family:Arial,sans-serif;margin-bottom:6px;">concluiu com êxito o ${typeLabel}</div>
            <div style="color:${color};font-size:17px;font-weight:bold;margin-bottom:8px;">"${title}"</div>
            ${description ? `<div style="color:#6b7280;font-size:10px;max-width:480px;margin:0 auto 8px;line-height:1.6;font-family:Arial,sans-serif;">${description}</div>` : ""}
            ${notaStr ? `<div style="color:#374151;font-size:11px;font-family:Arial,sans-serif;margin-bottom:4px;">Nota obtida: <strong style="color:${color};">${notaStr}</strong></div>` : ""}
            ${processedAdditional ? `<div style="color:#4b5563;font-size:10px;max-width:500px;margin:8px auto 0;line-height:1.7;background:#f9f7ff;padding:8px 14px;border-radius:6px;border-left:2px solid ${color};text-align:left;font-family:Arial,sans-serif;">${processedAdditional}</div>` : ""}
          </div>

          <!-- rodapé: data + assinatura -->
          <div style="display:flex;justify-content:space-between;align-items:flex-end;">
            <div style="color:#9ca3af;font-size:10px;font-family:Arial,sans-serif;text-align:left;">
              <div style="color:${color};font-size:8px;letter-spacing:2px;margin-bottom:4px;">UDoc — Sistema de Onboarding</div>
              ${dateStr}
            </div>
            ${tmpl.signatureName ? `
            <div style="text-align:center;">
              <div style="width:140px;height:1px;background:#d1d5db;margin-bottom:6px;"></div>
              <div style="color:#374151;font-size:11px;font-weight:bold;font-family:Arial,sans-serif;">${tmpl.signatureName}</div>
              ${tmpl.signatureTitle ? `<div style="color:#9ca3af;font-size:9px;font-family:Arial,sans-serif;">${tmpl.signatureTitle}</div>` : ""}
            </div>` : ""}
          </div>

        </div>`;

      const html2pdf = (await import("html2pdf.js")).default;
      const el = document.createElement("div");
      el.innerHTML = html;
      document.body.appendChild(el);
      await html2pdf().set({
        margin: [5, 10],
        filename: `certificado_${title.replace(/\s+/g, "_").toLowerCase()}.pdf`,
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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Certificado em paisagem ── */}
      <div style={{
        /* Proporção A4 landscape: 297 / 210 ≈ 1.414 */
        aspectRatio: "297 / 210",
        width: "100%",
        maxWidth: 920,
        margin: "0 auto",
        background: "#ffffff",
        border: `3px solid ${color}`,
        borderRadius: 14,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        fontFamily: "Georgia, 'Times New Roman', serif",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center",
        padding: "36px 60px 30px",
        boxSizing: "border-box" as const,
      }}>

        {/* Fechar (opcional) */}
        {onClose && (
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14,
            background: "none", border: "none", cursor: "pointer",
            color: "#9ca3af", fontSize: 18, lineHeight: 1,
          }}>✕</button>
        )}

        {/* Cantos decorativos */}
        {([
          { top: 8, left: 8, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
          { top: 8, right: 8, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` },
          { bottom: 8, left: 8, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` },
          { bottom: 8, right: 8, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` },
        ] as React.CSSProperties[]).map((s, i) => (
          <div key={i} style={{ position: "absolute", width: 18, height: 18, opacity: 0.45, ...s }} />
        ))}

        {/* ── TOPO: logo + label ── */}
        <div style={{ width: "100%" }}>
          {tmpl?.logoBase64 && (
            <img src={tmpl.logoBase64} alt="logo" style={{
              maxHeight: 52, maxWidth: 160, display: "block",
              margin: "0 auto 10px",
            }} />
          )}
          <div style={{
            color, fontSize: 9, letterSpacing: 5,
            textTransform: "uppercase", fontFamily: "Arial, sans-serif", marginBottom: 7,
          }}>
            Certificado de Conclusão
          </div>
          <div style={{ width: 48, height: 2, background: color, margin: "0 auto" }} />
        </div>

        {/* ── CENTRO: conteúdo principal ── */}
        <div style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <div style={{ color: "#6b7280", fontSize: 12, fontFamily: "Arial, sans-serif" }}>
            Certificamos que
          </div>

          <div style={{ color: "#111827", fontSize: 28, fontWeight: "bold", lineHeight: 1.15 }}>
            {recipientName || "—"}
          </div>

          <div style={{ color: "#6b7280", fontSize: 12, fontFamily: "Arial, sans-serif" }}>
            concluiu com êxito o {type === "card" ? "documento" : "trilha de treinamento"}
          </div>

          <div style={{ color, fontSize: 18, fontWeight: "bold" }}>
            "{title}"
          </div>

          {description && (
            <div style={{
              color: "#6b7280", fontSize: 11,
              maxWidth: 520, margin: "0 auto",
              lineHeight: 1.65, fontFamily: "Arial, sans-serif",
            }}>
              {description}
            </div>
          )}

          {tagValues.nota && (
            <div style={{ color: "#374151", fontSize: 12, fontFamily: "Arial, sans-serif" }}>
              Nota obtida: <strong style={{ color }}>{tagValues.nota}</strong>
            </div>
          )}

          {processedAdditional && (
            <div style={{
              color: "#4b5563", fontSize: 11,
              maxWidth: 560, margin: "4px auto 0",
              lineHeight: 1.75, background: "#f9f7ff",
              padding: "10px 16px", borderRadius: 7,
              borderLeft: `3px solid ${color}`,
              textAlign: "left", fontFamily: "Arial, sans-serif",
              whiteSpace: "pre-wrap",
            }}>
              {processedAdditional}
            </div>
          )}
        </div>

        {/* ── RODAPÉ: data à esquerda, assinatura à direita ── */}
        <div style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ color, fontSize: 8, letterSpacing: 2, fontFamily: "Arial, sans-serif", marginBottom: 3 }}>
              UDoc — Sistema de Onboarding
            </div>
            <div style={{ color: "#9ca3af", fontSize: 11, fontFamily: "Arial, sans-serif" }}>
              {dateStr}
            </div>
          </div>

          {tmpl?.signatureName && (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 140, height: 1, background: "#d1d5db", marginBottom: 6 }} />
              <div style={{ color: "#374151", fontSize: 11, fontWeight: "bold", fontFamily: "Arial, sans-serif" }}>
                {tmpl.signatureName}
              </div>
              {tmpl.signatureTitle && (
                <div style={{ color: "#9ca3af", fontSize: 10, fontFamily: "Arial, sans-serif" }}>
                  {tmpl.signatureTitle}
                </div>
              )}
            </div>
          )}
        </div>
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

    </div>
  );
}
