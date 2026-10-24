import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { RAIZ, guardar } from "./comun.mjs";

const resultado = spawnSync(
  process.execPath,
  [
    join(RAIZ, "node_modules", "tsx", "dist", "cli.mjs"),
    "--tsconfig",
    join(RAIZ, "tsconfig.json"),
    join(RAIZ, "pruebas-beta", "scripts", "simulacion-30-dias.ts"),
  ],
  { cwd: RAIZ, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);

if (resultado.status !== 0) {
  console.error(resultado.stderr);
  throw new Error("La simulación de 30 días falló");
}

const datos = JSON.parse(resultado.stdout);
guardar("simulacion-30-dias.json", datos);
for (const [nombre, escenario] of Object.entries(datos.escenarios)) {
  console.log(nombre, JSON.stringify(escenario.resumen));
}
