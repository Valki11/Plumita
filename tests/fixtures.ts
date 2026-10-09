import Decimal from "decimal.js";
import type { AveDominio, NombreTipo, ReglaAlimenticia } from "@/server/dominio/tipos";

export const reglas: ReglaAlimenticia[] = [
  { tipo: "gallina", limitePollitoSemanas: 8, consumoPollitoLb: new Decimal("0.07"), consumoAdultoLb: new Decimal("0.24") },
  { tipo: "gallo", limitePollitoSemanas: 8, consumoPollitoLb: new Decimal("0.07"), consumoAdultoLb: new Decimal("0.26") },
  { tipo: "pato", limitePollitoSemanas: 7, consumoPollitoLb: new Decimal("0.13"), consumoAdultoLb: new Decimal("0.37") },
];

export const HOY = "2026-10-20";

export function ave(
  tipo: NombreTipo,
  fechaIngreso: string,
  edadEstimadaIngresoSemanas: number,
  activo = true,
): AveDominio {
  return { tipo, fechaIngreso, edadEstimadaIngresoSemanas, activo };
}

export function granja(): AveDominio[] {
  const aves: AveDominio[] = [];
  for (let i = 0; i < 4; i++) aves.push(ave("gallina", "2026-10-13", 2));
  for (let i = 0; i < 7; i++) aves.push(ave("gallina", "2026-01-01", 20));
  for (let i = 0; i < 2; i++) aves.push(ave("gallo", "2026-01-01", 30));
  for (let i = 0; i < 2; i++) aves.push(ave("pato", "2026-01-01", 12));
  return aves;
}
