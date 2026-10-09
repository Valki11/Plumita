import { describe, expect, it } from "vitest";
import { edadActualSemanas, etapaDe, grupoDe, semanasTranscurridas } from "@/server/dominio/edad";

describe("semanasTranscurridas", () => {
  it("es 0 el mismo día del ingreso", () => {
    expect(semanasTranscurridas("2026-10-20", "2026-10-20")).toBe(0);
  });

  it("es 0 a los 6 días y 1 a los 7", () => {
    expect(semanasTranscurridas("2026-10-14", "2026-10-20")).toBe(0);
    expect(semanasTranscurridas("2026-10-13", "2026-10-20")).toBe(1);
  });

  it("cuenta semanas completas", () => {
    expect(semanasTranscurridas("2026-10-06", "2026-10-20")).toBe(2);
    expect(semanasTranscurridas("2026-10-05", "2026-10-20")).toBe(2);
  });

  it("nunca es negativa si la fecha de ingreso es futura", () => {
    expect(semanasTranscurridas("2026-10-25", "2026-10-20")).toBe(0);
  });

  it("cruza cambios de mes y de año", () => {
    expect(semanasTranscurridas("2025-12-25", "2026-01-08")).toBe(2);
  });
});

describe("edadActualSemanas", () => {
  it("suma la edad estimada al ingresar y las semanas transcurridas", () => {
    const ave = { fechaIngreso: "2026-10-06", edadEstimadaIngresoSemanas: 3 };
    expect(edadActualSemanas(ave, "2026-10-20")).toBe(5);
  });

  it("aumenta una semana al pasar siete días", () => {
    const ave = { fechaIngreso: "2026-10-06", edadEstimadaIngresoSemanas: 3 };
    expect(edadActualSemanas(ave, "2026-10-26")).toBe(5);
    expect(edadActualSemanas(ave, "2026-10-27")).toBe(6);
  });
});

describe("etapaDe", () => {
  it("es pollito con edad igual al límite", () => {
    expect(etapaDe(8, 8)).toBe("pollito");
    expect(etapaDe(7, 7)).toBe("pollito");
  });

  it("es adulto una semana después del límite", () => {
    expect(etapaDe(9, 8)).toBe("adulto");
    expect(etapaDe(8, 7)).toBe("adulto");
  });

  it("es pollito con edad 0", () => {
    expect(etapaDe(0, 8)).toBe("pollito");
  });

  it("reclasifica al ave al superar el límite con el paso del tiempo", () => {
    const ave = { fechaIngreso: "2026-10-06", edadEstimadaIngresoSemanas: 6 };
    expect(etapaDe(edadActualSemanas(ave, "2026-10-19"), 8)).toBe("pollito");
    expect(etapaDe(edadActualSemanas(ave, "2026-10-27"), 8)).toBe("adulto");
  });
});

describe("grupoDe", () => {
  it("agrupa todos los pollitos en polluelos", () => {
    expect(grupoDe("gallina", "pollito")).toBe("polluelos");
    expect(grupoDe("gallo", "pollito")).toBe("polluelos");
    expect(grupoDe("pato", "pollito")).toBe("polluelos");
  });

  it("separa los adultos por tipo", () => {
    expect(grupoDe("gallina", "adulto")).toBe("gallinas");
    expect(grupoDe("gallo", "adulto")).toBe("gallos");
    expect(grupoDe("pato", "adulto")).toBe("patos");
  });
});
