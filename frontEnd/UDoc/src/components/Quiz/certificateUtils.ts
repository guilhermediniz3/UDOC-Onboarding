/** Tipos e funções compartilhados entre CertificatePreview e CertificateGenerator */

export interface CertificateProps {
  type: "card" | "trail";
  title: string;
  description?: string;
  recipientName: string;
  date?: string;
  companyName?: string;
  ismName?: string;
  nota?: number | null;
  tempoTotalSegundos?: number;
  iniciadoEm?: string;
  concluidoEm?: string;
}

export interface TagValues {
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

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min`;
  return `${seconds}s`;
}

export function parseISODate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return ""; }
}

export function replaceTags(template: string, values: TagValues): string {
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

export function buildTagValues(props: CertificateProps, dateStr: string): TagValues {
  const totalSecs = props.tempoTotalSegundos || 0;
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const notaStr = props.nota != null
    ? props.nota.toFixed(1).replace(".", ",")
    : "";

  return {
    funcionario: props.recipientName || "",
    empresa: props.companyName || "",
    ism: props.ismName || "",
    trilha: props.title || "",
    data: dateStr,
    nota: notaStr,
    duracaoTotal: formatDuration(totalSecs),
    duracaoHoras: String(h),
    duracaoMinutos: String(m),
    dataInicio: parseISODate(props.iniciadoEm),
    dataConclusao: parseISODate(props.concluidoEm) || dateStr,
  };
}
