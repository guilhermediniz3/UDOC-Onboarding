import http from "k6/http";
import { sleep, check } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

const erros      = new Rate("taxa_erros");
const latencia   = new Trend("latencia_geral", true);
const timeouts   = new Counter("timeouts");

// Stress test: sobe até 400 VUs para encontrar o ponto de quebra
export const options = {
  stages: [
    { duration: "20s", target: 50  },
    { duration: "20s", target: 100 },
    { duration: "20s", target: 200 },
    { duration: "20s", target: 300 },
    { duration: "20s", target: 400 },
    { duration: "20s", target: 0   },
  ],
  thresholds: {
    http_req_failed:   ["rate<0.10"],   // alerta se passar de 10% de erro
    http_req_duration: ["p(95)<5000"],  // alerta se p95 passar de 5s
  },
};

const BASE = "http://localhost:8081";

export function setup() {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: "admin@admin.com", password: "admin1234" }),
    { headers: { "Content-Type": "application/json" } }
  );
  return { token: res.json("token") };
}

export default function (data) {
  if (!data.token) return;
  const headers = { Authorization: `Bearer ${data.token}` };

  // Rotaciona entre os endpoints mais pesados
  const endpoints = [
    `${BASE}/users?page=0&size=10`,
    `${BASE}/catalog`,
    `${BASE}/employees?page=0&size=10`,
    `${BASE}/nps/dashboard`,
    `${BASE}/trails?page=0&size=10`,
  ];

  const url = endpoints[Math.floor(Math.random() * endpoints.length)];
  const r   = http.get(url, { headers, timeout: "10s" });

  latencia.add(r.timings.duration);

  const ok = check(r, {
    "status 2xx": (r) => r.status >= 200 && r.status < 300,
  });

  if (r.timings.duration >= 9000) timeouts.add(1);
  erros.add(!ok);

  sleep(0.5);
}

export function handleSummary(data) {
  const m   = data.metrics;
  const p   = (metric, s) => metric ? (metric.values[s] || 0).toFixed(0) + "ms" : "—";
  const pct = (metric)    => metric ? (metric.values.rate * 100).toFixed(2) + "%" : "—";

  const report = `
╔══════════════════════════════════════════════════════════╗
║           UDOC — STRESS TEST (até 400 VUs)              ║
╚══════════════════════════════════════════════════════════╝

Total de requisições : ${m.http_reqs?.values?.count ?? "—"}
Taxa de erro         : ${pct(m.taxa_erros)}
Timeouts (>9s)       : ${m.timeouts?.values?.count ?? 0}

LATÊNCIA GERAL
──────────────────────────────────────────────
Mediana : ${p(m.latencia_geral, "med")}
p90     : ${p(m.latencia_geral, "p(90)")}
p95     : ${p(m.latencia_geral, "p(95)")}
p99     : ${p(m.latencia_geral, "p(99)")}
Máximo  : ${p(m.latencia_geral, "max")}

http_req_duration (k6 nativo)
Mediana : ${p(m.http_req_duration, "med")}
p95     : ${p(m.http_req_duration, "p(95)")}
p99     : ${p(m.http_req_duration, "p(99)")}
Máximo  : ${p(m.http_req_duration, "max")}

THRESHOLDS
──────────────────────────────────────────────
Erros < 10%    : ${(m.http_req_failed?.values?.rate ?? 0) < 0.10 ? "✓ PASSOU" : "✗ FALHOU"}
p95 < 5s       : ${(m.http_req_duration?.values["p(95)"] ?? 9999) < 5000 ? "✓ PASSOU" : "✗ FALHOU"}
`;

  console.log(report);
  return {
    stdout: report,
    "c:/DOC/load-test/resultado_stress.txt": report,
  };
}
