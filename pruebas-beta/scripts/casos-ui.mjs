import { BASE, VIEWPORT, borrarUsuario, guardar, lanzarNavegador } from "./comun.mjs";

const USUARIO = "simulacion";
const CLAVE = "simulacion-clave-1";
const CLAVE_NUEVA = "simulacion-clave-2";
const CELULAR = "+502 5555 0101";
const CELULAR_NUEVO = "+502 5555 0202";

const resultados = [];
async function paso(id, nombre, evidencia, accion) {
  const inicio = Date.now();
  try {
    await accion();
    resultados.push({ id, nombre, estado: "aprobado", evidencia, duracion_ms: Date.now() - inicio });
    console.log(`  OK    ${id} ${nombre}`);
  } catch (error) {
    resultados.push({ id, nombre, estado: "fallido", evidencia: `${evidencia}. Error: ${String(error.message).split("\n")[0]}`, duracion_ms: Date.now() - inicio });
    console.log(`  FALLA ${id} ${nombre}: ${String(error.message).split("\n")[0]}`);
  }
}

function esperar(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}

const { navegador, nombre: nombreNavegador } = await lanzarNavegador();
borrarUsuario(USUARIO);

async function contextoNuevo() {
  const contexto = await navegador.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true });
  const pagina = await contexto.newPage();
  pagina.setDefaultTimeout(15000);
  return { contexto, pagina };
}

async function iniciarSesion(pagina, usuario, clave) {
  await pagina.goto(`${BASE}/login`);
  await pagina.fill("#campo-nombreUsuario", usuario);
  await pagina.fill("#campo-contrasena", clave);
  await pagina.click("button[type=submit]");
}

async function cerrarSesion(pagina) {
  await pagina.goto(`${BASE}/ajustes`);
  await pagina.click("text=Cerrar sesión");
  await pagina.waitForURL("**/login");
}

const textoMain = (pagina) => pagina.locator("main").textContent();

let { pagina } = await contextoNuevo();

await paso("CP-01", "Registro de usuario", "Se crea la cuenta desde /registro y queda con sesión abierta en /inicio", async () => {
  await pagina.goto(`${BASE}/registro`);
  await pagina.fill("#campo-nombreUsuario", USUARIO);
  await pagina.fill("#campo-contrasena", CLAVE);
  await pagina.fill("#campo-celular", CELULAR);
  await pagina.click("button[type=submit]");
  await pagina.waitForURL("**/inicio");
});

await paso("CP-02", "Inicio de sesión correcto", "Usuario y contraseña correctos llevan a /inicio", async () => {
  await cerrarSesion(pagina);
  await iniciarSesion(pagina, USUARIO, CLAVE);
  await pagina.waitForURL("**/inicio");
  esperar((await textoMain(pagina)).includes(`Hola, ${USUARIO}`), "No saluda a la usuaria");
});

await paso("CP-03", "Inicio de sesión incorrecto", "Contraseña errónea muestra el mensaje y no deja entrar", async () => {
  await cerrarSesion(pagina);
  await iniciarSesion(pagina, USUARIO, "contrasena-equivocada");
  await pagina.waitForSelector(".aviso-error");
  esperar((await pagina.locator(".aviso-error").textContent()).includes("Usuario o contraseña incorrectos"), "Mensaje distinto");
  esperar(pagina.url().includes("/login"), "Salió de /login");
  await iniciarSesion(pagina, USUARIO, CLAVE);
  await pagina.waitForURL("**/inicio");
});

await paso("CP-04", "Ingresar ave", "El ave aparece en Mis aves, en Gallinas adultas", async () => {
  await pagina.goto(`${BASE}/aves`);
  await pagina.click("button[aria-label='Agregar ave']");
  await pagina.fill("#campo-edadSemanas", "30");
  await pagina.fill("#campo-descripcion", "Ave de simulación");
  await pagina.click("dialog button[type=submit]");
  await pagina.waitForSelector("dialog", { state: "hidden" });
  const texto = await textoMain(pagina);
  esperar(texto.includes("Ave de simulación"), "El ave no aparece");
  esperar(/Gallinas adultas\s*1 activa/.test(texto), "No cuenta en Gallinas adultas");
});

await paso("CP-07", "Inactivar ave", "El ave deja de contar como activa y conserva su fila como Inactiva, con Reactivar", async () => {
  await pagina.goto(`${BASE}/aves`);
  await pagina.click("summary:has-text('Gallinas adultas')");
  await pagina.click("text=Inactivar");
  await pagina.waitForFunction(() => document.querySelector("main")?.textContent?.includes("Reactivar"));
  const texto = await textoMain(pagina);
  esperar(/Gallinas adultas\s*0 activas/.test(texto), "Sigue contando como activa");
  esperar(texto.includes("Inactiva") && texto.includes("Ave de simulación"), "No conserva el ave");
  await pagina.click("text=Reactivar");
  await pagina.waitForFunction(() => document.querySelector("main")?.textContent?.includes("Inactivar"));
});

