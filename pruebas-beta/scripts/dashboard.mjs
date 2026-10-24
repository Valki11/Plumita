import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, REPORTES, leer } from "./comun.mjs";

const CARPETA = join(RAIZ, "pruebas-beta");
const modulo = (ruta) => readFileSync(join(CARPETA, "node_modules", ruta));

const pruebas = leer("pruebas.json");
const cobertura = leer("cobertura.json");
const casos = leer("casos-dad.json");
const usabilidad = leer("usabilidad-simulada.json");
const simulacion = leer("simulacion-30-dias.json");
const lighthouse = leer("lighthouse.json");
const carga = leer("carga.json");
const defectos = leer("defectos.json");
const ejecucion = leer("estado-ejecucion.json");

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const num = (n, d = 0) => Number(n).toLocaleString("es-GT", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (n) => `${num(n, n % 1 ? 1 : 0)} %`;
const qtz = (n) => `Q${num(n, 2)}`;
const lb = (n) => `${num(n, 2)} lb`;
const segundos = (ms) => `${num(ms / 1000, 2)} s`;

const fechaPruebas = new Intl.DateTimeFormat("es", { dateStyle: "long", timeStyle: "short", timeZone: "America/Guatemala" }).format(new Date(ejecucion.meta.fecha));
const commits = new Set([pruebas, casos, usabilidad, simulacion, lighthouse, carga, defectos].map((r) => r.meta.commit));

const cssOrganic = readFileSync(join(RAIZ, "src", "styles", "organic.css"), "utf8");
const bloqueRaiz = /:root\s*\{[\s\S]*?\n\}/.exec(cssOrganic)?.[0] ?? ":root {}";
const colores = Object.fromEntries([...bloqueRaiz.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]));
const c = (nombre) => colores[nombre];

const fuente = (archivo, familia, peso) =>
  `@font-face{font-family:"${familia}";font-weight:${peso};font-display:swap;src:url(data:font/woff2;base64,${modulo(archivo).toString("base64")}) format("woff2");}`;
const fuentes = [
  fuente("@fontsource/caprasimo/files/caprasimo-latin-400-normal.woff2", "Caprasimo", 400),
  fuente("@fontsource/figtree/files/figtree-latin-400-normal.woff2", "Figtree", 400),
  fuente("@fontsource/figtree/files/figtree-latin-600-normal.woff2", "Figtree", 600),
  fuente("@fontsource/figtree/files/figtree-latin-700-normal.woff2", "Figtree", 700),
].join("\n");
const libreriaGraficos = modulo("chart.js/dist/chart.umd.min.js").toString("utf8").replaceAll("</script", "<\\/script");

const tareas = usabilidad.tareas;
const tareasOk = tareas.filter((t) => t.exitos === t.corridas).length;
const corridasOk = tareas.reduce((s, t) => s + t.exitos, 0);
const corridasTotal = tareas.reduce((s, t) => s + t.corridas, 0);
const incluidos = casos.resumen.total - casos.resumen.no_incluidos_en_beta;
const accesibilidad = lighthouse.paginas.reduce((s, p) => s + p.mediana.accesibilidad, 0) / lighthouse.paginas.length;
const p95 = carga.duracion_ms.p95;
const ojo = simulacion.escenarios.a_ojo;
const pl = simulacion.escenarios.plumita;
const precioLb = pl.resumen.gasto_total_qtz / pl.resumen.libras_compradas;
const neto = (e) => e.resumen.gasto_total_qtz - e.resumen.inventario_final_lb * precioLb;
const alimentar = lighthouse.paginas.find((p) => p.ruta === "/alimentar");
const NOMBRES_PAGINA = { "/inicio": "Inicio", "/alimentar": "Alimentar", "/inventario": "Inventario" };
const NOMBRES_MODULO = { dominio: "Cálculos (dominio)", acciones: "Acciones", ui: "Pantallas (UI)", lib: "Utilidades (lib)", servidor_otros: "Resto del servidor" };
const ESTADOS = ["aprobado", "fallido", "no incluido en beta"];
const LIMITE_LCP_S = 2.5;
const LIMITE_P95_MS = carga.contra_rnf_02.umbral_p95_ms;

const modulosCobertura = Object.entries(cobertura.por_modulo).sort((a, b) => b[1].lineas_pct - a[1].lineas_pct);
const cobAcc = cobertura.por_modulo.acciones?.lineas_pct ?? 0;
const cobUi = cobertura.por_modulo.ui?.lineas_pct ?? 0;

