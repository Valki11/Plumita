import { existsSync } from "node:fs";
import { join } from "node:path";
import { REPORTES, guardar, leer } from "./comun.mjs";

const NOMBRES = {
  "CP-01": "Registro de usuario",
  "CP-02": "Inicio de sesión correcto",
  "CP-03": "Inicio de sesión incorrecto",
  "CP-04": "Ingresar ave",
  "CP-05": "Actualización automática de edad",
  "CP-06": "Cambio de etapa por edad",
  "CP-07": "Inactivar ave",
  "CP-08": "Cálculo de alimento",
  "CP-09": "Registrar alimentación",
  "CP-10": "Registrar compra de alimento",
  "CP-11": "Proyección de compra",
  "CP-12": "Notificación de inventario bajo",
  "CP-13": "Edición de configuración",
  "CP-14": "Vincular Telegram",
  "CP-15": "Recordatorio por horario",
  "CP-16": "Configurar horarios",
  "CP-17": "Sin horarios activos",
};

const NO_INCLUIDOS = new Set(["CP-12", "CP-14", "CP-15"]);

const AUTOMATICAS = {
  "CP-05": [{ archivo: "tests/edad.test.ts", filtro: /edadActualSemanas|semanasTranscurridas/ }],
  "CP-06": [
    { archivo: "tests/edad.test.ts", filtro: /etapaDe|grupoDe/ },
    { archivo: "tests/caso-demo.test.ts", filtro: /pollita en el límite/ },
  ],
  "CP-08": [
    { archivo: "tests/alimento.test.ts", filtro: /consumoDiarioLb|cantidadPorToma|contarPorGrupo/ },
    { archivo: "tests/caso-demo.test.ts", filtro: /0\.69|2\.06/ },
  ],
  "CP-11": [
    { archivo: "tests/inventario.test.ts", filtro: /proyeccion|diasAlcance|inventarioLb/ },
    { archivo: "tests/caso-demo.test.ts", filtro: /14\.68|9 días/ },
  ],
};

const pruebas = leer("pruebas.json");
const ui = existsSync(join(REPORTES, "casos-ui.json")) ? leer("casos-ui.json") : null;
const usabilidad = existsSync(join(REPORTES, "usabilidad-simulada.json")) ? leer("usabilidad-simulada.json") : null;

const COMPLEMENTO_USABILIDAD = {
  "CP-02": "T1",
  "CP-03": "E1",
  "CP-04": "T2",
  "CP-09": "T4",
  "CP-10": "T5",
  "CP-16": "T3",
};

function evaluarAutomatica(especificaciones) {
  const partes = [];
  let todas = true;
  for (const { archivo, filtro } of especificaciones) {
    const entrada = pruebas.archivos.find((a) => a.archivo === archivo);
    const elegidas = entrada ? entrada.pruebas.filter((p) => filtro.test(p.nombre)) : [];
    const aprobadas = elegidas.filter((p) => p.estado === "aprobada").length;
    if (elegidas.length === 0 || aprobadas !== elegidas.length) todas = false;
    partes.push(`${archivo}: ${aprobadas} de ${elegidas.length} pruebas aprobadas`);
  }
  return { ok: todas, evidencia: `Pruebas automáticas. ${partes.join("; ")}` };
}

const casos = Object.entries(NOMBRES).map(([id, nombre]) => {
  if (NO_INCLUIDOS.has(id)) {
    return { id, nombre, estado: "no incluido en beta", evidencia: "Depende de Telegram, que no forma parte de la versión 0.9.0-beta." };
  }
  if (AUTOMATICAS[id]) {
    const { ok, evidencia } = evaluarAutomatica(AUTOMATICAS[id]);
    return { id, nombre, estado: ok ? "aprobado" : "fallido", evidencia };
  }
  const paso = ui?.casos.find((c) => c.id === id);
  if (!paso) return { id, nombre, estado: "fallido", evidencia: "No hay resultado de la simulación para este caso." };
  let evidencia = `Simulación con Playwright (casos-ui.json): ${paso.evidencia}`;
  const tarea = COMPLEMENTO_USABILIDAD[id] && usabilidad?.tareas.find((t) => t.id === COMPLEMENTO_USABILIDAD[id]);
  if (tarea) evidencia += `. También cubierto por la tarea ${tarea.id} de usabilidad-simulada.json (${tarea.exitos} de ${tarea.corridas} corridas).`;
  return { id, nombre, estado: paso.estado, evidencia };
});

const conteo = (estado) => casos.filter((c) => c.estado === estado).length;
guardar("casos-dad.json", {
  documento: "DAD v1.2, sección 5.1 (CP-01 a CP-17)",
  resumen: { aprobados: conteo("aprobado"), fallidos: conteo("fallido"), no_incluidos_en_beta: conteo("no incluido en beta"), total: casos.length },
  casos,
});
