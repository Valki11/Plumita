import Decimal from "decimal.js";
import { edadActualSemanas, etapaDe, grupoDe } from "./edad";
import type { AveDominio, Etapa, GrupoAves, ReglaAlimenticia } from "./tipos";

function reglaDe(tipo: AveDominio["tipo"], reglas: ReglaAlimenticia[]): ReglaAlimenticia {
  const regla = reglas.find((r) => r.tipo === tipo);
  if (!regla) throw new Error(`Sin regla alimenticia para ${tipo}`);
  return regla;
}

export function etapaDeAve(ave: AveDominio, reglas: ReglaAlimenticia[], hoy: string): Etapa {
  return etapaDe(edadActualSemanas(ave, hoy), reglaDe(ave.tipo, reglas).limitePollitoSemanas);
}

export function consumoDiarioLb(aves: AveDominio[], reglas: ReglaAlimenticia[], hoy: string): Decimal {
  let total = new Decimal(0);
  for (const ave of aves) {
    if (!ave.activo) continue;
    const regla = reglaDe(ave.tipo, reglas);
    const etapa = etapaDeAve(ave, reglas, hoy);
    total = total.plus(etapa === "pollito" ? regla.consumoPollitoLb : regla.consumoAdultoLb);
  }
  return total;
}

export function contarPorGrupo(
  aves: AveDominio[],
  reglas: ReglaAlimenticia[],
  hoy: string,
): Record<GrupoAves, number> {
  const conteo: Record<GrupoAves, number> = { polluelos: 0, gallinas: 0, gallos: 0, patos: 0 };
  for (const ave of aves) {
    if (!ave.activo) continue;
    conteo[grupoDe(ave.tipo, etapaDeAve(ave, reglas, hoy))] += 1;
  }
  return conteo;
}

export function cantidadPorToma(consumoDiario: Decimal, horariosActivos: number): Decimal | null {
  if (horariosActivos <= 0) return null;
  return consumoDiario.div(horariosActivos);
}

export function redondearLb(cantidad: Decimal): Decimal {
  return cantidad.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}
