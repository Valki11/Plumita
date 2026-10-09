import { diasEntre } from "@/lib/tiempo";
import type { AveDominio, Etapa, GrupoAves, NombreTipo } from "./tipos";

export function semanasTranscurridas(fechaIngreso: string, hoy: string): number {
  return Math.max(0, Math.floor(diasEntre(fechaIngreso, hoy) / 7));
}

export function edadActualSemanas(
  ave: Pick<AveDominio, "fechaIngreso" | "edadEstimadaIngresoSemanas">,
  hoy: string,
): number {
  return ave.edadEstimadaIngresoSemanas + semanasTranscurridas(ave.fechaIngreso, hoy);
}

export function etapaDe(edadSemanas: number, limitePollitoSemanas: number): Etapa {
  return edadSemanas <= limitePollitoSemanas ? "pollito" : "adulto";
}

export function grupoDe(tipo: NombreTipo, etapa: Etapa): GrupoAves {
  if (etapa === "pollito") return "polluelos";
  if (tipo === "gallina") return "gallinas";
  if (tipo === "gallo") return "gallos";
  return "patos";
}
