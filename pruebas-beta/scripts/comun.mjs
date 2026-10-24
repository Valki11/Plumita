import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const REPORTES = join(RAIZ, "pruebas-beta", "reportes");
export const CAPTURAS = join(REPORTES, "capturas");
export const BASE = process.env.BASE_URL ?? "http://localhost:3000";
export const VIEWPORT = { width: 390, height: 844 };

mkdirSync(CAPTURAS, { recursive: true });

function git(...args) {
  try {
    return execFileSync("git", args, { cwd: RAIZ, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

export function meta() {
  const paquete = JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8"));
  const cambios = git("status", "--porcelain", "--", ".", ":!pruebas-beta");
  return {
    fecha: new Date().toISOString(),
    version: paquete.version,
    commit: git("rev-parse", "--short", "HEAD"),
    cambios_sin_commit_en_la_app: cambios ? cambios.split("\n").length : 0,
    base_url: BASE,
  };
}

export function guardar(nombre, datos) {
  const ruta = join(REPORTES, nombre);
  writeFileSync(ruta, JSON.stringify({ meta: meta(), ...datos }, null, 2) + "\n", "utf8");
  console.log(`  -> ${nombre}`);
  return ruta;
}

export function leer(nombre) {
  return JSON.parse(readFileSync(join(REPORTES, nombre), "utf8"));
}

export function sql(consulta) {
  return execFileSync(
    "docker",
    ["exec", "plumita-db-1", "psql", "-U", "plumita", "-d", "plumita", "-tAc", consulta],
    { encoding: "utf8" },
  ).trim();
}

export function borrarUsuario(nombre) {
  const id = sql(`SELECT id_usuario FROM usuario WHERE nombre_usuario = '${nombre}'`);
  if (!id) return;
  for (const tabla of [
    "notificacion_enviada",
    "horario_alimentacion",
    "registro_alimentacion",
    "compra_alimento",
    "ave",
  ]) {
    sql(`DELETE FROM ${tabla} WHERE id_usuario = ${id}`);
  }
  sql(`DELETE FROM usuario WHERE id_usuario = ${id}`);
}

export function vaciarDatosDe(nombre) {
  const id = sql(`SELECT id_usuario FROM usuario WHERE nombre_usuario = '${nombre}'`);
  if (!id) return;
  for (const tabla of [
    "notificacion_enviada",
    "horario_alimentacion",
    "registro_alimentacion",
    "compra_alimento",
    "ave",
  ]) {
    sql(`DELETE FROM ${tabla} WHERE id_usuario = ${id}`);
  }
  sql(`UPDATE usuario SET alerta_inventario_enviada = false WHERE id_usuario = ${id}`);
}

export async function lanzarNavegador() {
  const { chromium } = await import("playwright-core");
  try {
    const navegador = await chromium.launch();
    return { navegador, nombre: "Chromium de Playwright" };
  } catch {
    const navegador = await chromium.launch({
      executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    });
    return { navegador, nombre: "Microsoft Edge (Chromium)" };
  }
}

export function rutaNavegador() {
  return "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
}

export async function cookieDeSesion(usuario, clave) {
  const { navegador } = await lanzarNavegador();
  const contexto = await navegador.newContext({ viewport: VIEWPORT });
  const pagina = await contexto.newPage();
  await pagina.goto(`${BASE}/login`);
  await pagina.fill("#campo-nombreUsuario", usuario);
  await pagina.fill("#campo-contrasena", clave);
  await pagina.click("button[type=submit]");
  await pagina.waitForURL("**/inicio");
  const cookies = await contexto.cookies();
  await navegador.close();
  const sesion = cookies.find((c) => c.name === "plumita_sesion");
  if (!sesion) throw new Error("No se obtuvo la cookie de sesión");
  return sesion.value;
}

export function promedio(valores) {
  return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
}

export function redondear(valor, decimales = 2) {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}
