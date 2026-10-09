import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { cantidadPorToma, consumoDiarioLb, contarPorGrupo, redondearLb } from "@/server/dominio/alimento";
import { ave, granja, HOY, reglas } from "./fixtures";

describe("consumoDiarioLb", () => {
  it("suma el consumo por tipo y etapa de una granja de 15 aves", () => {
    expect(consumoDiarioLb(granja(), reglas, HOY).toString()).toBe("3.22");
  });

  it("usa el consumo de pollito mientras el ave no supera el límite", () => {
    const aves = [ave("pato", "2026-10-13", 6)];
    expect(consumoDiarioLb(aves, reglas, HOY).toString()).toBe("0.13");
  });

  it("cambia al consumo de adulto cuando supera el límite", () => {
    const aves = [ave("pato", "2026-10-06", 6)];
    expect(consumoDiarioLb(aves, reglas, HOY).toString()).toBe("0.37");
  });

  it("ignora las aves inactivas", () => {
    const aves = [ave("gallina", "2026-01-01", 20), ave("gallina", "2026-01-01", 20, false)];
    expect(consumoDiarioLb(aves, reglas, HOY).toString()).toBe("0.24");
  });

  it("es 0 sin aves", () => {
    expect(consumoDiarioLb([], reglas, HOY).toString()).toBe("0");
  });
});

describe("contarPorGrupo", () => {
  it("separa polluelos y adultos por tipo", () => {
    expect(contarPorGrupo(granja(), reglas, HOY)).toEqual({
      polluelos: 4,
      gallinas: 7,
      gallos: 2,
      patos: 2,
    });
  });

  it("no cuenta aves inactivas", () => {
    const aves = [ave("gallo", "2026-01-01", 30, false)];
    expect(contarPorGrupo(aves, reglas, HOY).gallos).toBe(0);
  });
});

describe("cantidadPorToma", () => {
  const consumo = new Decimal("3.22");

  it("divide el consumo diario entre los horarios activos", () => {
    expect(cantidadPorToma(consumo, 2)?.toString()).toBe("1.61");
    expect(cantidadPorToma(consumo, 1)?.toString()).toBe("3.22");
    expect(cantidadPorToma(new Decimal("3"), 3)?.toString()).toBe("1");
  });

  it("devuelve null sin horarios activos", () => {
    expect(cantidadPorToma(consumo, 0)).toBeNull();
  });

  it("es 0 sin aves", () => {
    expect(cantidadPorToma(new Decimal(0), 2)?.toString()).toBe("0");
  });
});

describe("redondearLb", () => {
  it("redondea a dos decimales hacia arriba en la mitad", () => {
    expect(redondearLb(new Decimal("0.686666")).toString()).toBe("0.69");
    expect(redondearLb(new Decimal("1.005")).toString()).toBe("1.01");
    expect(redondearLb(new Decimal("1.004")).toString()).toBe("1");
  });
});
