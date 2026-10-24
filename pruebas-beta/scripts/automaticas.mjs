import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { RAIZ, REPORTES, guardar, redondear } from "./comun.mjs";

const salidaVitest = join(REPORTES, ".vitest.json");
const dirCobertura = join(REPORTES, ".cobertura");
rmSync(dirCobertura, { recursive: true, force: true });

const resultado = spawnSync(
  process.execPath,
  [
    join(RAIZ, "node_modules", "vitest", "vitest.mjs"),
    "run",
    "--reporter=json",
    `--outputFile=${salidaVitest}`,
    "--coverage.enabled",
    "--coverage.provider=v8",
    "--coverage.reporter=json-summary",
    `--coverage.reportsDirectory=${dirCobertura}`,
    "--coverage.include=src/**/*.ts",
    "--coverage.include=src/**/*.tsx",
  ],
  { cwd: RAIZ, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);

if (!existsSync(salidaVitest)) {
  console.error(resultado.stderr?.slice(-1500));
  throw new Error("Vitest no produjo el reporte JSON");
}

const crudo = JSON.parse(readFileSync(salidaVitest, "utf8"));
const archivos = crudo.testResults.map((archivo) => {
  const pruebas = archivo.assertionResults.map((p) => ({
    nombre: p.fullName,
    estado: p.status === "passed" ? "aprobada" : p.status === "failed" ? "fallida" : "omitida",
    duracion_ms: Math.round(p.duration ?? 0),
  }));
  return {
    archivo: relative(RAIZ, archivo.name).replaceAll("\\", "/"),
    aprobadas: pruebas.filter((p) => p.estado === "aprobada").length,
    fallidas: pruebas.filter((p) => p.estado === "fallida").length,
    omitidas: pruebas.filter((p) => p.estado === "omitida").length,
    pruebas,
  };
});

const total = (clave) => archivos.reduce((suma, a) => suma + a[clave], 0);
guardar("pruebas.json", {
  herramienta: "vitest",
  nota: "Las pruebas de integración corren contra la base plumita_test, no contra los datos de demo ni de simulación.",
  total: {
    archivos: archivos.length,
    pruebas: total("aprobadas") + total("fallidas") + total("omitidas"),
    aprobadas: total("aprobadas"),
    fallidas: total("fallidas"),
    omitidas: total("omitidas"),
  },
  archivos,
});

const rutaResumen = join(dirCobertura, "coverage-summary.json");
if (!existsSync(rutaResumen)) {
  guardar("cobertura.json", { error: "No se generó coverage-summary.json", herramienta: "vitest + v8" });
  process.exit(0);
}

const resumen = JSON.parse(readFileSync(rutaResumen, "utf8"));
const porArchivo = [];
const modulos = {};

function modulo(ruta) {
  if (ruta.startsWith("src/server/dominio/")) return "dominio";
  if (ruta.startsWith("src/server/acciones/")) return "acciones";
  if (ruta.startsWith("src/components/") || ruta.startsWith("src/app/")) return "ui";
  if (ruta.startsWith("src/lib/")) return "lib";
  return "servidor_otros";
}

const sumar = (acumulado, metrica) => ({
  total: (acumulado?.total ?? 0) + metrica.total,
  cubiertas: (acumulado?.cubiertas ?? 0) + metrica.covered,
});

for (const [ruta, datos] of Object.entries(resumen)) {
  if (ruta === "total") continue;
  const relativa = relative(RAIZ, ruta).replaceAll("\\", "/");
  porArchivo.push({
    archivo: relativa,
    modulo: modulo(relativa),
    lineas_pct: datos.lines.pct,
    sentencias_pct: datos.statements.pct,
    funciones_pct: datos.functions.pct,
    ramas_pct: datos.branches.pct,
  });
  const m = (modulos[modulo(relativa)] ??= { archivos: 0, lineas: null, sentencias: null, funciones: null, ramas: null });
  m.archivos += 1;
  m.lineas = sumar(m.lineas, datos.lines);
  m.sentencias = sumar(m.sentencias, datos.statements);
  m.funciones = sumar(m.funciones, datos.functions);
  m.ramas = sumar(m.ramas, datos.branches);
}

const pct = (m) => (m && m.total ? redondear((m.cubiertas / m.total) * 100) : 100);
const porModulo = Object.fromEntries(
  Object.entries(modulos).map(([nombre, m]) => [
    nombre,
    {
      archivos: m.archivos,
      lineas_pct: pct(m.lineas),
      sentencias_pct: pct(m.sentencias),
      funciones_pct: pct(m.funciones),
      ramas_pct: pct(m.ramas),
    },
  ]),
);

guardar("cobertura.json", {
  herramienta: "vitest + v8",
  alcance: "Todos los archivos de src/, incluidos los que ninguna prueba toca (cuentan como 0 %).",
  total: {
    lineas_pct: resumen.total.lines.pct,
    sentencias_pct: resumen.total.statements.pct,
    funciones_pct: resumen.total.functions.pct,
    ramas_pct: resumen.total.branches.pct,
  },
  por_modulo: porModulo,
  por_archivo: porArchivo.sort((a, b) => a.archivo.localeCompare(b.archivo)),
});

rmSync(dirCobertura, { recursive: true, force: true });
rmSync(salidaVitest, { force: true });
if (crudo.numFailedTests > 0) process.exitCode = 1;
