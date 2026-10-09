"use server";

import { revalidatePath } from "next/cache";
import { aFechaDB, ahora, esFechaValida, fechaISO } from "@/lib/tiempo";
import { esquemaAve, esquemaEstadoAve } from "@/lib/validacion/ave";
import { esquemaId } from "@/lib/validacion/horario";
import { requerirUsuario } from "@/server/auth/sesion";
import { prisma } from "@/server/db";
import { exito, fallo, falloDeZod, type Resultado } from "@/server/resultado";

function refrescar() {
  revalidatePath("/", "layout");
}

function errorDeFecha(fechaIngreso: string): Resultado | null {
  if (!esFechaValida(fechaIngreso)) return fallo("Revisa los campos marcados.", { fechaIngreso: "Escribe una fecha válida" });
  if (fechaIngreso > fechaISO(ahora())) {
    return fallo("Revisa los campos marcados.", { fechaIngreso: "La fecha no puede ser futura" });
  }
  return null;
}

export async function crearAve(_previo: Resultado, formData: FormData): Promise<Resultado> {
  const usuario = await requerirUsuario();
  const datos = esquemaAve.safeParse(Object.fromEntries(formData));
  if (!datos.success) return falloDeZod(datos.error);
  const errorFecha = errorDeFecha(datos.data.fechaIngreso);
  if (errorFecha) return errorFecha;

  const tipo = await prisma.tipoAve.findUnique({ where: { nombre: datos.data.tipo } });
  if (!tipo) return fallo("No se encontró el tipo de ave.");

  await prisma.ave.create({
    data: {
      idUsuario: usuario.id,
      idTipoAve: tipo.id,
      fechaIngreso: aFechaDB(datos.data.fechaIngreso),
      edadEstimadaIngresoSemanas: datos.data.edadSemanas,
      descripcion: datos.data.descripcion,
    },
  });
  refrescar();
  return exito();
}

export async function editarAve(_previo: Resultado, formData: FormData): Promise<Resultado> {
  const usuario = await requerirUsuario();
  const entrada = Object.fromEntries(formData);
  const id = esquemaId.safeParse(entrada);
  const datos = esquemaAve.omit({ tipo: true }).safeParse(entrada);
  if (!id.success) return fallo("No se encontró el ave.");
  if (!datos.success) return falloDeZod(datos.error);
  const errorFecha = errorDeFecha(datos.data.fechaIngreso);
  if (errorFecha) return errorFecha;

  const { count } = await prisma.ave.updateMany({
    where: { id: id.data.id, idUsuario: usuario.id },
    data: {
      fechaIngreso: aFechaDB(datos.data.fechaIngreso),
      edadEstimadaIngresoSemanas: datos.data.edadSemanas,
      descripcion: datos.data.descripcion,
    },
  });
  if (count === 0) return fallo("No se encontró el ave.");
  refrescar();
  return exito();
}

export async function cambiarEstadoAve(formData: FormData): Promise<void> {
  const usuario = await requerirUsuario();
  const datos = esquemaEstadoAve.safeParse(Object.fromEntries(formData));
  if (!datos.success) return;
  await prisma.ave.updateMany({
    where: { id: datos.data.id, idUsuario: usuario.id },
    data: { activo: datos.data.activo },
  });
  refrescar();
}
