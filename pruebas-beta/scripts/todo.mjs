import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { RAIZ, guardar } from "./comun.mjs";

const scripts = (nombre) => join(RAIZ, "pruebas-beta", "scripts", nombre);
const MIN = 60 * 1000;

const PASOS = [
  { nombre: "Pruebas automáticas y cobertura", archivo: "automaticas.mjs", limite: 10 * MIN },
  { nombre: "Casos del DAD en el navegador", archivo: "casos-ui.mjs", limite: 8 * MIN },
  { nombre: "Usabilidad simulada", archivo: "usabilidad.mjs", limite: 15 * MIN },
  { nombre: "Simulación de 30 días", archivo: "simulacion.mjs", limite: 3 * MIN },
  { nombre: "Lighthouse", archivo: "lighthouse.mjs", limite: 15 * MIN },
  { nombre: "Carga con k6", archivo: "carga.mjs", limite: 6 * MIN },
  { nombre: "Bitácora de defectos", archivo: "defectos.mjs", limite: MIN },
  { nombre: "Casos del DAD (consolidado)", archivo: "casos-dad.mjs", limite: MIN },
];

const pasos = [];
for (const paso of PASOS) {
  console.log(`\n== ${paso.nombre}`);
  const inicio = Date.now();
  const r = spawnSync(process.execPath, [scripts(paso.archivo)], {
    cwd: RAIZ,
    stdio: "inherit",
    timeout: paso.limite,
  });
  const segundos = Math.round((Date.now() - inicio) / 1000);
  if (r.error?.code === "ETIMEDOUT") {
    pasos.push({ nombre: paso.nombre, estado: "saltado por tiempo", detalle: `Superó el límite de ${paso.limite / MIN} min.`, segundos });
  } else if (r.status !== 0) {
    pasos.push({ nombre: paso.nombre, estado: "con falla", detalle: `Terminó con código ${r.status}. Revisa la salida de arriba.`, segundos });
  } else {
    pasos.push({ nombre: paso.nombre, estado: "ok", segundos });
  }
}

guardar("estado-ejecucion.json", { pasos });

console.log("\n== Dejando la base limpia con seed:caso");
const semilla = spawnSync(process.execPath, [join(RAIZ, "node_modules", "tsx", "dist", "cli.mjs"), "scripts/seed-caso.ts"], {
  cwd: RAIZ,
  stdio: "inherit",
});
if (semilla.status !== 0) console.error("seed:caso falló: ejecútalo a mano con npm run seed:caso en la raíz.");

spawnSync(process.execPath, [scripts("resumen.mjs")], { cwd: RAIZ, stdio: "inherit" });
const falla = pasos.some((p) => p.estado !== "ok");
console.log(falla ? "\nTerminó con pasos saltados o con falla." : "\nTodo terminó bien.");