const datos = {
  colores: {
    ojo: c("color-accent-600"),
    plumita: c("color-accent-2-600"),
    texto: c("color-text"),
    suave: c("color-neutral-600"),
    rejilla: c("color-neutral-300"),
    aprobado: c("color-accent-2-600"),
    fallido: c("color-accent-700"),
    noIncluido: c("color-neutral-400"),
    serie3: c("color-neutral-700"),
    alta: c("color-accent-800"),
    media: c("color-accent-500"),
    baja: c("color-accent-2-400"),
  },
  casosPorEstado: ESTADOS.map((e) => casos.casos.filter((x) => x.estado === e).length),
  estados: ESTADOS,
  usabilidad: {
    ids: tareas.map((t) => t.id),
    promedio: tareas.map((t) => t.tiempo_promedio_ms),
    maximo: tareas.map((t) => t.tiempo_maximo_ms),
    clics: tareas.map((t) => t.clics_promedio),
  },
  inventario: {
    dias: ojo.serie_diaria.map((d) => d.dia),
    ojo: ojo.serie_diaria.map((d) => d.inventario_fin_lb),
    plumita: pl.serie_diaria.map((d) => d.inventario_fin_lb),
  },
  fallas: { ojo: [ojo.resumen.dias_sin_alimento, ojo.resumen.dias_con_racion_incompleta], plumita: [pl.resumen.dias_sin_alimento, pl.resumen.dias_con_racion_incompleta] },
  consumo: {
    recomendado: ojo.resumen.libras_recomendadas,
    ojo: ojo.resumen.libras_dadas,
    plumita: pl.resumen.libras_dadas,
  },
  lighthouse: {
    paginas: lighthouse.paginas.map((p) => NOMBRES_PAGINA[p.ruta] ?? p.ruta),
    rendimiento: lighthouse.paginas.map((p) => p.mediana.rendimiento),
    accesibilidad: lighthouse.paginas.map((p) => p.mediana.accesibilidad),
    buenas: lighthouse.paginas.map((p) => p.mediana.buenas_practicas),
    lcp: lighthouse.paginas.map((p) => Number((p.mediana.lcp_ms / 1000).toFixed(2))),
    limiteLcp: LIMITE_LCP_S,
  },
  carga: { valores: [carga.duracion_ms.p50, carga.duracion_ms.p95, carga.duracion_ms.p99], limite: LIMITE_P95_MS },
  severidad: [defectos.por_severidad.alta, defectos.por_severidad.media, defectos.por_severidad.baja],
};

const indicador = (valor, etiqueta, nota, tono = "") => `
  <div class="indicador ${tono}"><div class="indicador-valor">${valor}</div><div class="indicador-etiqueta">${esc(etiqueta)}</div><div class="indicador-nota">${nota}</div></div>`;

const barraCobertura = ([nombre, v]) => `
  <div class="barra-fila">
    <div class="barra-nombre">${esc(NOMBRES_MODULO[nombre] ?? nombre)}<span>${v.archivos} archivos</span></div>
    <div class="barra-pista"><div class="barra-relleno" style="width:${Math.max(v.lineas_pct, 0)}%"></div></div>
    <div class="barra-valor">${pct(v.lineas_pct)}</div>
  </div>`;

const claseEstado = (e) => (e === "aprobado" ? "ok" : e === "fallido" ? "mal" : "no");
const filaCaso = (x) => `
  <tr><td class="mono">${esc(x.id)}</td><td>${esc(x.nombre)}</td><td><span class="etiqueta ${claseEstado(x.estado)}">${esc(x.estado)}</span></td><td class="evidencia">${esc(x.evidencia)}</td></tr>`;

const filaDefecto = (d) => `
  <tr><td class="mono">${esc(d.id)}</td><td><span class="etiqueta sev-${esc(d.severidad)}">${esc(d.severidad)}</span></td><td><strong>${esc(d.titulo)}</strong><br>${esc(d.descripcion)}</td><td>${esc(d.correccion)}</td><td class="mono">${esc(d.commit ?? "sin commit")}</td></tr>`;

const tarjetaEscenario = (titulo, e, clase) => `
  <div class="costo ${clase}">
    <h4>${titulo}</h4>
    <dl>
      <dt>Gasto total</dt><dd>${qtz(e.resumen.gasto_total_qtz)}</dd>
      <dt>Reserva final</dt><dd>${lb(e.resumen.inventario_final_lb)} <small>(${qtz(e.resumen.inventario_final_lb * precioLb)})</small></dd>
      <dt>Gasto neto</dt><dd class="resaltado">${qtz(neto(e))}</dd>
      <dt>Comprado</dt><dd>${num(e.resumen.libras_compradas)} lb en ${e.resumen.numero_de_compras} compras</dd>
    </dl>
  </div>`;

const diferenciaNeto = neto(pl) - neto(ojo);
const notaDinero =
  diferenciaNeto > 0
    ? `<strong>Plumita no ahorra dinero en esta simulación.</strong> Cuesta ${qtz(diferenciaNeto)} más en neto. Lo que hace es asegurar que las aves coman lo correcto y que nunca se queden sin alimento. Lo que se gasta de más queda como reserva: ${lb(pl.resumen.inventario_final_lb)} que se siguen usando después del día 30.`
    : `En esta simulación Plumita gasta ${qtz(-diferenciaNeto)} menos en neto y además evita los días sin alimento.`;

