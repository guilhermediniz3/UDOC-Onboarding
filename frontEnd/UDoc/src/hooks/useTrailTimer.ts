/**
 * useTrailTimer — controla o tempo de sessão numa trilha.
 *
 * - Conta segundos enquanto o usuário está ativo na página
 * - Detecta inatividade (5 min sem mouse/scroll/tecla/clique) → pausa
 * - Salva no backend a cada 30s (background silencioso)
 * - Salva via fetch keepalive no beforeunload
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { addTrailTime } from "../services/trailLearnerService";

const INACTIVITY_MS = 5 * 60 * 1000;  // 5 minutos
const SAVE_INTERVAL_MS = 30 * 1000;   // 30 segundos
const ACTIVITY_EVENTS = ["mousemove", "scroll", "keydown", "click", "touchstart"] as const;

interface UseTrailTimerOptions {
  trailId: number;
  initialSeconds?: number;
  enabled?: boolean;  // false enquanto o progresso ainda está carregando
}

interface UseTrailTimerReturn {
  elapsedSeconds: number;    // total acumulado incluindo esta sessão
  sessionSeconds: number;    // tempo desta sessão (desde que abriu a página)
  isRunning: boolean;
  isInactive: boolean;       // parado por inatividade
  resume: () => void;        // retomar manualmente (clique no banner)
}

export function useTrailTimer({
  trailId,
  initialSeconds = 0,
  enabled = true,
}: UseTrailTimerOptions): UseTrailTimerReturn {

  // Segundos desta sessão (não inclui tempo anterior)
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isInactive, setIsInactive] = useState(false);

  // Referências para não recapturar em closures
  const sessionRef = useRef(0);          // espelho de sessionSeconds
  const savedRef = useRef(0);            // quanto já foi salvo desta sessão
  const inactivityTimer = useRef<ReturnType<typeof setTimeout>>();
  const saveTimer = useRef<ReturnType<typeof setInterval>>();
  const tickTimer = useRef<ReturnType<typeof setInterval>>();
  const runningRef = useRef(true);

  // ── Salva no backend os segundos não-salvos desta sessão ──────────────────
  const saveToBackend = useCallback(async (force = false) => {
    const pending = sessionRef.current - savedRef.current;
    if (pending <= 0 && !force) return;
    try {
      await addTrailTime(trailId, pending);
      savedRef.current = sessionRef.current;
    } catch {
      /* falha silenciosa — será tentado na próxima janela de 30s */
    }
  }, [trailId]);

  // ── Tick de 1 segundo ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    function startTick() {
      clearInterval(tickTimer.current);
      tickTimer.current = setInterval(() => {
        if (!runningRef.current) return;
        sessionRef.current += 1;
        setSessionSeconds(sessionRef.current);
      }, 1000);
    }

    startTick();
    return () => clearInterval(tickTimer.current);
  }, [enabled]);

  // ── Auto-save a cada 30s ──────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    saveTimer.current = setInterval(() => saveToBackend(), SAVE_INTERVAL_MS);
    return () => clearInterval(saveTimer.current);
  }, [enabled, saveToBackend]);

  // ── Detecção de inatividade ───────────────────────────────────────────────
  const resetInactivity = useCallback(() => {
    // Se estava inativo, retoma
    if (!runningRef.current) {
      runningRef.current = true;
      setIsRunning(true);
      setIsInactive(false);
    }

    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      runningRef.current = false;
      setIsRunning(false);
      setIsInactive(true);
    }, INACTIVITY_MS);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, resetInactivity, { passive: true })
    );
    resetInactivity(); // inicia o timer de inatividade

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetInactivity));
      clearTimeout(inactivityTimer.current);
    };
  }, [enabled, resetInactivity]);

  // ── beforeunload: salva via fetch keepalive (funciona ao fechar aba) ──────
  useEffect(() => {
    if (!enabled) return;

    function handleBeforeUnload() {
      const pending = sessionRef.current - savedRef.current;
      if (pending <= 0) return;

      const token = localStorage.getItem("udoc-token");
      // keepalive: garante que o request termina mesmo após a página fechar
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8081"}/my-trails/${trailId}/time`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ additionalSeconds: pending }),
        keepalive: true,
      }).catch(() => {});
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled, trailId]);

  // ── Retomada manual (clique no banner de inatividade) ────────────────────
  const resume = useCallback(() => {
    runningRef.current = true;
    setIsRunning(true);
    setIsInactive(false);
    resetInactivity();
  }, [resetInactivity]);

  return {
    elapsedSeconds: initialSeconds + sessionSeconds,
    sessionSeconds,
    isRunning,
    isInactive,
    resume,
  };
}

// ── Helpers de formatação de tempo ────────────────────────────────────────────

export function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}

export function getHours(s: number): number {
  return Math.floor(s / 3600);
}

export function getMinutes(s: number): number {
  return Math.floor((s % 3600) / 60);
}
