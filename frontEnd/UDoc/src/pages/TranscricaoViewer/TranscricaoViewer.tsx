import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronUp,
  IconDownload,
  IconEye,
  IconFileText,
  IconSearch,
  IconX,
} from "@tabler/icons-react";

import { getRatById } from "../../services/ratService";
import {
  listarTranscricaoPorSessao,
  registrarAcessoTranscricao,
} from "../../services/transcricaoService";
import type { Rat } from "../../types/Rat";
import type { TranscricaoTrecho } from "../../types/TranscricaoTrecho";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(sec)}`;
  return `${pad(m)}:${pad(sec)}`;
}

function fmtOffset(ts: string, firstTs: string): string {
  return fmtMs(new Date(ts).getTime() - new Date(firstTs).getTime());
}

function highlightText(text: string, query: string): ReactNode {
  if (!query.trim()) return text;
  const esc = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${esc})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            style={{
              background: "#f59f00",
              color: "#111",
              borderRadius: 2,
              padding: "0 1px",
            }}
          >
            {p}
          </mark>
        ) : (
          p
        )
      )}
    </>
  );
}

/* ── flat item types ─────────────────────────────────────────────────────── */

type FlatItem =
  | { type: "header"; label: string; ts: string }
  | { type: "trecho"; trecho: TranscricaoTrecho; matchIdx: number | null };

/* ── custom virtual list hook ────────────────────────────────────────────── */

const EST_H = 76;
const OVERSCAN = 4;

function useVirtual(count: number) {
  const heights = useRef<number[]>([]);
  const offsets = useRef<number[]>([0]);
  const [, setTick] = useState(0);

  if (heights.current.length !== count) {
    const prev = heights.current;
    const nh = Array(count).fill(EST_H) as number[];
    for (let i = 0; i < Math.min(prev.length, count); i++) nh[i] = prev[i];
    heights.current = nh;
    const no = new Array(count + 1) as number[];
    no[0] = 0;
    for (let i = 0; i < count; i++) no[i + 1] = no[i] + nh[i];
    offsets.current = no;
  }

  const getRange = useCallback(
    (scrollTop: number, viewportH: number) => {
      const off = offsets.current;
      const lo = scrollTop - OVERSCAN * EST_H;
      const hi = scrollTop + viewportH + OVERSCAN * EST_H;
      let start = 0;
      while (start < count - 1 && off[start + 1] <= lo) start++;
      let end = start;
      while (end < count && off[end] < hi) end++;
      return { start: Math.max(0, start), end: Math.min(count, end) };
    },
    [count]
  );

  const measure = useCallback(
    (index: number, h: number) => {
      if (index >= count || Math.abs(heights.current[index] - h) <= 1) return;
      heights.current[index] = h;
      const off = offsets.current;
      for (let i = index; i < count; i++) off[i + 1] = off[i] + heights.current[i];
      setTick((t) => t + 1);
    },
    [count]
  );

  const offsetOf = useCallback((idx: number) => offsets.current[idx] ?? 0, []);

  return { totalHeight: offsets.current[count] ?? 0, getRange, measure, offsetOf };
}

/* ── VirtualRow ──────────────────────────────────────────────────────────── */

interface VirtualRowProps {
  item: FlatItem;
  top: number;
  firstTs: string;
  searchQuery: string;
  isCurrentMatch: boolean;
  onMeasure: (h: number) => void;
}

function VirtualRow({ item, top, firstTs, searchQuery, isCurrentMatch, onMeasure }: VirtualRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onMeasure);
  useEffect(() => { cbRef.current = onMeasure; });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    cbRef.current(el.offsetHeight);
    const obs = new ResizeObserver(() => cbRef.current(el.offsetHeight));
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} style={{ position: "absolute", top, left: 0, right: 0 }}>
      {item.type === "header" ? (
        <div style={{ padding: "12px 20px 4px" }}>
          <Group gap="xs" align="center">
            <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
            <Text
              fz="xs"
              fw={600}
              c="var(--text-secondary)"
              style={{ whiteSpace: "nowrap", userSelect: "none" }}
            >
              {item.label}
            </Text>
            <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
          </Group>
        </div>
      ) : (
        <div
          style={{
            padding: "8px 20px",
            background: isCurrentMatch ? "rgba(124,58,237,0.12)" : undefined,
            transition: "background 0.15s",
          }}
        >
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <Group gap="12px" align="flex-start" wrap="nowrap">
              <Text
                fz="xs"
                c="var(--text-secondary)"
                style={{
                  whiteSpace: "nowrap",
                  minWidth: 42,
                  paddingTop: 3,
                  fontFamily: "monospace",
                }}
              >
                {fmtOffset(item.trecho.timestamp, firstTs)}
              </Text>
              <Text
                fz="sm"
                c="var(--text-primary)"
                style={{ flex: 1, lineHeight: 1.65, wordBreak: "break-word" }}
              >
                {highlightText(item.trecho.texto, searchQuery)}
              </Text>
            </Group>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────────────── */

export default function TranscricaoViewer() {
  const { ratId } = useParams<{ ratId: string }>();
  const navigate = useNavigate();

  const [rat, setRat] = useState<Rat | null>(null);
  const [trechos, setTrechos] = useState<TranscricaoTrecho[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [matchIdx, setMatchIdx] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(600);

  /* ── flat items ─────────────────────────────────────────────────────── */
  const { flatItems, matches } = useMemo(() => {
    if (!trechos.length) return { flatItems: [] as FlatItem[], matches: [] as number[] };
    const q = search.toLowerCase().trim();
    const items: FlatItem[] = [];
    const mList: number[] = [];
    let mCounter = 0;
    let lastBucket = -1;
    const firstTs = trechos[0].timestamp;

    for (const trecho of trechos) {
      const offsetMs =
        new Date(trecho.timestamp).getTime() - new Date(firstTs).getTime();
      const bucket = Math.floor(offsetMs / (5 * 60 * 1000));

      if (bucket !== lastBucket) {
        lastBucket = bucket;
        const s0 = bucket * 5;
        const s1 = s0 + 5;
        const label = `${pad(Math.floor(s0 / 60))}:${pad(s0 % 60)} – ${pad(Math.floor(s1 / 60))}:${pad(s1 % 60)}`;
        items.push({ type: "header", label, ts: trecho.timestamp });
      }

      const isMatch = q !== "" && trecho.texto.toLowerCase().includes(q);
      const mIdx = isMatch ? mCounter++ : null;
      if (isMatch) mList.push(items.length);
      items.push({ type: "trecho", trecho, matchIdx: mIdx });
    }

    return { flatItems: items, matches: mList };
  }, [trechos, search]);

  const virtual = useVirtual(flatItems.length);
  const { start, end } = virtual.getRange(scrollTop, viewportH);

  /* ── scroll to flat index ───────────────────────────────────────────── */
  const scrollToIdx = useCallback(
    (idx: number) => {
      if (scrollRef.current)
        scrollRef.current.scrollTop = Math.max(0, virtual.offsetOf(idx) - 8);
    },
    [virtual.offsetOf]
  );

  /* ── scroll to match ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (matches.length > 0 && matches[matchIdx] !== undefined)
      scrollToIdx(matches[matchIdx]);
  }, [matchIdx, matches, scrollToIdx]);

  function goMatch(delta: number) {
    if (!matches.length) return;
    setMatchIdx(
      (prev) => ((prev + delta) % matches.length + matches.length) % matches.length
    );
  }

  /* ── time markers ────────────────────────────────────────────────────── */
  const timeMarkers = useMemo(() => {
    if (!trechos.length) return [] as { label: string; offsetMs: number }[];
    const firstTs = new Date(trechos[0].timestamp).getTime();
    const lastTs = new Date(trechos[trechos.length - 1].timestamp).getTime();
    const markers: { label: string; offsetMs: number }[] = [];
    for (let t = 0; firstTs + t <= lastTs; t += 15 * 60 * 1000)
      markers.push({ label: fmtMs(t), offsetMs: t });
    return markers;
  }, [trechos]);

  function scrollToTime(targetMs: number) {
    if (!trechos.length) return;
    const firstTs = new Date(trechos[0].timestamp).getTime();
    let idx = 0;
    for (let i = 0; i < flatItems.length; i++) {
      const item = flatItems[i];
      if (item.type === "header") {
        if (new Date(item.ts).getTime() - firstTs <= targetMs) idx = i;
      }
    }
    scrollToIdx(idx);
  }

  /* ── position indicator ──────────────────────────────────────────────── */
  const posLabel = useMemo(() => {
    if (trechos.length < 2) return null;
    const firstTs = new Date(trechos[0].timestamp).getTime();
    const lastTs = new Date(trechos[trechos.length - 1].timestamp).getTime();
    const total = lastTs - firstTs;
    const { start: s } = virtual.getRange(scrollTop, viewportH);
    for (let i = s; i < Math.min(s + 15, flatItems.length); i++) {
      const item = flatItems[i];
      if (item.type === "trecho") {
        const cur = new Date(item.trecho.timestamp).getTime() - firstTs;
        return `${fmtMs(cur)} de ${fmtMs(total)}`;
      }
    }
    return null;
  }, [scrollTop, viewportH, flatItems, trechos, virtual.getRange]);

  /* ── downloads ───────────────────────────────────────────────────────── */
  function dlTxt() {
    if (!trechos.length) return;
    const firstTs = trechos[0].timestamp;
    const header = rat
      ? `Transcrição — ${rat.trainingRoomTitle ?? ""} — ${new Date(rat.dataCriacao).toLocaleDateString("pt-BR")}\n\n`
      : "";
    const lines = trechos
      .map((t) => `[${fmtOffset(t.timestamp, firstTs)}] ${t.texto}`)
      .join("\n");
    const blob = new Blob([header + lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcricao-rat-${ratId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    if (rat?.sessaoId)
      registrarAcessoTranscricao(rat.sessaoId, Number(ratId), "DOWNLOAD_TXT").catch(() => {});
  }

  async function dlPdf() {
    if (!trechos.length) return;
    const html2pdf = (await import("html2pdf.js")).default;
    const firstTs = trechos[0].timestamp;
    const rows = trechos
      .map(
        (t) =>
          `<tr><td style="color:#555;white-space:nowrap;padding-right:12px;vertical-align:top;font-size:12px">[${fmtOffset(t.timestamp, firstTs)}]</td>` +
          `<td style="padding-bottom:4px;font-size:13px">${t.texto}</td></tr>`
      )
      .join("");
    const meta = rat
      ? `<h2 style="margin-bottom:4px">${rat.trainingRoomTitle ?? "Transcrição"}</h2>` +
        `<p style="color:#555;margin-bottom:16px">Empresa: ${rat.companyName ?? "—"} | ISM: ${rat.ismName ?? "—"} | Data: ${new Date(rat.dataCriacao).toLocaleDateString("pt-BR")}</p>`
      : "<h2>Transcrição</h2>";
    const el = document.createElement("div");
    el.style.cssText = "font-family:Arial,sans-serif;padding:20px;background:#fff;color:#111;";
    el.innerHTML = `<style>*{color:#111!important}</style>${meta}<table style="width:100%;border-collapse:collapse">${rows}</table>`;
    await html2pdf()
      .set({
        margin: [15, 15, 15, 15],
        filename: `transcricao-rat-${ratId}.pdf`,
        html2canvas: { scale: 2, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(el)
      .save();
    if (rat?.sessaoId)
      registrarAcessoTranscricao(rat.sessaoId, Number(ratId), "DOWNLOAD_PDF").catch(() => {});
  }

  /* ── load data ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!ratId) return;
    (async () => {
      try {
        const r = await getRatById(Number(ratId));
        setRat(r);
        if (r.sessaoId) {
          const tr = await listarTranscricaoPorSessao(r.sessaoId);
          tr.sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setTrechos(tr);
          registrarAcessoTranscricao(r.sessaoId, Number(ratId), "VIEW").catch(() => {});
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    })();
  }, [ratId]);

  /* ── measure viewport ────────────────────────────────────────────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setViewportH(el.clientHeight);
    const obs = new ResizeObserver(() => setViewportH(el.clientHeight));
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  /* ── render ──────────────────────────────────────────────────────────── */
  const firstTs = trechos[0]?.timestamp ?? "";
  const totalMs =
    trechos.length >= 2
      ? new Date(trechos[trechos.length - 1].timestamp).getTime() -
        new Date(trechos[0].timestamp).getTime()
      : 0;

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--app-bg)",
          zIndex: 200,
        }}
      >
        <Loader color="violet" size="lg" />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--app-bg)",
        zIndex: 200,
      }}
    >
      {/* ── header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          background: "var(--card-bg)",
          borderBottom: "1px solid var(--border-color)",
          boxShadow: "0 2px 8px var(--shadow-color)",
        }}
      >
        <Stack gap={0} px="20px">
          {/* row 1: back + title + meta + position */}
          <Group py="12px" justify="space-between" align="flex-start" wrap="nowrap">
            <Group gap="10px" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
              <ActionIcon
                variant="subtle"
                color="violet"
                radius="xl"
                size="lg"
                onClick={() => navigate(-1)}
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <div style={{ minWidth: 0 }}>
                <Title order={4} c="var(--text-primary)" style={{ lineHeight: 1.2 }}>
                  Transcrição da sessão
                </Title>
                <Group gap={6} mt={3} wrap="wrap">
                  {rat?.trainingRoomTitle && (
                    <Badge size="xs" variant="light" color="violet" radius="xl">
                      {rat.trainingRoomTitle}
                    </Badge>
                  )}
                  {rat?.companyName && (
                    <Badge size="xs" variant="light" color="blue" radius="xl">
                      {rat.companyName}
                    </Badge>
                  )}
                  {rat?.ismName && (
                    <Badge size="xs" variant="light" color="teal" radius="xl">
                      {rat.ismName}
                    </Badge>
                  )}
                  {rat?.dataCriacao && (
                    <Text fz="xs" c="var(--text-secondary)">
                      {new Date(rat.dataCriacao).toLocaleDateString("pt-BR")}
                    </Text>
                  )}
                  {totalMs > 0 && (
                    <Text fz="xs" c="var(--text-secondary)">
                      · {fmtMs(totalMs)}
                    </Text>
                  )}
                </Group>
              </div>
            </Group>
            {posLabel && (
              <Text
                fz="sm"
                c="var(--text-secondary)"
                style={{ whiteSpace: "nowrap", paddingTop: 6 }}
              >
                {posLabel}
              </Text>
            )}
          </Group>

          {/* row 2: search + downloads */}
          <Group pb="10px" gap="sm" wrap="wrap">
            <Group gap={6} style={{ flex: 1, minWidth: 200 }}>
              <TextInput
                placeholder="Buscar na transcrição…"
                size="sm"
                radius="xl"
                style={{ maxWidth: 280 }}
                leftSection={<IconSearch size={14} />}
                rightSection={
                  search ? (
                    <ActionIcon
                      size="xs"
                      variant="transparent"
                      onClick={() => {
                        setSearch("");
                        setMatchIdx(0);
                      }}
                    >
                      <IconX size={12} />
                    </ActionIcon>
                  ) : null
                }
                value={search}
                onChange={(e) => {
                  setSearch(e.currentTarget.value);
                  setMatchIdx(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.shiftKey ? goMatch(-1) : goMatch(1);
                  }
                }}
                styles={{
                  input: {
                    background: "var(--input-bg)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  },
                }}
              />
              {search && (
                <Group gap={4}>
                  <Text fz="xs" c="var(--text-secondary)" style={{ whiteSpace: "nowrap" }}>
                    {matches.length
                      ? `${matchIdx + 1} de ${matches.length}`
                      : "Sem resultados"}
                  </Text>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="violet"
                    onClick={() => goMatch(-1)}
                    disabled={!matches.length}
                  >
                    <IconChevronUp size={12} />
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="violet"
                    onClick={() => goMatch(1)}
                    disabled={!matches.length}
                  >
                    <IconChevronDown size={12} />
                  </ActionIcon>
                </Group>
              )}
            </Group>
            <Group gap={6}>
              <Button
                size="xs"
                radius="xl"
                variant="light"
                color="red"
                leftSection={<IconDownload size={12} />}
                onClick={dlPdf}
                disabled={!trechos.length}
              >
                PDF
              </Button>
              <Button
                size="xs"
                radius="xl"
                variant="light"
                color="blue"
                leftSection={<IconFileText size={12} />}
                onClick={dlTxt}
                disabled={!trechos.length}
              >
                TXT
              </Button>
            </Group>
          </Group>

          {/* row 3: time nav bar */}
          {timeMarkers.length > 1 && (
            <div
              style={{
                borderTop: "1px solid var(--border-color)",
                overflowX: "auto",
                overflowY: "hidden",
              }}
            >
              <Group gap={4} wrap="nowrap" py="6px">
                {timeMarkers.map((m) => (
                  <Button
                    key={m.offsetMs}
                    size="xs"
                    radius="xl"
                    variant="subtle"
                    color="violet"
                    style={{ whiteSpace: "nowrap", minWidth: 52 }}
                    onClick={() => scrollToTime(m.offsetMs)}
                  >
                    {m.label}
                  </Button>
                ))}
              </Group>
            </div>
          )}
        </Stack>
      </div>

      {/* ── body ───────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: "auto" }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        {error ? (
          <Stack align="center" justify="center" py="80px" gap="md">
            <Text c="red">{error}</Text>
            <Button variant="light" radius="xl" color="violet" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </Stack>
        ) : trechos.length === 0 ? (
          <Stack align="center" justify="center" py="80px">
            <IconEye size={48} style={{ opacity: 0.15 }} />
            <Text c="var(--text-secondary)">Nenhum trecho registrado nesta sessão.</Text>
          </Stack>
        ) : (
          <div style={{ position: "relative", height: virtual.totalHeight }}>
            {flatItems.slice(start, end).map((item, i) => {
              const absIdx = start + i;
              return (
                <VirtualRow
                  key={absIdx}
                  item={item}
                  top={virtual.offsetOf(absIdx)}
                  firstTs={firstTs}
                  searchQuery={search}
                  isCurrentMatch={
                    item.type === "trecho" &&
                    item.matchIdx !== null &&
                    item.matchIdx === matchIdx &&
                    search !== "" &&
                    matches.length > 0
                  }
                  onMeasure={(h) => virtual.measure(absIdx, h)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