const hallazgos = [
  (() => {
    const lcpS = alimentar.mediana.lcp_ms / 1000;
    const otras = lighthouse.paginas.filter((p) => p.ruta !== "/alimentar").map((p) => segundos(p.mediana.lcp_ms)).join(" y ");
    const pasa = lcpS > LIMITE_LCP_S;
    const masLenta = lighthouse.paginas.every((p) => p.mediana.lcp_ms <= alimentar.mediana.lcp_ms);
    return {
      titulo: pasa
        ? `La pantalla Alimentar tarda más de ${num(LIMITE_LCP_S, 1)} s en mostrarse por completo`
        : `Alimentar ${masLenta ? "es la pantalla más lenta" : "carga"}, a ${segundos(alimentar.mediana.lcp_ms)}: cerca del límite de ${num(LIMITE_LCP_S, 1)} s`,
      texto: `Con Lighthouse en modo móvil, el contenido principal aparece a los ${segundos(alimentar.mediana.lcp_ms)} (mediana de ${lighthouse.corridas_por_pagina} mediciones; la más lenta fue de ${segundos(Math.max(...alimentar.corridas.map((x) => x.lcp_ms)))}). En las otras pantallas es de ${otras}. Mejora: revisar el tamaño de las imágenes y lo que carga esa pantalla.`,
      estado: pasa ? "mejorar" : "revisar",
    };
  })(),
  {
    titulo: "La proyección a 15 días deja una reserva de alimento",
    texto: `Como la proyección suma un margen del 10 %, Plumita termina el mes con ${lb(pl.resumen.inventario_final_lb)} guardadas (${qtz(pl.resumen.inventario_final_lb * precioLb)}). No es un gasto perdido, pero conviene explicárselo a la usuaria. Mejora: mostrar la reserva esperada junto a la recomendación de compra.`,
    estado: "mejorar",
  },
  {
    titulo: "Las acciones y las pantallas solo se prueban con la simulación",
    texto: `La cobertura de pruebas automáticas es de ${pct(cobAcc)} en acciones y ${pct(cobUi)} en pantallas; los cálculos están en ${pct(cobertura.por_modulo.dominio?.lineas_pct ?? 0)}. Los flujos se verificaron en el navegador, pero no quedan pruebas rápidas que se repitan en cada cambio. Mejora: agregar pruebas de acciones contra la base de datos.`,
    estado: "mejorar",
  },
  {
    titulo: "Telegram no está en la beta",
    texto: `${casos.resumen.no_incluidos_en_beta} casos del DAD (vincular, recordatorio y alerta de inventario bajo) quedan para la siguiente versión. Sin esto, la usuaria no recibe avisos.`,
    estado: "pendiente",
  },
  {
    titulo: "Falta la prueba con la usuaria real",
    texto: "Las pruebas de uso son simuladas por un programa. Muestran que los pasos funcionan, no que a la usuaria le resulten claros. Queda pendiente la sesión con Linda en su celular.",
    estado: "pendiente",
  },
  {
    titulo: "Una solicitud aislada tardó unos 15 segundos en la prueba de carga",
    texto: `Apareció en dos corridas distintas, mientras el percentil 99 fue de ${num(carga.duracion_ms.p99)} ms. No se encontró la causa; podría estar en la conexión del contenedor de la prueba y no en la app. Conviene repetir la prueba desde otro entorno.`,
    estado: "revisar",
  },
];

const sencillo = (texto) =>
  texto
    .replaceAll("seed:caso", "la demostración")
    .replaceAll("consumoDiarioLb (dominio real)", "el cálculo real de la app")
    .replaceAll("diasAlcance", "los días que alcanza el alimento")
    .replaceAll("la cantidad que da proyeccion", "la cantidad que indica la proyección");
