import http from "k6/http";
import { sleep, check, group } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// ── Métricas customizadas ────────────────────────────────────────────
const latenciaLogin    = new Trend("latencia_login",    true);
const latenciaUsers    = new Trend("latencia_users",    true);
const latenciaCatalog  = new Trend("latencia_catalog",  true);
const latenciaDash     = new Trend("latencia_dashboard", true);
const latenciaTrails   = new Trend("latencia_trails",   true);
const latenciaEmployees= new Trend("latencia_employees", true);
const taxaErros        = new Rate("taxa_erros");
const totalRequests    = new Counter("total_requests");

// ── Cenário de carga progressiva ────────────────────────────────────
export const options = {
  stages: [
    { duration: "15s", target: 10  },  // aquecimento: sobe para 10 usuários
    { duration: "30s", target: 30  },  // carga moderada: 30 usuários
    { duration: "30s", target: 60  },  // pico: 60 usuários simultâneos
    { duration: "15s", target: 0   },  // resfriamento
  ],
  thresholds: {
    http_req_failed:    ["rate<0.05"],          // menos de 5% de erro
    http_req_duration:  ["p(95)<2000"],         // 95% das req abaixo de 2s
    latencia_catalog:   ["p(95)<3000"],
    latencia_dashboard: ["p(95)<3000"],
  },
};

const BASE = "http://localhost:8081";

// ── Setup: faz login uma vez e retorna o token ───────────────────────
export function setup() {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: "admin@admin.com", password: "admin1234" }),
    { headers: { "Content-Type": "application/json" } }
  );
  latenciaLogin.add(res.timings.duration);
  if (res.status !== 200) {
    console.error("Login falhou:", res.status, res.body);
    return { token: null };
  }
  const token = res.json("token");
  console.log(`Login OK — token obtido (${token.substring(0, 20)}...)`);
  return { token };
}

// ── Cenário principal ────────────────────────────────────────────────
export default function (data) {
  if (!data.token) return;

  const headers = {
    Authorization: `Bearer ${data.token}`,
    "Content-Type": "application/json",
  };

  group("Usuarios", () => {
    const r = http.get(`${BASE}/users?page=0&size=10`, { headers });
    latenciaUsers.add(r.timings.duration);
    totalRequests.add(1);
    const ok = check(r, {
      "users status 200": (r) => r.status === 200,
      "users tem conteudo": (r) => r.json("content") !== undefined,
    });
    taxaErros.add(!ok);
    sleep(0.3);
  });

  group("Catalogo de Trilhas", () => {
    const r = http.get(`${BASE}/catalog`, { headers });
    latenciaCatalog.add(r.timings.duration);
    totalRequests.add(1);
    const ok = check(r, {
      "catalog status 200": (r) => r.status === 200,
    });
    taxaErros.add(!ok);
    sleep(0.3);
  });

  group("Lista de Trilhas (admin)", () => {
    const r = http.get(`${BASE}/trails?page=0&size=10`, { headers });
    latenciaTrails.add(r.timings.duration);
    totalRequests.add(1);
    const ok = check(r, { "trails status 200": (r) => r.status === 200 });
    taxaErros.add(!ok);
    sleep(0.3);
  });

  group("Funcionarios", () => {
    const r = http.get(`${BASE}/employees?page=0&size=10`, { headers });
    latenciaEmployees.add(r.timings.duration);
    totalRequests.add(1);
    const ok = check(r, { "employees status 200": (r) => r.status === 200 });
    taxaErros.add(!ok);
    sleep(0.3);
  });

  group("Dashboard NPS", () => {
    const r = http.get(`${BASE}/nps/dashboard`, { headers });
    latenciaDash.add(r.timings.duration);
    totalRequests.add(1);
    const ok = check(r, { "dashboard status 200": (r) => r.status === 200 });
    taxaErros.add(!ok);
    sleep(0.5);
  });

  sleep(1);
}

// ── Relatório final ──────────────────────────────────────────────────
export function handleSummary(data) {
  const m = data.metrics;

  function p(metric, stat) {
    return metric ? (metric.values[stat] || 0).toFixed(0) + "ms" : "—";
  }
  function rate(metric) {
    return metric ? (metric.values.rate * 100).toFixed(1) + "%" : "—";
  }

  const report = `
╔══════════════════════════════════════════════════════════╗
║              UDOC — RELATÓRIO DE CARGA                  ║
╚══════════════════════════════════════════════════════════╝

Requisições totais : ${m.total_requests?.values?.count ?? "—"}
Taxa de erro       : ${rate(m.taxa_erros)}
Duração req (p95)  : ${p(m.http_req_duration, "p(95)")}

LATÊNCIA POR ENDPOINT (mediana / p95 / máximo)
──────────────────────────────────────────────
Usuários     : ${p(m.latencia_users,"med")} / ${p(m.latencia_users,"p(95)")} / ${p(m.latencia_users,"max")}
Catálogo     : ${p(m.latencia_catalog,"med")} / ${p(m.latencia_catalog,"p(95)")} / ${p(m.latencia_catalog,"max")}
Trilhas      : ${p(m.latencia_trails,"med")} / ${p(m.latencia_trails,"p(95)")} / ${p(m.latencia_trails,"max")}
Funcionários : ${p(m.latencia_employees,"med")} / ${p(m.latencia_employees,"p(95)")} / ${p(m.latencia_employees,"max")}
Dashboard    : ${p(m.latencia_dashboard,"med")} / ${p(m.latencia_dashboard,"p(95)")} / ${p(m.latencia_dashboard,"max")}

THRESHOLDS
──────────────────────────────────────────────
Erros < 5%      : ${(m.http_req_failed?.values?.rate ?? 0) < 0.05 ? "✓ PASSOU" : "✗ FALHOU"}
p95 geral < 2s  : ${(m.http_req_duration?.values["p(95)"] ?? 9999) < 2000 ? "✓ PASSOU" : "✗ FALHOU"}
p95 catalog < 3s: ${(m.latencia_catalog?.values["p(95)"] ?? 9999) < 3000 ? "✓ PASSOU" : "✗ FALHOU"}
p95 dashboard<3s: ${(m.latencia_dashboard?.values["p(95)"] ?? 9999) < 3000 ? "✓ PASSOU" : "✗ FALHOU"}
`;

  console.log(report);
  return {
    stdout: report,
    "c:/DOC/load-test/resultado.txt": report,
  };
}
