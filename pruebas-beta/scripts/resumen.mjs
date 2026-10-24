import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPORTES, leer, meta } from "./comun.mjs";

const hay = (nombre) => existsSync(join(REPORTES, nombre));
const leerSi = (nombre) => (hay(nombre) ? leer(nombre) : null);
const m = meta();
const lineas = [];
const w = (texto = "") => lineas.push(texto);

w("# Resumen de pruebas de la beta");
w();
w(`Versión **${m.version}**, commit \`${m.commit}\`, generado el ${m.fecha}.`);
w();
w("Todo corre contra la imagen de producción en http://localhost:3000 y los resultados están en JSON en esta carpeta. Las simulaciones usan la cuenta `simulacion`; los datos de `demo` solo se leen. Al terminar se reaplica `npm run seed:caso`.");
w();
w("**Cómo volver a correr todo** (con el stack levantado y Docker Desktop abierto):");
w();
w("```bash");
w("cd pruebas-beta");
w("npm install");
w("npm run pruebas:beta");
w("```");
w();

const auto = leerSi("pruebas.json");
const cob = leerSi("cobertura.json");
w("## 1. Pruebas automáticas y cobertura");
w();
if (auto) {
  w(`- Pruebas: **${auto.total.aprobadas} de ${auto.total.pruebas} aprobadas** en ${auto.total.archivos} archivos (${auto.total.fallidas} fallidas, ${auto.total.omitidas} omitidas).`);
} else w("- No se generó pruebas.json.");
if (cob && cob.total) {
  w(`- Cobertura total (v8, todo \`src/\`): líneas ${cob.total.lineas_pct} %, ramas ${cob.total.ramas_pct} %, funciones ${cob.total.funciones_pct} %.`);
  w();
  w("| Módulo | Archivos | Líneas | Ramas | Funciones |");
  w("|---|---|---|---|---|");
  for (const [nombre, v] of Object.entries(cob.por_modulo)) {
    w(`| ${nombre} | ${v.archivos} | ${v.lineas_pct} % | ${v.ramas_pct} % | ${v.funciones_pct} % |`);
  }
  w();
  w("Las acciones y la interfaz tienen 0 % porque sus pruebas hasta ahora son de simulación en el navegador, no unitarias.");
}
w();

const casos = leerSi("casos-dad.json");
w("## 2. Casos del DAD (CP-01 a CP-17)");
w();
if (casos) {
  const r = casos.resumen;
  w(`**${r.aprobados} aprobados**, ${r.fallidos} fallidos, ${r.no_incluidos_en_beta} no incluidos en beta (los de Telegram).`);
  w();
  w("| Caso | Nombre | Estado |");
  w("|---|---|---|");
  for (const c of casos.casos) w(`| ${c.id} | ${c.nombre} | ${c.estado} |`);
} else w("No se generó casos-dad.json.");
w();

const usa = leerSi("usabilidad-simulada.json");
w("## 3. Usabilidad simulada (Playwright, 390 × 844, 5 corridas)");
w();
if (usa) {
  w(`_${usa.aviso}_`);
  w();
  w("| Tarea | Éxito | Tiempo promedio | Tiempo máximo | Clics | Mensaje de error |");
  w("|---|---|---|---|---|---|");
  for (const t of usa.tareas) {
    w(`| ${t.id} ${t.nombre} | ${t.exitos}/${t.corridas} | ${t.tiempo_promedio_ms} ms | ${t.tiempo_maximo_ms} ms | ${t.clics_promedio} | ${t.mensaje_de_error_aparecio ?? "—"} |`);
  }
} else w("No se generó usabilidad-simulada.json.");
w();

const sim = leerSi("simulacion-30-dias.json");
w("## 4. Simulación de 30 días: a ojo contra Plumita");
w();
if (sim) {
  const a = sim.escenarios.a_ojo.resumen;
  const p = sim.escenarios.plumita.resumen;
  w(`Semilla fija ${sim.semilla}, inicio ${sim.inicio}. Los supuestos están escritos en el JSON.`);
  w();
  w("| Medida | A ojo | Plumita |");
  w("|---|---|---|");
  const filas = [
    ["Días sin alimento", "dias_sin_alimento"],
    ["Días con ración incompleta", "dias_con_racion_incompleta"],
    ["Libras de más vs. recomendado", "libras_de_mas_vs_recomendado"],
    ["Libras de menos vs. recomendado", "libras_de_menos_vs_recomendado"],
    ["Libras compradas", "libras_compradas"],
    ["Gasto total (Q)", "gasto_total_qtz"],
    ["Número de compras", "numero_de_compras"],
    ["Inventario al día 30 (lb)", "inventario_final_lb"],
  ];
  for (const [etiqueta, clave] of filas) w(`| ${etiqueta} | ${a[clave]} | ${p[clave]} |`);
  w();
  w("El gasto de Plumita es mayor porque compra con anticipación (con margen del 10 %) y termina con inventario de reserva; el gasto a ojo es menor en parte porque se quedó sin alimento.");
} else w("No se generó simulacion-30-dias.json.");
w();

const lh = leerSi("lighthouse.json");
w("## 5. Lighthouse móvil (mediana de 3 corridas)");
w();
if (lh) {
  w("| Página | Rendimiento | Accesibilidad | Buenas prácticas | LCP | CLS | TBT |");
  w("|---|---|---|---|---|---|---|");
  for (const p of lh.paginas) {
    const v = p.mediana;
    w(`| ${p.ruta} | ${v.rendimiento} | ${v.accesibilidad} | ${v.buenas_practicas} | ${v.lcp_ms} ms | ${v.cls} | ${v.tbt_ms} ms |`);
  }
} else w("No se generó lighthouse.json.");
w();

const carga = leerSi("carga.json");
w("## 6. Carga con k6 (10 usuarios, 1 minuto)");
w();
if (carga) {
  const d = carga.duracion_ms;
  w(`- Solicitudes: **${carga.solicitudes_totales}** (${carga.solicitudes_por_segundo} por segundo).`);
  w(`- Duración: p50 ${d.p50} ms, p95 ${d.p95} ms, p99 ${d.p99} ms, máximo ${d.maximo} ms.`);
  w(`- Errores: ${carga.errores_pct} %.`);
  w(`- RNF-02 (p95 menor a 2 s y menos de 1 % de errores): **${carga.contra_rnf_02.cumple ? "cumple" : "no cumple"}**.`);
  w(`- ${carga.advertencia}`);
} else w("No se generó carga.json.");
w();

const def = leerSi("defectos.json");
w("## 7. Bitácora de defectos");
w();
if (def) {
  w(`${def.total} defectos encontrados y corregidos durante el desarrollo (${def.por_severidad.alta} alta, ${def.por_severidad.media} media, ${def.por_severidad.baja} baja).`);
  w();
  w("| ID | Severidad | Descripción | Commit |");
  w("|---|---|---|---|");
  for (const d of def.defectos) w(`| ${d.id} | ${d.severidad} | ${d.titulo} | ${d.commit ?? "sin commit"} |`);
} else w("No se generó defectos.json.");
w();

const estado = leerSi("estado-ejecucion.json");
if (estado) {
  const saltados = estado.pasos.filter((p) => p.estado !== "ok");
  w("## Pasos saltados o con falla");
  w();
  if (saltados.length === 0) w("Ninguno.");
  for (const p of saltados) w(`- **${p.nombre}**: ${p.estado}. ${p.detalle ?? ""}`);
  w();
}

writeFileSync(join(REPORTES, "resumen.md"), lineas.join("\n") + "\n", "utf8");
console.log("  -> resumen.md");