const supuestos = simulacion.supuestos.map((s) => `<li>${esc(sencillo(s))}</li>`).join("");
const leyendaTareas = tareas.map((t) => `<li><span class="mono">${esc(t.id)}</span> ${esc(t.nombre)}</li>`).join("");

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Plumita Beta ${esc(ejecucion.meta.version.replace(/-beta$/, ""))}: resultados de las pruebas</title>
<style>
${fuentes}
${bloqueRaiz}
:root{--fuente-titulo:"Caprasimo",Georgia,"Times New Roman",serif;--fuente-cuerpo:"Figtree",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;}
*{box-sizing:border-box}
body{margin:0;background:var(--color-bg);color:var(--color-text);font-family:var(--fuente-cuerpo);font-size:16px;line-height:1.5}
h1,h2,h3,h4{font-family:var(--fuente-titulo);font-weight:400;line-height:1.15;margin:0}
.pagina{max-width:1200px;margin:0 auto;padding:32px 24px 64px;display:grid;grid-template-columns:minmax(0,1fr);gap:28px}
section{min-width:0;background:var(--color-surface);border-radius:28px;padding:28px 32px}
section.claro{background:var(--color-neutral-100)}
section h2{font-size:30px;margin-bottom:6px}
.subtitulo{margin:0 0 20px;color:var(--color-neutral-700)}
.encabezado{background:var(--color-accent-700);color:var(--color-accent-100);display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.encabezado h1{font-size:46px}
.encabezado p{margin:4px 0 0;color:var(--color-accent-200)}
.encabezado .meta{margin-left:auto;text-align:right;font-size:15px}
.encabezado .meta strong{display:block;font-size:18px;color:var(--color-accent-100)}
.aviso-commit{margin-top:10px;font-size:14px;background:var(--color-accent-100);color:var(--color-accent-800);padding:8px 14px;border-radius:14px}
.indicadores{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.indicador{background:var(--color-bg);border-radius:22px;padding:20px 22px;display:flex;flex-direction:column;gap:2px}
.indicador-valor{font-family:var(--fuente-titulo);font-size:44px;line-height:1.1}
.indicador-etiqueta{font-weight:700;font-size:16px}
.indicador-nota{font-size:14px;color:var(--color-neutral-700)}
.indicador.bien .indicador-valor{color:var(--color-accent-2-700)}
.indicador.alerta .indicador-valor{color:var(--color-accent-700)}
.barra-fila{display:grid;grid-template-columns:230px 1fr 80px;gap:14px;align-items:center;margin:12px 0}
.barra-nombre span{display:block;font-size:13px;color:var(--color-neutral-700)}
.barra-pista{height:24px;background:var(--color-neutral-200);border-radius:999px;overflow:hidden}
.barra-relleno{height:100%;background:var(--color-accent-2-600);border-radius:999px;min-width:4px}
.barra-valor{font-weight:700;text-align:right;font-size:18px}
.nota{margin:16px 0 0;font-size:15px;color:var(--color-neutral-800)}
.rejilla-2{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
.rejilla-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.grafico{position:relative;height:300px}
.grafico.alto{height:340px}
.grafico.bajo{height:260px}
.grafico.centrado{max-width:460px;margin:0 auto 22px}
.grafico-titulo{font-weight:700;margin:0 0 8px;font-size:16px}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-700);padding:8px;border-bottom:1px solid var(--color-divider)}
td{padding:8px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 8%,transparent);vertical-align:top}
.mono{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
.evidencia{color:var(--color-neutral-800);font-size:13px}
.etiqueta{display:inline-block;padding:2px 12px;border-radius:999px;font-size:13px;font-weight:600;white-space:nowrap}
.etiqueta.ok{background:var(--color-accent-2-200);color:var(--color-accent-2-800)}
.etiqueta.mal{background:var(--color-accent-200);color:var(--color-accent-800)}
.etiqueta.no{background:var(--color-neutral-200);color:var(--color-neutral-800)}
.etiqueta.sev-alta{background:var(--color-accent-800);color:var(--color-accent-100)}
.etiqueta.sev-media{background:var(--color-accent-300);color:var(--color-accent-900)}
.etiqueta.sev-baja{background:var(--color-accent-2-200);color:var(--color-accent-2-800)}
.sello{display:inline-block;background:var(--color-accent-800);color:var(--color-accent-100);padding:6px 16px;border-radius:999px;font-weight:700;font-size:14px;margin-bottom:14px}
.leyenda{columns:2;margin:14px 0 0;padding-left:20px;font-size:14px;color:var(--color-neutral-800)}
.costo{border-radius:22px;padding:18px 22px;background:var(--color-bg);border-top:8px solid var(--color-neutral-400)}
.costo.ojo{border-top-color:${datos.colores.ojo}}
.costo.plumita{border-top-color:${datos.colores.plumita}}
.costo h4{font-size:20px;margin-bottom:10px}
.costo dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:6px 14px}
.costo dt{color:var(--color-neutral-700)}
.costo dd{margin:0;font-weight:700;text-align:right}
.costo dd small{font-weight:400;color:var(--color-neutral-700)}
.costo dd.resaltado{font-size:22px}
.destacado{margin-top:18px;background:var(--color-accent-100);color:var(--color-accent-900);border-radius:20px;padding:16px 22px;font-size:17px}
.supuestos{font-size:14px;color:var(--color-neutral-800);padding-left:20px;margin:10px 0 0}
.supuestos li{margin:4px 0}
.resumen-carga{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:16px}
.dato{background:var(--color-bg);border-radius:18px;padding:14px 18px}
.dato b{display:block;font-family:var(--fuente-titulo);font-weight:400;font-size:30px}
.dato span{font-size:14px;color:var(--color-neutral-700)}
.hallazgo{background:var(--color-bg);border-radius:20px;padding:16px 22px;display:grid;gap:4px;border-left:10px solid var(--color-neutral-400)}
.hallazgo.mejorar{border-left-color:var(--color-accent-500)}
.hallazgo.pendiente{border-left-color:var(--color-accent-800)}
.hallazgo.revisar{border-left-color:var(--color-accent-2-500)}
.hallazgo.bien{border-left-color:var(--color-accent-2-600)}
.hallazgo h3{font-family:var(--fuente-cuerpo);font-weight:700;font-size:18px}
.hallazgo p{margin:0;font-size:15px;color:var(--color-neutral-800)}
.lista-hallazgos{display:grid;gap:12px}
.tabla-ancha{overflow-x:auto}
@media (max-width:900px){
  .indicadores,.rejilla-3,.resumen-carga{grid-template-columns:1fr 1fr}
  .rejilla-2{grid-template-columns:1fr}
  .barra-fila{grid-template-columns:1fr 70px}
  .barra-pista{grid-column:1 / -1;order:3}
  .encabezado .meta{margin-left:0;text-align:left}
  .leyenda{columns:1}
}
@media (max-width:560px){
  .pagina{padding:16px 12px 40px}
  section{padding:20px 16px;border-radius:22px}
  .indicadores,.rejilla-3,.resumen-carga{grid-template-columns:1fr}
  .encabezado h1{font-size:34px}
  .indicador-valor{font-size:38px}
}
</style>
</head>
<body>
<main class="pagina">

