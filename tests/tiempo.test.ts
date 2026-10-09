import { describe, expect, it } from "vitest";
import {
  diasEntre,
  etiquetaDia,
  fechaISO,
  formatearFechaCorta,
  formatearHora,
  horaHHMM,
  minutosDelDia,
  sumarDias,
} from "@/lib/tiempo";

describe("zona horaria de Guatemala", () => {
  it("convierte UTC a UTC-6 y mantiene el día anterior en la noche", () => {
    const instante = new Date("2026-10-21T03:00:00Z");
    expect(fechaISO(instante)).toBe("2026-10-20");
    expect(horaHHMM(instante)).toBe("21:00");
  });

  it("cambia de día a medianoche local", () => {
    expect(fechaISO(new Date("2026-10-21T05:59:00Z"))).toBe("2026-10-20");
    expect(fechaISO(new Date("2026-10-21T06:00:00Z"))).toBe("2026-10-21");
    expect(horaHHMM(new Date("2026-10-21T06:00:00Z"))).toBe("00:00");
  });

  it("calcula los minutos del día locales", () => {
    expect(minutosDelDia(new Date("2026-10-20T12:30:00Z"))).toBe(6 * 60 + 30);
  });
});

describe("fechas calendario", () => {
  it("calcula diferencias y sumas de días", () => {
    expect(diasEntre("2026-10-13", "2026-10-20")).toBe(7);
    expect(sumarDias("2026-10-31", 1)).toBe("2026-11-01");
  });
});

describe("formato", () => {
  it("muestra horas en 12 horas con a. m. y p. m.", () => {
    expect(formatearHora("06:30")).toBe("6:30 a.m.");
    expect(formatearHora("12:00")).toBe("12:00 p.m.");
    expect(formatearHora("00:05")).toBe("12:05 a.m.");
    expect(formatearHora("17:30")).toBe("5:30 p.m.");
  });

  it("muestra fechas cortas", () => {
    expect(formatearFechaCorta("2026-08-10")).toBe("10 ago");
  });

  it("etiqueta el día respecto a hoy", () => {
    const hoy = new Date("2026-10-20T18:00:00Z");
    expect(etiquetaDia(new Date("2026-10-20T12:30:00Z"), hoy)).toBe("Hoy");
    expect(etiquetaDia(new Date("2026-10-19T12:30:00Z"), hoy)).toBe("Ayer");
    expect(etiquetaDia(new Date("2026-10-18T12:30:00Z"), hoy)).toBe("Anteayer");
    expect(etiquetaDia(new Date("2026-10-10T12:30:00Z"), hoy)).toBe("10 oct");
  });
});
