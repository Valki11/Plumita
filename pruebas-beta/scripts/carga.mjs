import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, REPORTES, cookieDeSesion, guardar, redondear } from "./comun.mjs";

const USUARIO = process.env.USUARIO_LECTURA ?? "demo";
const CLAVE = process.env.CLAVE_LECTURA ?? "plumita123";
const LIMITE_MS = 2000;
const resumenK6 = join(REPORTES, ".k6-resumen.json");
rmSync(resumenK6, { force: true });

const cookie = await cookieDeSesion(USUARIO, CLAVE);
const carpeta = join(RAIZ, "pruebas-beta");

let salida = "";
try {
  salida = execFileSync(
    "docker",
    [
      "run", "--rm",
      "-e", "BASE_URL=http://host.docker.internal:3000",
      "-e", `COOKIE=${cookie}`,
      "-v", `${carpeta}:/pb`,
      "grafana/k6", "run",
      "--summary-export=/pb/reportes/.k6-resumen.json",
      "/pb/k6/carga.js",
    ],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] },
  );
} catch (error) {
  salida = `${error.stdout ?? ""}${error.stderr ?? ""}`;
  if (!existsSync(resumenK6)) throw new Error(`k6 no produjo resumen: ${salida.slice(-600)}`);
}

const resumen = JSON.parse(readFileSync(resumenK6, "utf8")).metrics;
const duracion = resumen.http_req_duration;
const fallidas = resumen.http_req_failed;
const solicitudes = resumen.http_reqs.count;
const errores = fallidas.value ?? 0;
const p95 = duracion["p(95)"];
const comprobaciones = resumen.checks;

guardar("carga.json", {
  herramienta: "k6 (imagen grafana/k6)",
  escenario: "Sesión iniciada una vez; 10 usuarios virtuales navegan inicio, alimentar e inventario durante 1 minuto, con 1 a 3 s entre pantallas. Solo lecturas.",
  sesion: `cookie obtenida con un solo inicio de sesión de la cuenta ${USUARIO}`,
  advertencia: "Mide esta laptop (CPU, memoria, Docker Desktop y lo demás que esté abierto). Sirve como línea base, no como garantía de un servidor.",
  solicitudes_totales: solicitudes,
  solicitudes_por_segundo: redondear(resumen.http_reqs.rate),
  duracion_ms: {
    promedio: redondear(duracion.avg),
    p50: redondear(duracion["p(50)"]),
    p90: redondear(duracion["p(90)"]),
    p95: redondear(p95),
    p99: redondear(duracion["p(99)"]),
    maximo: redondear(duracion.max),
  },
  errores_pct: redondear(errores * 100, 2),
  comprobaciones_pct: comprobaciones ? redondear(((comprobaciones.passes ?? 0) / Math.max(1, (comprobaciones.passes ?? 0) + (comprobaciones.fails ?? 0))) * 100, 2) : null,
  contra_rnf_02: {
    umbral_p95_ms: LIMITE_MS,
    umbral_errores_pct: 1,
    cumple_p95: p95 < LIMITE_MS,
    cumple_errores: errores < 0.01,
    cumple: p95 < LIMITE_MS && errores < 0.01,
  },
});
rmSync(resumenK6, { force: true });
