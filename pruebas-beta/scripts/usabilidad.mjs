import { join } from "node:path";
import { BASE, CAPTURAS, VIEWPORT, borrarUsuario, guardar, lanzarNavegador, promedio, redondear, sql, vaciarDatosDe } from "./comun.mjs";

const USUARIO = "simulacion";
const CLAVE = "simulacion-clave-1";
const CORRIDAS = 5;

const TAREAS = [
  ["T1", "Iniciar sesión"],
  ["T2", "Registrar un ave"],
  ["T3", "Configurar un horario"],
  ["T4", "Ver la cantidad por toma y registrar una alimentación"],
  ["T5", "Registrar una compra"],
  ["T6", "Consultar la proyección de 15 días"],
  ["E1", "Error a propósito: contraseña incorrecta"],
  ["E2", "Error a propósito: compra con cantidad 0"],
  ["E3", "Error a propósito: cuarto horario"],
];

const { navegador, nombre: nombreNavegador } = await lanzarNavegador();
const medidas = Object.fromEntries(TAREAS.map(([id]) => [id, []]));

async function nuevaPagina() {
  const contexto = await navegador.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true });
  const pagina = await contexto.newPage();
  pagina.setDefaultTimeout(15000);
  return { contexto, pagina };
}

function medidor(pagina) {
  const estado = { clics: 0 };
  return {
    estado,
    async clic(localizador) {
      estado.clics += 1;
      await localizador.click();
    },
  };
}

async function medir(id, corrida, pagina, accion, mensajeEsperado = null) {
  const m = medidor(pagina);
  const inicio = performance.now();
  let exito = false;
  let mensaje = null;
  let detalle = null;
  try {
    mensaje = await accion(m);
    exito = true;
  } catch (error) {
    detalle = String(error.message).split("\n")[0];
  }
  const ms = Math.round(performance.now() - inicio);
  medidas[id].push({
    corrida,
    exito,
    tiempo_ms: ms,
    clics: m.estado.clics,
    mensaje_error_aparecio: mensajeEsperado ? exito && mensaje === mensajeEsperado : null,
    detalle,
  });
  if (corrida === 1) await pagina.screenshot({ path: join(CAPTURAS, `${id}.png`) });
  console.log(`  ${exito ? "OK   " : "FALLA"} corrida ${corrida} ${id} ${ms} ms ${m.estado.clics} clics`);
}

const nav = (pagina, nombre) => pagina.locator("nav[aria-label=Principal]").getByRole("link", { name: nombre, exact: true });

async function registrarUsuarioBase() {
  const { contexto, pagina } = await nuevaPagina();
  await pagina.goto(`${BASE}/registro`);
  await pagina.fill("#campo-nombreUsuario", USUARIO);
  await pagina.fill("#campo-contrasena", CLAVE);
  await pagina.fill("#campo-celular", "+502 5555 0101");
  await pagina.click("button[type=submit]");
  await pagina.waitForURL("**/inicio");
  await contexto.close();
}

borrarUsuario(USUARIO);
await registrarUsuarioBase();

