import { BASE, cookieDeSesion, guardar, rutaNavegador, redondear } from "./comun.mjs";

const USUARIO = process.env.USUARIO_LECTURA ?? "demo";
const CLAVE = process.env.CLAVE_LECTURA ?? "plumita123";
const CORRIDAS = 3;
const PAGINAS = ["/inicio", "/alimentar", "/inventario"];

const { default: lighthouse } = await import("lighthouse");
const chromeLauncher = await import("chrome-launcher");

const cookie = await cookieDeSesion(USUARIO, CLAVE);
const mediana = (valores) => {
  const orden = [...valores].sort((a, b) => a - b);
  return orden[Math.floor(orden.length / 2)];
};

const chrome = await chromeLauncher.launch({
  chromePath: rutaNavegador(),
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
});

const paginas = [];
try {
  for (const ruta of PAGINAS) {
    const corridas = [];
    for (let i = 0; i < CORRIDAS; i++) {
      const resultado = await lighthouse(`${BASE}${ruta}`, {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: ["performance", "accessibility", "best-practices"],
        extraHeaders: { Cookie: `plumita_sesion=${cookie}` },
      });
      const lhr = resultado.lhr;
      if (lhr.finalDisplayedUrl && !lhr.finalDisplayedUrl.endsWith(ruta)) {
        throw new Error(`Lighthouse terminó en ${lhr.finalDisplayedUrl}, no en ${ruta}: la sesión no se aplicó`);
      }
      corridas.push({
        rendimiento: Math.round(lhr.categories.performance.score * 100),
        accesibilidad: Math.round(lhr.categories.accessibility.score * 100),
        buenas_practicas: Math.round(lhr.categories["best-practices"].score * 100),
        lcp_ms: Math.round(lhr.audits["largest-contentful-paint"].numericValue),
        cls: redondear(lhr.audits["cumulative-layout-shift"].numericValue, 3),
        tbt_ms: Math.round(lhr.audits["total-blocking-time"].numericValue),
      });
      console.log(`  ${ruta} corrida ${i + 1}: ${JSON.stringify(corridas[i])}`);
    }
    const campo = (clave) => corridas.map((c) => c[clave]);
    paginas.push({
      ruta,
      mediana: {
        rendimiento: mediana(campo("rendimiento")),
        accesibilidad: mediana(campo("accesibilidad")),
        buenas_practicas: mediana(campo("buenas_practicas")),
        lcp_ms: mediana(campo("lcp_ms")),
        cls: mediana(campo("cls")),
        tbt_ms: mediana(campo("tbt_ms")),
      },
      corridas,
    });
  }
} finally {
  await chrome.kill();
}

guardar("lighthouse.json", {
  herramienta: "lighthouse (npm)",
  modo: "móvil (emulación y limitación de red por defecto de Lighthouse)",
  sesion: `iniciada con la cuenta ${USUARIO}, solo lectura`,
  corridas_por_pagina: CORRIDAS,
  nota: "Se reporta la mediana de las corridas. Mide la imagen de producción en esta laptop, por localhost.",
  paginas,
});
