import type Decimal from "decimal.js";

export function formatearLb(cantidad: Decimal | number): string {
  const texto = Number(cantidad.toString()).toFixed(1);
  return `${texto.endsWith(".0") ? texto.slice(0, -2) : texto} lb`;
}

export function formatearQuetzales(monto: Decimal | number): string {
  return `Q${Number(monto.toString()).toFixed(2)}`;
}

export function formatearDias(dias: number): string {
  return dias === 1 ? "1 día" : `${dias} días`;
}

export function formatearSemanas(semanas: number): string {
  return semanas === 1 ? "1 semana" : `${semanas} semanas`;
}