<section class="encabezado" id="encabezado" data-captura="01-encabezado">
  <div>
    <h1>Plumita Beta ${esc(ejecucion.meta.version.replace(/-beta$/, ""))}</h1>
    <p>Resultados de las pruebas de la versión de prueba</p>
    ${commits.size > 1 ? `<div class="aviso-commit">Atención: los reportes vienen de commits distintos (${esc([...commits].join(", "))}).</div>` : ""}
  </div>
  <div class="meta"><strong>${esc(fechaPruebas)}</strong>Versión ${esc(ejecucion.meta.version)}<br>Commit <span class="mono">${esc(ejecucion.meta.commit)}</span></div>
</section>

<section id="indicadores" data-captura="02-indicadores" class="claro">
  <h2>Lo más importante</h2>
  <p class="subtitulo">Seis números para resumir cómo salió la beta.</p>
  <div class="indicadores">
    ${indicador(`${pruebas.total.aprobadas} de ${pruebas.total.pruebas}`, "Pruebas automáticas aprobadas", `Verifican los cálculos y la base de datos. ${pruebas.total.fallidas} fallidas.`, pruebas.total.fallidas === 0 ? "bien" : "alerta")}
    ${indicador(`${casos.resumen.aprobados} de ${incluidos}`, "Casos del DAD aprobados", `De los incluidos en la beta. Otros ${casos.resumen.no_incluidos_en_beta} (los de Telegram) no están en esta versión.`, casos.resumen.fallidos === 0 ? "bien" : "alerta")}
    ${indicador(`${tareasOk} de ${tareas.length}`, "Tareas simuladas exitosas", `${corridasOk} de ${corridasTotal} repeticiones salieron bien.`, tareasOk === tareas.length ? "bien" : "alerta")}
    ${indicador(`${num(p95)} ms`, "Carga: tiempo del 95 % de las páginas", `Objetivo: menos de ${num(LIMITE_P95_MS / 1000)} s (${num(LIMITE_P95_MS)} ms). ${carga.contra_rnf_02.cumple ? "Se cumple." : "No se cumple."}`, carga.contra_rnf_02.cumple ? "bien" : "alerta")}
    ${indicador(num(accesibilidad, 0), "Puntaje de accesibilidad", "Promedio de las tres pantallas, sobre 100.", accesibilidad >= 90 ? "bien" : "alerta")}
    ${indicador(defectos.total, "Defectos corregidos", `${defectos.por_severidad.alta} grave, ${defectos.por_severidad.media} media y ${defectos.por_severidad.baja} leves.`)}
  </div>
</section>

<section id="cobertura" data-captura="03-cobertura">
  <h2>Qué parte del código revisan las pruebas automáticas</h2>
  <p class="subtitulo">Porcentaje de líneas de código que las pruebas ejecutan. Total: ${pct(cobertura.total.lineas_pct)}.</p>
  ${modulosCobertura.map(barraCobertura).join("")}
  <p class="nota">Las acciones y las pantallas se prueban con la simulación en el navegador, no con pruebas automáticas rápidas; por eso aparecen en ${pct(cobAcc)} y ${pct(cobUi)}.</p>
</section>

<section id="casos" data-captura="04-casos" class="claro">
  <h2>Casos de prueba del DAD</h2>
  <p class="subtitulo">${casos.resumen.aprobados} aprobados, ${casos.resumen.fallidos} fallidos y ${casos.resumen.no_incluidos_en_beta} no incluidos en la beta.</p>
  <div class="grafico bajo centrado"><canvas id="grafico-casos" aria-label="Casos por estado"></canvas></div>
  <div class="tabla-ancha"><table>
      <thead><tr><th>Caso</th><th>Nombre</th><th>Estado</th><th>Cómo se comprobó</th></tr></thead>
      <tbody>${casos.casos.map(filaCaso).join("")}</tbody>
    </table></div>
</section>

