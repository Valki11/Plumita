import { describe, expect, it } from "vitest";
import { horarioParaAlimentar, proximaAlimentacion } from "@/server/dominio/horarios";

const min = (h: number, m = 0) => h * 60 + m;

describe("horarioParaAlimentar", () => {
  const horas = ["17:30", "06:30"];

  it("elige el activo más reciente que ya pasó hoy", () => {
    expect(horarioParaAlimentar(horas, min(12))).toBe("06:30");
    expect(horarioParaAlimentar(horas, min(18))).toBe("17:30");
  });

  it("incluye el horario exacto de ahora", () => {
    expect(horarioParaAlimentar(horas, min(6, 30))).toBe("06:30");
  });

  it("elige el próximo si ninguno ha pasado", () => {
    expect(horarioParaAlimentar(horas, min(5))).toBe("06:30");
  });

  it("devuelve null sin horarios", () => {
    expect(horarioParaAlimentar([], min(12))).toBeNull();
  });
});

describe("proximaAlimentacion", () => {
  const horas = ["06:30", "17:30"];

  it("elige el siguiente horario de hoy", () => {
    expect(proximaAlimentacion(horas, min(12))).toEqual({ hora: "17:30", esManana: false });
    expect(proximaAlimentacion(horas, min(5))).toEqual({ hora: "06:30", esManana: false });
  });

  it("pasa a mañana cuando ya pasaron todos", () => {
    expect(proximaAlimentacion(horas, min(18))).toEqual({ hora: "06:30", esManana: true });
    expect(proximaAlimentacion(horas, min(17, 30))).toEqual({ hora: "06:30", esManana: true });
  });

  it("devuelve null sin horarios", () => {
    expect(proximaAlimentacion([], min(12))).toBeNull();
  });
});
