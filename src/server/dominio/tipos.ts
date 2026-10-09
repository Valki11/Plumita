import type Decimal from "decimal.js";

export type NombreTipo = "gallina" | "gallo" | "pato";
export type Etapa = "pollito" | "adulto";
export type GrupoAves = "polluelos" | "gallinas" | "gallos" | "patos";

export interface AveDominio {
  tipo: NombreTipo;
  fechaIngreso: string;
  edadEstimadaIngresoSemanas: number;
  activo: boolean;
}

export interface ReglaAlimenticia {
  tipo: NombreTipo;
  limitePollitoSemanas: number;
  consumoPollitoLb: Decimal;
  consumoAdultoLb: Decimal;
}
