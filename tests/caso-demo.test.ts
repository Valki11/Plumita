import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { cantidadPorToma, consumoDiarioLb, contarPorGrupo, redondearLb } from "@/server/dominio/alimento";
import { edadActualSemanas, etapaDe } from "@/server/dominio/edad";
import { diasAlcance, inventarioLb, proyeccion } from "@/server/dominio/inventario";
import { ave, reglas } from "./fixtures";

const HOY = "2026-10-20";

function casoDemo() {
  const aves = [
    ...Array.from({ length: 4 }, () => ave("gallina", "2026-08-21", 30)),
    ...Array.from({ length: 2 }, () => ave("gallo", "2026-08-21", 40)),
    ave("gallina", "2026-10-13", 2),
    ave("gallina", "2026-10-06", 4),
    ave("gallina", HOY, 8),
    ave("pato", "2026-08-21", 20),
  ];
  return aves;
}

describe("caso de demostración: 4 gallinas, 2 gallos, 3 pollitas y 1 pato; 3 horarios; 20 lb por Q60", () => {
  const aves = casoDemo();
  const consumo = consumoDiarioLb(aves, reglas, HOY);
  const porToma = redondearLb(cantidadPorToma(consumo, 3)!);
  const inventario = inventarioLb([new Decimal(20)], [porToma]);
  const precio = new Decimal(60).div(20);

  it("agrupa las aves como se muestra en Mis aves", () => {
    expect(contarPorGrupo(aves, reglas, HOY)).toEqual({ polluelos: 3, gallinas: 4, gallos: 2, patos: 1 });
  });

  it("consume 2.06 lb al día", () => {
    expect(consumo.toString()).toBe("2.06");
  });

  it("da 0.69 lb por toma con 3 horarios", () => {
    expect(porToma.toString()).toBe("0.69");
  });

  it("deja 19.31 lb tras registrar una toma", () => {
    expect(inventario.toString()).toBe("19.31");
  });

  it("alcanza para 9 días", () => {
    expect(diasAlcance(inventario, consumo)).toBe(9);
  });

  it("proyecta 14.68 lb por comprar y Q44.04", () => {
    const resultado = proyeccion(consumo, inventario, new Decimal(10), precio);
    expect(resultado.libras.toString()).toBe("14.68");
    expect(resultado.costo?.toString()).toBe("44.04");
  });

  it("la pollita en el límite sigue siendo pollito hoy y pasa a adulta siete días después", () => {
    const enElLimite = { fechaIngreso: HOY, edadEstimadaIngresoSemanas: 8 };
    expect(etapaDe(edadActualSemanas(enElLimite, HOY), 8)).toBe("pollito");
    expect(etapaDe(edadActualSemanas(enElLimite, "2026-10-26"), 8)).toBe("pollito");
    expect(etapaDe(edadActualSemanas(enElLimite, "2026-10-27"), 8)).toBe("adulto");
  });
});
