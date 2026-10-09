import { edadActualSemanas, etapaDe, grupoDe } from "@/server/dominio/edad";
import type { GrupoAves, NombreTipo } from "@/server/dominio/tipos";
import { avesDelUsuario, reglasAlimenticias } from "./granja";

export interface AveVista {
  id: number;
  tipo: NombreTipo;
  fechaIngreso: string;
  edadEstimadaIngresoSemanas: number;
  edadActualSemanas: number;
  descripcion: string;
  activo: boolean;
}

export interface GrupoVista {
  clave: GrupoAves;
  titulo: string;
  activos: number;
  aves: AveVista[];
}

const TITULOS: Record<GrupoAves, string> = {
  polluelos: "Polluelos",
  gallinas: "Gallinas adultas",
  gallos: "Gallos adultos",
  patos: "Patos adultos",
};

const ORDEN: GrupoAves[] = ["polluelos", "gallinas", "gallos", "patos"];

export async function gruposDeAves(idUsuario: number, hoy: string): Promise<GrupoVista[]> {
  const [aves, reglas] = await Promise.all([avesDelUsuario(idUsuario), reglasAlimenticias()]);
  const grupos = new Map<GrupoAves, AveVista[]>(ORDEN.map((clave) => [clave, []]));

  for (const ave of aves) {
    const regla = reglas.find((r) => r.tipo === ave.tipo);
    if (!regla) continue;
    const edad = edadActualSemanas(ave, hoy);
    const etapa = etapaDe(edad, regla.limitePollitoSemanas);
    grupos.get(grupoDe(ave.tipo, etapa))?.push({
      id: ave.id,
      tipo: ave.tipo,
      fechaIngreso: ave.fechaIngreso,
      edadEstimadaIngresoSemanas: ave.edadEstimadaIngresoSemanas,
      edadActualSemanas: edad,
      descripcion: ave.descripcion,
      activo: ave.activo,
    });
  }

  return ORDEN.map((clave) => {
    const lista = grupos.get(clave) ?? [];
    return {
      clave,
      titulo: TITULOS[clave],
      activos: lista.filter((a) => a.activo).length,
      aves: lista,
    };
  });
}
