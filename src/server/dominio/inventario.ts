import Decimal from "decimal.js";
import { DIAS_PROYECCION } from "@/lib/constantes";

function sumar(valores: Decimal[]): Decimal {
  return valores.reduce((total, valor) => total.plus(valor), new Decimal(0));
}

export function inventarioLb(compradas: Decimal[], consumidas: Decimal[]): Decimal {
  const saldo = sumar(compradas).minus(sumar(consumidas));
  return saldo.isNegative() ? new Decimal(0) : saldo;
}

export function diasAlcance(inventario: Decimal, consumoDiario: Decimal): number | null {
  if (consumoDiario.lte(0)) return null;
  return inventario.div(consumoDiario).floor().toNumber();
}

export interface Proyeccion {
  libras: Decimal;
  costo: Decimal | null;
}

export function proyeccion(
  consumoDiario: Decimal,
  inventario: Decimal,
  margenPct: Decimal,
  precioUltimaCompra: Decimal | null,
  dias: number = DIAS_PROYECCION,
): Proyeccion {
  const necesario = consumoDiario.times(dias).times(new Decimal(1).plus(margenPct.div(100)));
  const faltante = Decimal.max(0, necesario.minus(inventario));
  const libras = faltante.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const costo = precioUltimaCompra
    ? libras.times(precioUltimaCompra).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    : null;
  return { libras, costo };
}

export function precioPorLibra(totalQtz: Decimal, cantidadLb: Decimal): Decimal {
  return totalQtz.div(cantidadLb).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
}
