import Decimal from "decimal.js";
import { consumoDiarioLb } from "../../src/server/dominio/alimento";
import { diasAlcance, proyeccion } from "../../src/server/dominio/inventario";
import { sumarDias } from "../../src/lib/tiempo";
import { ave, reglas } from "../../tests/fixtures";

const SEMILLA = 20261030;
const INICIO = "2026-10-20";
const DIAS = 30;
const TOMAS_POR_DIA = 3;
const INVENTARIO_INICIAL_LB = 20;
const BOLSA_LB = 25;
const PRECIO_LB_QTZ = 3;
const DIAS_DE_ENTREGA = 1;
const UMBRAL_ALCANCE_DIAS = 3;
const MARGEN_PCT = 10;
const FRACCION_RACION_INCOMPLETA = 0.7;

function mulberry32(semilla: number) {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const aves = [
  ...Array.from({ length: 4 }, () => ave("gallina", sumarDias(INICIO, -60), 30)),
  ...Array.from({ length: 2 }, () => ave("gallo", sumarDias(INICIO, -60), 40)),
  ave("gallina", sumarDias(INICIO, -7), 2),
  ave("gallina", sumarDias(INICIO, -14), 4),
  ave("gallina", INICIO, 8),
  ave("pato", sumarDias(INICIO, -60), 20),
];

const r2 = (n: number) => Math.round(n * 100) / 100;

type Modo = "a_ojo" | "plumita";

function simular(modo: Modo, semilla: number, variacion: number) {
  const azar = mulberry32(semilla);
  let inventario = INVENTARIO_INICIAL_LB;
  let pedido: { llegaDia: number; libras: number } | null = null;
  const serie: Record<string, number | string>[] = [];
  const compras: { dia: number; fecha: string; libras: number; gasto: number }[] = [];
  let diasSinAlimento = 0;
  let diasRacionIncompleta = 0;
  let masLb = 0;
  let menosLb = 0;
  let totalDado = 0;
  let totalRecomendado = 0;

  for (let dia = 0; dia < DIAS; dia++) {
    const hoy = sumarDias(INICIO, dia);
    if (pedido && pedido.llegaDia === dia) {
      inventario += pedido.libras;
      pedido = null;
    }
    const recomendado = consumoDiarioLb(aves, reglas, hoy);

    let compradoHoy = 0;
    if (!pedido) {
      let libras = 0;
      if (modo === "a_ojo" && inventario <= 0.0001) libras = BOLSA_LB;
      if (modo === "plumita") {
        const alcance = diasAlcance(new Decimal(inventario), recomendado);
        if (alcance !== null && alcance <= UMBRAL_ALCANCE_DIAS) {
          const faltante = proyeccion(recomendado, new Decimal(inventario), new Decimal(MARGEN_PCT), new Decimal(PRECIO_LB_QTZ)).libras;
          libras = Math.max(1, Math.ceil(faltante.toNumber() / BOLSA_LB)) * BOLSA_LB;
        }
      }
      if (libras > 0) {
        pedido = { llegaDia: dia + DIAS_DE_ENTREGA, libras };
        compras.push({ dia: dia + 1, fecha: hoy, libras, gasto: r2(libras * PRECIO_LB_QTZ) });
        compradoHoy = libras;
      }
    }

    let dado = 0;
    const porToma = recomendado.toNumber() / TOMAS_POR_DIA;
    for (let toma = 0; toma < TOMAS_POR_DIA; toma++) {
      const deseado = porToma * (1 + (azar() * 2 - 1) * variacion);
      const entregado = Math.min(deseado, Math.max(inventario, 0));
      inventario -= entregado;
      dado += entregado;
    }

    const rec = recomendado.toNumber();
    if (dado < 0.0001) diasSinAlimento += 1;
    if (dado < rec * FRACCION_RACION_INCOMPLETA) diasRacionIncompleta += 1;
    masLb += Math.max(0, dado - rec);
    menosLb += Math.max(0, rec - dado);
    totalDado += dado;
    totalRecomendado += rec;

    serie.push({
      dia: dia + 1,
      fecha: hoy,
      recomendado_lb: r2(rec),
      dado_lb: r2(dado),
      comprado_lb: compradoHoy,
      inventario_fin_lb: r2(Math.max(inventario, 0)),
    });
  }

  const libras = compras.reduce((s, c) => s + c.libras, 0);
  return {
    resumen: {
      dias_sin_alimento: diasSinAlimento,
      dias_con_racion_incompleta: diasRacionIncompleta,
      libras_de_mas_vs_recomendado: r2(masLb),
      libras_de_menos_vs_recomendado: r2(menosLb),
      diferencia_neta_lb: r2(totalDado - totalRecomendado),
      libras_dadas: r2(totalDado),
      libras_recomendadas: r2(totalRecomendado),
      libras_compradas: libras,
      gasto_total_qtz: r2(libras * PRECIO_LB_QTZ),
      numero_de_compras: compras.length,
      inventario_final_lb: r2(Math.max(inventario, 0)),
    },
    compras,
    serie_diaria: serie,
  };
}

const salida = {
  tipo: "simulada",
  semilla: SEMILLA,
  inicio: INICIO,
  dias: DIAS,
  supuestos: [
    "Mismas aves que seed:caso: 4 gallinas adultas, 2 gallos adultos, 3 gallinas en etapa pollito (con 2, 4 y 8 semanas al ingresar) y 1 pato adulto. Las pollitas maduran durante los 30 días y el consumo recomendado sube con ellas.",
    `${TOMAS_POR_DIA} tomas al día. El consumo recomendado sale de consumoDiarioLb (dominio real) con la tabla alimenticia del DAD.`,
    "A ojo: cada toma varía al azar de forma uniforme entre -30 % y +30 % de lo recomendado. Compra una bolsa solo cuando el inventario llega a cero.",
    "Plumita: cada toma varía entre -5 % y +5 % de lo recomendado. Compra cuando diasAlcance es 3 o menos, la cantidad que da proyeccion (15 días, margen 10 %) redondeada hacia arriba a bolsas de 25 lb.",
    `Ambos inician con ${INVENTARIO_INICIAL_LB} lb, compran bolsas de ${BOLSA_LB} lb a Q${PRECIO_LB_QTZ.toFixed(2)} la libra y la compra llega ${DIAS_DE_ENTREGA} día después de pedirla. El gasto se cuenta al pedir.`,
    "Sin pedido pendiente no se vuelve a pedir. Si el inventario no alcanza para una toma, se da lo que quede.",
    `Día sin alimento: no se pudo dar nada en todo el día. Ración incompleta: se dio menos del ${FRACCION_RACION_INCOMPLETA * 100} % de lo recomendado.`,
    "Libras de más y de menos se suman día por día frente a lo recomendado; la diferencia neta es dado menos recomendado.",
    "Las dos corridas usan semillas fijas derivadas de la semilla principal: el resultado es reproducible.",
  ],
  escenarios: {
    a_ojo: simular("a_ojo", SEMILLA, 0.3),
    plumita: simular("plumita", SEMILLA + 1, 0.05),
  },
};

process.stdout.write(JSON.stringify(salida));
