import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { diasAlcance, inventarioLb, precioPorLibra, proyeccion } from "@/server/dominio/inventario";

const d = (valor: string) => new Decimal(valor);

describe("inventarioLb", () => {
  it("es compras menos consumo registrado", () => {
    expect(inventarioLb([d("25"), d("25")], [d("1.4"), d("1.4")]).toString()).toBe("47.2");
  });

  it("es 0 sin movimientos", () => {
    expect(inventarioLb([], []).toString()).toBe("0");
  });

  it("nunca es negativo si se consumió más de lo comprado", () => {
    expect(inventarioLb([d("5")], [d("8")]).toString()).toBe("0");
  });

  it("con consumo y sin compras es 0", () => {
    expect(inventarioLb([], [d("1.4")]).toString()).toBe("0");
  });
});

describe("diasAlcance", () => {
  it("redondea hacia abajo", () => {
    expect(diasAlcance(d("18"), d("3.22"))).toBe(5);
    expect(diasAlcance(d("3.22"), d("3.22"))).toBe(1);
    expect(diasAlcance(d("3.2"), d("3.22"))).toBe(0);
  });

  it("es null sin aves activas", () => {
    expect(diasAlcance(d("18"), d("0"))).toBeNull();
  });

  it("es 0 con inventario vacío", () => {
    expect(diasAlcance(d("0"), d("3.22"))).toBe(0);
  });
});

describe("proyeccion", () => {
  const consumo = d("3.22");
  const margen = d("10");

  it("calcula libras con margen y costo con el precio de la última compra", () => {
    const resultado = proyeccion(consumo, d("18"), margen, d("2"));
    expect(resultado.libras.toString()).toBe("35.1");
    expect(resultado.costo?.toString()).toBe("70.2");
  });

  it("aplica el margen sobre 15 días de consumo", () => {
    const resultado = proyeccion(consumo, d("0"), margen, null);
    expect(resultado.libras.toString()).toBe("53.1");
  });

  it("es 0 cuando el inventario cubre los 15 días con margen", () => {
    const resultado = proyeccion(consumo, d("60"), margen, d("2"));
    expect(resultado.libras.toString()).toBe("0");
    expect(resultado.costo?.toString()).toBe("0");
  });

  it("no devuelve costo si todavía no hay compras", () => {
    const resultado = proyeccion(consumo, d("18"), margen, null);
    expect(resultado.libras.toString()).toBe("35.1");
    expect(resultado.costo).toBeNull();
  });

  it("es 0 sin aves activas", () => {
    const resultado = proyeccion(d("0"), d("10"), margen, d("2"));
    expect(resultado.libras.toString()).toBe("0");
  });

  it("respeta un margen distinto", () => {
    const resultado = proyeccion(d("2"), d("0"), d("0"), null);
    expect(resultado.libras.toString()).toBe("30");
  });
});

describe("precioPorLibra", () => {
  it("divide el total entre las libras con 4 decimales", () => {
    expect(precioPorLibra(d("100"), d("25")).toString()).toBe("4");
    expect(precioPorLibra(d("13.75"), d("25")).toString()).toBe("0.55");
    expect(precioPorLibra(d("10"), d("3")).toString()).toBe("3.3333");
  });
});