<section id="usabilidad" data-captura="05-usabilidad">
  <span class="sello">Prueba simulada: no reemplaza una prueba con la usuaria real</span>
  <h2>Qué tan fácil es usar la app</h2>
  <p class="subtitulo">Un programa repitió ${usabilidad.corridas} veces cada tarea en pantalla de celular (${usabilidad.viewport.width} × ${usabilidad.viewport.height}). Los tiempos son de un programa, no de una persona.</p>
  <div class="rejilla-2">
    <div><p class="grafico-titulo">Tiempo por tarea (milisegundos)</p><div class="grafico alto"><canvas id="grafico-tiempos" aria-label="Tiempo promedio y máximo por tarea"></canvas></div></div>
    <div><p class="grafico-titulo">Clics por tarea (promedio)</p><div class="grafico alto"><canvas id="grafico-clics" aria-label="Clics por tarea"></canvas></div></div>
  </div>
  <ul class="leyenda">${leyendaTareas}</ul>
  <p class="nota">Las tareas que empiezan con E son errores puestos a propósito: en todas el mensaje de error apareció (${tareas.filter((t) => t.id.startsWith("E")).map((t) => `${t.id}: ${t.mensaje_de_error_aparecio}`).join("; ")}).</p>
</section>

<section id="solucion" data-captura="06-solucion" class="claro">
  <h2>Cómo se solventó el problema: dar de comer "a ojo" contra Plumita</h2>
  <p class="subtitulo">Simulación de ${simulacion.dias} días con las mismas aves y la misma compra inicial de ${num(ojo.serie_diaria[0].inventario_fin_lb + ojo.serie_diaria[0].dado_lb, 0)} lb. Se repite igual cada vez (semilla ${simulacion.semilla}). Es una simulación, no datos reales de la granja.</p>
  <p class="grafico-titulo">Alimento que queda cada día (libras)</p>
  <div class="grafico alto"><canvas id="grafico-inventario" aria-label="Inventario diario de los dos escenarios"></canvas></div>
  <div class="rejilla-2" style="margin-top:22px">
    <div><p class="grafico-titulo">Días en que faltó alimento</p><div class="grafico bajo"><canvas id="grafico-fallas" aria-label="Días sin alimento y con ración incompleta"></canvas></div></div>
    <div><p class="grafico-titulo">Alimento dado frente a lo recomendado (libras en ${simulacion.dias} días)</p><div class="grafico bajo"><canvas id="grafico-consumo" aria-label="Alimento dado contra recomendado"></canvas></div></div>
  </div>
  <div class="rejilla-2" style="margin-top:22px">
    ${tarjetaEscenario("A ojo", ojo, "ojo")}
    ${tarjetaEscenario("Con Plumita", pl, "plumita")}
  </div>
  <div class="destacado">${notaDinero}</div>
  <p class="nota">Gasto neto = gasto total menos la reserva final valorada a ${qtz(precioLb)} por libra.</p>
  <h3 style="font-size:20px;margin-top:22px">Supuestos de la simulación</h3>
  <ul class="supuestos">${supuestos}</ul>
</section>

<section id="lighthouse" data-captura="07-lighthouse">
  <h2>Rapidez, accesibilidad y buenas prácticas</h2>
  <p class="subtitulo">Medido con Lighthouse en modo celular, con la sesión iniciada (${lighthouse.corridas_por_pagina} mediciones por pantalla, se muestra la mediana). Puntaje de 0 a 100.</p>
  <div class="rejilla-2">
    <div><p class="grafico-titulo">Puntajes por pantalla</p><div class="grafico alto"><canvas id="grafico-lighthouse" aria-label="Puntajes de Lighthouse por pantalla"></canvas></div></div>
    <div><p class="grafico-titulo">Segundos hasta ver el contenido principal (LCP). Línea en ${num(LIMITE_LCP_S, 1)} s</p><div class="grafico alto"><canvas id="grafico-lcp" aria-label="Tiempo de carga del contenido principal"></canvas></div></div>
  </div>
</section>

<section id="carga" data-captura="08-carga" class="claro">
  <h2>Prueba de carga</h2>
  <p class="subtitulo">10 personas simuladas navegando Inicio, Alimentar e Inventario durante un minuto. ${esc(carga.advertencia)}</p>
  <div class="rejilla-2">
    <div><p class="grafico-titulo">Tiempo de respuesta (milisegundos). Línea en ${num(LIMITE_P95_MS)} ms</p><div class="grafico"><canvas id="grafico-carga" aria-label="Tiempos de respuesta de la prueba de carga"></canvas></div></div>
    <div>
      <div class="resumen-carga">
        <div class="dato"><b>${num(carga.solicitudes_totales)}</b><span>solicitudes en total</span></div>
        <div class="dato"><b>${pct(carga.errores_pct)}</b><span>con error</span></div>
        <div class="dato"><b>${num(p95)} ms</b><span>tiempo del 95 % (meta: menos de ${num(LIMITE_P95_MS)} ms)</span></div>
      </div>
      <p class="destacado">Una sola solicitud tardó ${segundos(carga.duracion_ms.maximo)}, aislada: el 99 % tardó ${num(carga.duracion_ms.p99)} ms o menos. No se encontró la causa; podría estar en la conexión del programa de prueba y no en la app.</p>
    </div>
  </div>
</section>