for (let corrida = 1; corrida <= CORRIDAS; corrida++) {
  console.log(`Corrida ${corrida} de ${CORRIDAS}`);
  vaciarDatosDe(USUARIO);
  const { contexto, pagina } = await nuevaPagina();

  await medir("T1", corrida, pagina, async (m) => {
    await pagina.goto(`${BASE}/login`);
    await pagina.fill("#campo-nombreUsuario", USUARIO);
    await pagina.fill("#campo-contrasena", CLAVE);
    await m.clic(pagina.locator("button[type=submit]"));
    await pagina.waitForURL("**/inicio");
    if (!(await pagina.locator("main").textContent()).includes(`Hola, ${USUARIO}`)) throw new Error("No saluda");
  });

  await medir("T2", corrida, pagina, async (m) => {
    await m.clic(nav(pagina, "Mis aves"));
    await m.clic(pagina.locator("button[aria-label='Agregar ave']"));
    await pagina.fill("#campo-edadSemanas", "30");
    await pagina.fill("#campo-descripcion", "Ave de simulación");
    await m.clic(pagina.locator("dialog button[type=submit]"));
    await pagina.waitForSelector("dialog", { state: "hidden" });
    if (!/Gallinas adultas\s*1 activa/.test(await pagina.locator("main").textContent())) throw new Error("El ave no cuenta");
  });

  await medir("T3", corrida, pagina, async (m) => {
    await m.clic(nav(pagina, "Ajustes"));
    await m.clic(pagina.locator("button:has-text('Agregar')"));
    await pagina.fill("#campo-hora", "07:00");
    await m.clic(pagina.locator("dialog button[type=submit]"));
    await pagina.waitForSelector("dialog", { state: "hidden" });
    if (!(await pagina.locator("main").textContent()).includes("7:00 a.m.")) throw new Error("No aparece el horario");
  });

  await medir("T4", corrida, pagina, async (m) => {
    await m.clic(nav(pagina, "Alimentar"));
    const tarjeta = (await pagina.locator(".tarjeta-centro").textContent()) ?? "";
    if (!tarjeta.includes("0.24 lb")) throw new Error(`Cantidad inesperada: ${tarjeta}`);
    await m.clic(pagina.locator("text=Ya les di de comer"));
    await pagina.waitForSelector("[role=status]");
    await pagina.reload();
    if (!(await pagina.locator("main").textContent()).includes("Hoy")) throw new Error("No aparece en el historial");
  });

  await medir("T5", corrida, pagina, async (m) => {
    await m.clic(nav(pagina, "Inventario"));
    await m.clic(pagina.locator("text=Registrar compra"));
    await pagina.fill("#campo-cantidadLb", "25");
    await pagina.fill("#campo-precioTotalQtz", "75");
    await m.clic(pagina.locator("dialog button[type=submit]"));
    await pagina.waitForSelector("dialog", { state: "hidden" });
    if (!(await pagina.locator("main").textContent()).includes("Q75.00")) throw new Error("No aparece la compra");
  });

  await medir("T6", corrida, pagina, async (m) => {
    await m.clic(nav(pagina, "Inicio"));
    await pagina.waitForURL("**/inicio");
    await m.clic(nav(pagina, "Inventario"));
    await pagina.waitForURL("**/inventario");
    await pagina.waitForSelector("text=Proyección a 15 días");
    const texto = (await pagina.locator("main").textContent()) ?? "";
    if (!texto.includes("Proyección a 15 días") || !/Necesitarás comprar|alimento suficiente/.test(texto)) throw new Error("No hay proyección");
  });

  await medir(
    "E3",
    corrida,
    pagina,
    async (m) => {
      await m.clic(nav(pagina, "Ajustes"));
      for (const hora of ["12:00", "17:00"]) {
        await pagina.locator("button:has-text('Agregar')").click();
        await pagina.fill("#campo-hora", hora);
        await pagina.locator("dialog button[type=submit]").click();
        await pagina.waitForSelector("dialog", { state: "hidden" });
      }
      if (!(await pagina.locator("button:has-text('Agregar')").isDisabled())) throw new Error("El botón sigue activo");
      return (await pagina.locator("main").textContent()).includes("Llegaste al máximo de 3 horarios.") ? "Llegaste al máximo de 3 horarios." : null;
    },
    "Llegaste al máximo de 3 horarios.",
  );

  await medir(
    "E2",
    corrida,
    pagina,
    async (m) => {
      await m.clic(nav(pagina, "Inventario"));
      await m.clic(pagina.locator("text=Registrar compra"));
      await pagina.fill("#campo-cantidadLb", "0");
      await pagina.fill("#campo-precioTotalQtz", "10");
      await m.clic(pagina.locator("dialog button[type=submit]"));
      await pagina.waitForSelector("dialog .error-campo");
      return (await pagina.locator("dialog .error-campo").first().textContent())?.trim();
    },
    "Debe ser mayor que cero",
  );
  await contexto.close();

  const { contexto: contextoLogin, pagina: paginaLogin } = await nuevaPagina();
  await medir(
    "E1",
    corrida,
    paginaLogin,
    async (m) => {
      await paginaLogin.goto(`${BASE}/login`);
      await paginaLogin.fill("#campo-nombreUsuario", USUARIO);
      await paginaLogin.fill("#campo-contrasena", "contrasena-equivocada");
      await m.clic(paginaLogin.locator("button[type=submit]"));
      await paginaLogin.waitForSelector(".aviso-error");
      return (await paginaLogin.locator(".aviso-error").textContent())?.trim();
    },
    "Usuario o contraseña incorrectos.",
  );
  await contextoLogin.close();
}

await navegador.close();
vaciarDatosDe(USUARIO);

const tareas = TAREAS.map(([id, nombre]) => {
  const lista = medidas[id];
  const exitos = lista.filter((x) => x.exito).length;
  const esError = id.startsWith("E");
  return {
    id,
    nombre,
    tipo_de_tarea: esError ? "error a propósito" : "tarea",
    corridas: lista.length,
    exitos,
    tasa_de_exito_pct: redondear((exitos / lista.length) * 100, 0),
    tiempo_promedio_ms: Math.round(promedio(lista.map((x) => x.tiempo_ms))),
    tiempo_maximo_ms: Math.max(...lista.map((x) => x.tiempo_ms)),
    clics_promedio: redondear(promedio(lista.map((x) => x.clics)), 1),
    mensaje_de_error_aparecio: esError ? `${lista.filter((x) => x.mensaje_error_aparecio).length} de ${lista.length}` : null,
    captura: `capturas/${id}.png`,
    detalle_por_corrida: lista,
  };
});

guardar("usabilidad-simulada.json", {
  tipo: "simulada",
  aviso: "Es una simulación automática con Playwright. Mide que los flujos funcionen y cuántos pasos requieren; los tiempos son de un script, no de una persona. No reemplaza una prueba de usabilidad con la usuaria real.",
  navegador: nombreNavegador,
  viewport: VIEWPORT,
  usuario: USUARIO,
  corridas: CORRIDAS,
  nota_de_orden: "T3 (horario) se ejecuta antes de T4 porque Alimentar necesita un horario activo para calcular la toma.",
  tareas,
});
const fallos = tareas.filter((t) => t.exitos < t.corridas).length;
console.log(`Tareas con algún fallo: ${fallos}`);
if (fallos) process.exitCode = 1;
