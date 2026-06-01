/**
 * CertificateGenerator — gera e baixa o certificado em PDF.
 * Usa o template configurado no sistema (logo, assinatura, cor, tags dinâmicas).
 */
import { Button } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { useState } from "react";

import {
  getCertificateTemplate,
  type CertificateTemplate,
} from "../../services/trailLearnerService";

interface Props {
  type: "card" | "trail";
  title: string;
  description?: string;
  recipientName: string;
  date?: string;
  // Dados dinâmicos para substituição de tags
  companyName?: string;
  ismName?: string;
  nota?: number | null;
  // Dados de tempo e datas
  tempoTotalSegundos?: number;
  iniciadoEm?: string;   // ISO datetime
  concluidoEm?: string;  // ISO datetime
}

/* ── Formata segundos em horas e minutos ── */
function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min`;
  return `${seconds}s`;
}

function parseISODate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return ""; }
}

/* ── Substitui @{tag} pelos valores reais ── */
function replaceTags(
  template: string,
  values: {
    funcionario: string;
    empresa: string;
    ism: string;
    trilha: string;
    data: string;
    nota: string;
    duracaoTotal: string;
    duracaoHoras: string;
    duracaoMinutos: string;
    dataInicio: string;
    dataConclusao: string;
  }
): string {
  return template
    .replace(/@\{funcionario\}/g, values.funcionario)
    .replace(/@\{empresa\}/g, values.empresa)
    .replace(/@\{ism\}/g, values.ism)
    .replace(/@\{trilha\}/g, values.trilha)
    .replace(/@\{data\}/g, values.data)
    .replace(/@\{nota\}/g, values.nota)
    .replace(/@\{duracaoTotal\}/g, values.duracaoTotal)
    .replace(/@\{duracaoHoras\}/g, values.duracaoHoras)
    .replace(/@\{duracaoMinutos\}/g, values.duracaoMinutos)
    .replace(/@\{dataInicio\}/g, values.dataInicio)
    .replace(/@\{dataConclusao\}/g, values.dataConclusao);
}

export default function CertificateGenerator({
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
}: Props) {

  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    try {
      const tmpl = await getCertificateTemplate().catch(() => ({} as CertificateTemplate));
      await generatePDF(tmpl);
    } finally {
      setGenerating(false);
    }
  }

  async function generatePDF(tmpl: CertificateTemplate) {
    const color = tmpl.primaryColor || "#7c3aed";
    const dateStr = date || new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });
    const typeLabel = type === "card" ? "documento" : "trilha de treinamento";
    const notaStr = nota != null
      ? nota.toFixed(1).replace(".", ",")
      : "";

    // Valores de tempo e datas
    const totalSecs = tempoTotalSegundos || 0;
    const horas = Math.floor(totalSecs / 3600);
    const minutos = Math.floor((totalSecs % 3600) / 60);

    // Valores para substituição de tags
    const tagValues = {
      funcionario: recipientName || "",
      empresa: companyName || "",
      ism: ismName || "",
      trilha: title || "",
      data: dateStr,
      nota: notaStr,
      duracaoTotal: formatDuration(totalSecs),
      duracaoHoras: String(horas),
      duracaoMinutos: String(minutos),
      dataInicio: parseISODate(iniciadoEm),
      dataConclusao: parseISODate(concluidoEm) || dateStr,
    };

    // Processa o texto adicional substituindo as tags
    const processedAdditional = tmpl.additionalContent
      ? replaceTags(tmpl.additionalContent, tagValues)
      : "";

    const html = `
      <div style="font-family:'Georgia',serif;padding:60px;max-width:900px;margin:0 auto;
                  background:#fff;border:3px solid ${color};border-radius:16px;text-align:center;">

        ${tmpl.logoBase64
          ? `<img src="${tmpl.logoBase64}"
               style="max-height:80px;max-width:200px;margin-bottom:24px;display:block;margin-left:auto;margin-right:auto;" />`
          : ""}

        <div style="color:${color};font-size:11px;letter-spacing:4px;
                    text-transform:uppercase;margin-bottom:8px;">
          Certificado de Conclusão
        </div>

        <div style="width:60px;height:2px;background:${color};margin:0 auto 32px;"></div>

        <div style="color:#374151;font-size:14px;margin-bottom:12px;">
          Certificamos que
        </div>

        <div style="color:#111827;font-size:30px;font-weight:bold;margin-bottom:12px;">
          ${recipientName}
        </div>

        <div style="color:#374151;font-size:14px;margin-bottom:8px;">
          concluiu com êxito o ${typeLabel}
        </div>

        <div style="color:${color};font-size:20px;font-weight:bold;margin-bottom:12px;">
          "${title}"
        </div>

        ${description
          ? `<div style="color:#6b7280;font-size:12px;max-width:500px;
                         margin:0 auto 20px;line-height:1.7;">
               ${description}
             </div>`
          : ""}

        ${notaStr
          ? `<div style="color:#374151;font-size:13px;margin-bottom:12px;">
               Nota obtida: <strong style="color:${color}">${notaStr}</strong>
             </div>`
          : ""}

        ${processedAdditional
          ? `<div style="color:#6b7280;font-size:12px;max-width:560px;
                         margin:0 auto 24px;line-height:1.8;
                         background:#f9f9ff;padding:12px 16px;
                         border-radius:8px;border-left:3px solid ${color};">
               ${processedAdditional.replace(/\n/g, "<br/>")}
             </div>`
          : ""}

        <div style="color:#9ca3af;font-size:12px;margin-bottom:40px;">
          ${dateStr}
        </div>

        ${tmpl.signatureName
          ? `<div style="display:inline-block;margin-top:32px;">
               <div style="width:160px;height:1px;background:#d1d5db;margin-bottom:8px;"></div>
               <div style="color:#374151;font-size:12px;font-weight:bold;">${tmpl.signatureName}</div>
               ${tmpl.signatureTitle
                 ? `<div style="color:#9ca3af;font-size:11px;">${tmpl.signatureTitle}</div>`
                 : ""}
             </div>`
          : ""}

        <div style="margin-top:40px;color:${color};font-size:10px;letter-spacing:2px;">
          UDoc — Sistema de Onboarding
        </div>
      </div>`;

    const html2pdf = (await import("html2pdf.js")).default;
    const el = document.createElement("div");
    el.innerHTML = html;
    document.body.appendChild(el);

    await html2pdf()
      .set({
        margin: 10,
        filename: `certificado_${type}_${title.replace(/\s+/g, "_").toLowerCase()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      })
      .from(el)
      .save();

    document.body.removeChild(el);
  }

  return (
    <Button
      leftSection={<IconDownload size={16} />}
      variant="gradient"
      gradient={{ from: "green", to: "teal" }}
      radius="xl"
      size="sm"
      loading={generating}
      onClick={handleDownload}
    >
      Baixar certificado
    </Button>
  );
}