<section id="defectos" data-captura="09-defectos">
  <h2>Defectos encontrados y corregidos</h2>
  <p class="subtitulo">${defectos.total} en total durante el desarrollo.</p>
  <div class="grafico bajo centrado"><canvas id="grafico-defectos" aria-label="Defectos por severidad"></canvas></div>
  <div class="tabla-ancha"><table>
      <thead><tr><th>Id</th><th>Gravedad</th><th>Qué pasaba</th><th>Cómo se arregló</th><th>Commit</th></tr></thead>
      <tbody>${defectos.defectos.map(filaDefecto).join("")}</tbody>
    </table></div>
</section>

<section id="hallazgos" data-captura="10-hallazgos" class="claro">
  <h2>Hallazgos y mejoras</h2>
  <p class="subtitulo">Lo que las pruebas dejaron ver y lo que sigue.</p>
  <div class="lista-hallazgos">
    ${hallazgos.map((h) => `<div class="hallazgo ${h.estado}"><h3>${esc(h.titulo)}</h3><p>${esc(h.texto)}</p></div>`).join("")}
  </div>
</section>

</main>
<script>${libreriaGraficos}</script>
<script>
const D = ${JSON.stringify(datos)};
Chart.defaults.animation = false;
Chart.defaults.font.family = '"Figtree", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
Chart.defaults.font.size = 14;
Chart.defaults.color = D.colores.texto;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.responsive = true;

const valoresEnBarras = {
  id: "valoresEnBarras",
  afterDatasetsDraw(chart, _args, opciones) {
    if (!opciones || opciones.activo === false) return;
    const ctx = chart.ctx;
    ctx.save();
    ctx.font = '700 13px "Figtree", system-ui, sans-serif';
    ctx.fillStyle = D.colores.texto;
    const horizontal = chart.options.indexAxis === "y";
    chart.data.datasets.forEach((conjunto, i) => {
      if (conjunto.type === "line" || conjunto.sinValores) return;
      chart.getDatasetMeta(i).data.forEach((barra, j) => {
        const valor = conjunto.data[j];
        const texto = (opciones.formato ? opciones.formato(valor, conjunto) : String(valor));
        if (opciones.dentro) { ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(texto, barra.x, barra.y + 8); ctx.fillStyle = D.colores.texto; return; }
        if (horizontal) { ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(texto, barra.x + 6, barra.y); }
        else { ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText(texto, barra.x, barra.y - 4); }
      });
    });
    ctx.restore();
  },
};
Chart.register(valoresEnBarras);

const rejilla = { color: D.colores.rejilla };
const nf = (n, d = 0) => Number(n).toLocaleString("es-GT", { minimumFractionDigits: d, maximumFractionDigits: d });

new Chart(document.getElementById("grafico-casos"), {
  type: "doughnut",
  data: { labels: D.estados.map((e, i) => e + " (" + D.casosPorEstado[i] + ")"), datasets: [{ data: D.casosPorEstado, backgroundColor: [D.colores.aprobado, D.colores.fallido, D.colores.noIncluido], borderWidth: 0 }] },
  options: { cutout: "58%", plugins: { legend: { position: "bottom", labels: { font: { size: 15 }, padding: 14 } }, valoresEnBarras: { activo: false } } },
});

new Chart(document.getElementById("grafico-tiempos"), {
  type: "bar",
  data: { labels: D.usabilidad.ids, datasets: [
    { label: "Promedio", data: D.usabilidad.promedio, backgroundColor: D.colores.plumita },
    { label: "Máximo", data: D.usabilidad.maximo, backgroundColor: D.colores.ojo },
  ] },
  options: { indexAxis: "y", layout: { padding: { right: 48 } }, scales: { x: { beginAtZero: true, grid: rejilla }, y: { grid: { display: false } } }, plugins: { legend: { position: "bottom" }, valoresEnBarras: { formato: (v) => nf(v) } } },
});

new Chart(document.getElementById("grafico-clics"), {
  type: "bar",
  data: { labels: D.usabilidad.ids, datasets: [{ label: "Clics", data: D.usabilidad.clics, backgroundColor: D.colores.serie3 }] },
  options: { indexAxis: "y", layout: { padding: { right: 36 } }, scales: { x: { beginAtZero: true, grid: rejilla, ticks: { precision: 0 } }, y: { grid: { display: false } } }, plugins: { legend: { display: false }, valoresEnBarras: { formato: (v) => nf(v, 1) } } },
});

new Chart(document.getElementById("grafico-inventario"), {
  type: "line",
  data: { labels: D.inventario.dias, datasets: [
    { label: "A ojo", data: D.inventario.ojo, borderColor: D.colores.ojo, backgroundColor: D.colores.ojo, borderWidth: 3, pointRadius: 0, tension: 0.15 },
    { label: "Con Plumita", data: D.inventario.plumita, borderColor: D.colores.plumita, backgroundColor: D.colores.plumita, borderWidth: 3, pointRadius: 0, tension: 0.15 },
  ] },
  options: { scales: { x: { title: { display: true, text: "Día" }, grid: { display: false } }, y: { beginAtZero: true, title: { display: true, text: "Libras" }, grid: rejilla } }, plugins: { legend: { position: "bottom" }, valoresEnBarras: { activo: false } } },
});

