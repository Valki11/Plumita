import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { REPORTES, lanzarNavegador } from "./comun.mjs";

const DESTINO = join(REPORTES, "capturas-dashboard");
mkdirSync(DESTINO, { recursive: true });
for (const archivo of readdirSync(DESTINO)) rmSync(join(DESTINO, archivo));

const url = pathToFileURL(join(REPORTES, "dashboard.html")).href;
const { navegador } = await lanzarNavegador();
const problemas = [];

async function abrir(ancho, alto) {
  const contexto = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: ancho >= 1000 ? 2 : 1 });
  const pagina = await contexto.newPage();
  const externas = [];
  pagina.on("request", (r) => {
    if (!/^(file|data|blob):/.test(r.url())) externas.push(r.url());
  });
  await pagina.goto(url);
  await pagina.waitForFunction(() => document.documentElement.dataset.listo === "1");
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(400);
  return { contexto, pagina, externas };
}

const { contexto, pagina, externas } = await abrir(1280, 900);

const canvasVacios = await pagina.evaluate(() =>
  [...document.querySelectorAll("canvas")]
    .filter((canvas) => {
      const datos = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < datos.length; i += 4) if (datos[i] !== 0) return false;
      return true;
    })
    .map((canvas) => canvas.id),
);
if (canvasVacios.length) problemas.push(`Gráficos vacíos: ${canvasVacios.join(", ")}`);

const cortados = await pagina.evaluate(() =>
  [...document.querySelectorAll("section *")]
    .filter((el) => !el.closest(".tabla-ancha") && !el.closest("canvas") && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible")
    .map((el) => `${el.tagName.toLowerCase()}.${el.className}`),
);
if (cortados.length) problemas.push(`Textos cortados: ${cortados.slice(0, 5).join(", ")}`);

const desbordeHorizontal = await pagina.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
if (desbordeHorizontal) problemas.push("Hay desplazamiento horizontal a 1280 px");

const sinTexto = await pagina.evaluate(() =>
  [...document.querySelectorAll(".indicador-valor, .dato b, .barra-valor, .costo dd")].filter((el) => /NaN|undefined|Infinity/.test(el.textContent) || el.textContent.trim() === "").map((el) => el.className),
);
if (sinTexto.length) problemas.push(`Números inválidos: ${sinTexto.join(", ")}`);

if (externas.length) problemas.push(`Pide recursos de internet: ${externas.slice(0, 3).join(", ")}`);

const secciones = await pagina.$$("section[data-captura]");
const capturas = [];
for (const seccion of secciones) {
  const nombre = await seccion.getAttribute("data-captura");
  await seccion.screenshot({ path: join(DESTINO, `${nombre}.png`) });
  capturas.push(`${nombre}.png`);
}
await pagina.screenshot({ path: join(DESTINO, "00-completo.png"), fullPage: true });
capturas.unshift("00-completo.png");
await contexto.close();

const movil = await abrir(390, 844);
const desborde = await movil.pagina.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
if (desborde > 1) problemas.push(`En 390 px la página se desborda ${desborde} px`);
const canvasMovil = await movil.pagina.evaluate(() => [...document.querySelectorAll("canvas")].filter((c) => c.clientWidth < 100).map((c) => c.id));
if (canvasMovil.length) problemas.push(`Gráficos demasiado angostos en 390 px: ${canvasMovil.join(", ")}`);
await movil.pagina.screenshot({ path: join(DESTINO, "99-movil-390.png"), fullPage: true });
capturas.push("99-movil-390.png");
await navegador.close();

console.log(`  Capturas en capturas-dashboard/: ${capturas.join(", ")}`);
if (problemas.length) {
  console.log(`  Problemas de revisión:\n   - ${problemas.join("\n   - ")}`);
  process.exitCode = 1;
} else {
  console.log("  Revisión automática: sin gráficos vacíos, sin textos cortados, sin números inválidos, sin recursos de internet.");
}