await paso("CP-16", "Configurar horarios", "Agregar, editar y desactivar un horario; la lista y el interruptor responden", async () => {
  await pagina.goto(`${BASE}/ajustes`);
  await pagina.click("button:has-text('Agregar')");
  await pagina.fill("#campo-hora", "07:00");
  await pagina.click("dialog button[type=submit]");
  await pagina.waitForSelector("dialog", { state: "hidden" });
  esperar((await textoMain(pagina)).includes("7:00 a.m."), "No aparece el horario agregado");
  await pagina.locator("section[aria-labelledby=titulo-horarios] button:has-text('Editar')").first().click();
  await pagina.fill("#campo-hora", "08:30");
  await pagina.click("dialog button[type=submit]");
  await pagina.waitForSelector("dialog", { state: "hidden" });
  esperar((await textoMain(pagina)).includes("8:30 a.m."), "No aparece el horario editado");
  await pagina.locator("button[role=switch]").first().click();
  await pagina.waitForFunction(() => document.querySelector("button[role=switch]")?.getAttribute("aria-checked") === "false");
});

await paso("CP-17", "Sin horarios activos", "Con el único horario desactivado, Alimentar pide configurar uno antes de calcular la toma", async () => {
  await pagina.goto(`${BASE}/alimentar`);
  const texto = await textoMain(pagina);
  esperar(texto.includes("Configura al menos un horario"), "No pide configurar un horario");
  esperar(!texto.includes("Ya les di de comer"), "Ofrece registrar sin horario activo");
  await pagina.goto(`${BASE}/ajustes`);
  await pagina.locator("button[role=switch]").first().click();
  await pagina.waitForFunction(() => document.querySelector("button[role=switch]")?.getAttribute("aria-checked") === "true");
});

await paso("CP-09", "Registrar alimentación", "La cantidad sale prellenada, se registra y aparece en el historial con su hora", async () => {
  await pagina.goto(`${BASE}/alimentar`);
  const valor = await pagina.inputValue("#campo-cantidad");
  esperar(Number(valor) > 0, "La cantidad no viene prellenada");
  await pagina.click("text=Ya les di de comer");
  await pagina.waitForSelector("[role=status]");
  await pagina.reload();
  const texto = await textoMain(pagina);
  esperar(texto.includes("Hoy") && /\d:\d\d [ap]\.m\./.test(texto), "El historial no muestra el registro");
});

await paso("CP-10", "Registrar compra de alimento", "La compra aparece en el historial y el inventario sube", async () => {
  await pagina.goto(`${BASE}/inventario`);
  const antes = await textoMain(pagina);
  await pagina.click("text=Registrar compra");
  await pagina.fill("#campo-cantidadLb", "25");
  await pagina.fill("#campo-precioTotalQtz", "75");
  await pagina.click("dialog button[type=submit]");
  await pagina.waitForSelector("dialog", { state: "hidden" });
  const despues = await textoMain(pagina);
  esperar(despues.includes("Q75.00") && despues.includes("25 lb"), "La compra no aparece en el historial");
  const lb = (t) => Number(/Disponible ahora\s*([\d.]+)\s*lb/i.exec(t)?.[1]);
  esperar(lb(despues) > lb(antes), `El inventario no subió (${lb(antes)} -> ${lb(despues)})`);
});

await paso("CP-13", "Edición de configuración", "Cambia celular y contraseña; el celular queda guardado y el login funciona con la contraseña nueva", async () => {
  await pagina.goto(`${BASE}/ajustes`);
  await pagina.fill("#campo-celular", CELULAR_NUEVO);
  await pagina.fill("#campo-contrasenaNueva", CLAVE_NUEVA);
  await pagina.click("text=Guardar cambios");
  await pagina.waitForSelector("[role=status]");
  await pagina.reload();
  esperar((await pagina.inputValue("#campo-celular")) === CELULAR_NUEVO, "El celular no quedó guardado");
  await cerrarSesion(pagina);
  await iniciarSesion(pagina, USUARIO, CLAVE_NUEVA);
  await pagina.waitForURL("**/inicio");
});

await navegador.close();

const aprobados = resultados.filter((r) => r.estado === "aprobado").length;
guardar("casos-ui.json", {
  tipo: "simulada",
  navegador: nombreNavegador,
  viewport: VIEWPORT,
  usuario: USUARIO,
  total: resultados.length,
  aprobados,
  fallidos: resultados.length - aprobados,
  casos: resultados,
});
if (aprobados !== resultados.length) process.exitCode = 1;