new Chart(document.getElementById("grafico-fallas"), {
  type: "bar",
  data: { labels: ["Sin alimento", "Con ración incompleta"], datasets: [
    { label: "A ojo", data: D.fallas.ojo, backgroundColor: D.colores.ojo },
    { label: "Con Plumita", data: D.fallas.plumita, backgroundColor: D.colores.plumita },
  ] },
  options: { scales: { y: { beginAtZero: true, grace: "15%", grid: rejilla, ticks: { precision: 0 }, title: { display: true, text: "Días" } }, x: { grid: { display: false } } }, plugins: { legend: { position: "bottom" }, valoresEnBarras: { formato: (v) => nf(v) } } },
});

new Chart(document.getElementById("grafico-consumo"), {
  type: "bar",
  data: { labels: ["Recomendado", "A ojo", "Con Plumita"], datasets: [{ data: [D.consumo.recomendado, D.consumo.ojo, D.consumo.plumita], backgroundColor: [D.colores.serie3, D.colores.ojo, D.colores.plumita] }] },
  options: { scales: { y: { beginAtZero: true, grace: "12%", grid: rejilla, title: { display: true, text: "Libras" } }, x: { grid: { display: false } } }, plugins: { legend: { display: false }, valoresEnBarras: { formato: (v) => nf(v, 1) + " lb" } } },
});

new Chart(document.getElementById("grafico-lighthouse"), {
  type: "bar",
  data: { labels: D.lighthouse.paginas, datasets: [
    { label: "Rapidez", data: D.lighthouse.rendimiento, backgroundColor: D.colores.ojo },
    { label: "Accesibilidad", data: D.lighthouse.accesibilidad, backgroundColor: D.colores.plumita },
    { label: "Buenas prácticas", data: D.lighthouse.buenas, backgroundColor: D.colores.serie3 },
  ] },
  options: { scales: { y: { min: 0, max: 110, ticks: { callback: (v) => (v <= 100 ? v : ""), stepSize: 20 }, grid: rejilla }, x: { grid: { display: false } } }, plugins: { legend: { position: "bottom" }, valoresEnBarras: { formato: (v) => nf(v) } } },
});

new Chart(document.getElementById("grafico-lcp"), {
  data: { labels: D.lighthouse.paginas, datasets: [
    { type: "bar", label: "Segundos hasta ver el contenido", data: D.lighthouse.lcp, backgroundColor: D.lighthouse.lcp.map((v) => (v > D.lighthouse.limiteLcp ? D.colores.fallido : D.colores.plumita)) },
    { type: "line", label: "Límite de " + nf(D.lighthouse.limiteLcp, 1) + " s", data: D.lighthouse.paginas.map(() => D.lighthouse.limiteLcp), borderColor: D.colores.texto, borderDash: [8, 6], borderWidth: 2, pointRadius: 0 },
  ] },
  options: { scales: { y: { beginAtZero: true, suggestedMax: 3.5, grid: rejilla, title: { display: true, text: "Segundos" } }, x: { grid: { display: false } } }, plugins: { legend: { position: "bottom" }, valoresEnBarras: { dentro: true, formato: (v) => nf(v, 2) + " s" } } },
});

new Chart(document.getElementById("grafico-carga"), {
  data: { labels: ["50 % de las páginas", "95 % de las páginas", "99 % de las páginas"], datasets: [
    { type: "bar", label: "Milisegundos", data: D.carga.valores, backgroundColor: [D.colores.plumita, D.colores.plumita, D.colores.serie3] },
    { type: "line", label: "Objetivo: " + nf(D.carga.limite) + " ms", data: D.carga.valores.map(() => D.carga.limite), borderColor: D.colores.fallido, borderDash: [8, 6], borderWidth: 2, pointRadius: 0 },
  ] },
  options: { scales: { y: { beginAtZero: true, suggestedMax: D.carga.limite * 1.1, grid: rejilla, title: { display: true, text: "Milisegundos" } }, x: { grid: { display: false } } }, plugins: { legend: { position: "bottom" }, valoresEnBarras: { formato: (v) => nf(v) + " ms" } } },
});

new Chart(document.getElementById("grafico-defectos"), {
  type: "bar",
  data: { labels: ["Grave", "Media", "Leve"], datasets: [{ data: D.severidad, backgroundColor: [D.colores.alta, D.colores.media, D.colores.baja] }] },
  options: { scales: { y: { beginAtZero: true, grace: "15%", grid: rejilla, ticks: { precision: 0 }, title: { display: true, text: "Defectos" } }, x: { grid: { display: false } } }, plugins: { legend: { display: false }, valoresEnBarras: { formato: (v) => nf(v) } } },
});
document.documentElement.dataset.listo = "1";
</script>
</body>
</html>
`;

writeFileSync(join(REPORTES, "dashboard.html"), html, "utf8");
console.log(`  -> dashboard.html (${Math.round(html.length / 1024)} KB)`);
