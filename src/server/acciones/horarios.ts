"use server";

import { revalidatePath } from "next/cache";
import { MAX_HORARIOS } from "@/lib/constantes";
import { esquemaHorario, esquemaId } from "@/lib/validacion/horario";
import { requerirUsuario } from "@/server/auth/sesion";
import { prisma } from "@/server/db";
import { esErrorUnico, exito, fallo, falloDeZod, type Resultado } from "@/server/resultado";

function refrescar() {
  revalidatePath("/", "layout");
}

const MENSAJE_DUPLICADO = { hora: "Ya tienes un horario a esa hora" };

export async function crearHorario(_previo: Resultado, formData: FormData): Promise<Resultado> {
  const usuario = await requerirUsuario();
  const datos = esquemaHorario.safeParse(Object.fromEntries(formData));
  if (!datos.success) return falloDeZod(datos.error, formData);

  const total = await prisma.horarioAlimentacion.count({ where: { idUsuario: usuario.id } });
  if (total >= MAX_HORARIOS) return fallo(`Puedes tener hasta ${MAX_HORARIOS} horarios.`);

  try {
    await prisma.horarioAlimentacion.create({ data: { idUsuario: usuario.id, hora: datos.data.hora } });
  } catch (error) {
    if (esErrorUnico(error)) return fallo("Revisa el campo marcado.", MENSAJE_DUPLICADO, formData);
    throw error;
  }
  refrescar();
  return exito();
}

export async function editarHorario(_previo: Resultado, formData: FormData): Promise<Resultado> {
  const usuario = await requerirUsuario();
  const entrada = Object.fromEntries(formData);
  const datos = esquemaHorario.safeParse(entrada);
  const id = esquemaId.safeParse(entrada);
  if (!datos.success) return falloDeZod(datos.error, formData);
  if (!id.success) return fallo("No se encontró el horario.");

  try {
    const { count } = await prisma.horarioAlimentacion.updateMany({
      where: { id: id.data.id, idUsuario: usuario.id },
      data: { hora: datos.data.hora },
    });
    if (count === 0) return fallo("No se encontró el horario.");
  } catch (error) {
    if (esErrorUnico(error)) return fallo("Revisa el campo marcado.", MENSAJE_DUPLICADO, formData);
    throw error;
  }
  refrescar();
  return exito();
}

export async function cambiarEstadoHorario(formData: FormData): Promise<void> {
  const usuario = await requerirUsuario();
  const id = esquemaId.safeParse(Object.fromEntries(formData));
  if (!id.success) return;
  const activo = formData.get("activo") === "true";
  await prisma.horarioAlimentacion.updateMany({
    where: { id: id.data.id, idUsuario: usuario.id },
    data: { activo },
  });
  refrescar();
}

export async function eliminarHorario(formData: FormData): Promise<void> {
  const usuario = await requerirUsuario();
  const id = esquemaId.safeParse(Object.fromEntries(formData));
  if (!id.success) return;
  await prisma.horarioAlimentacion.deleteMany({ where: { id: id.data.id, idUsuario: usuario.id } });
  refrescar();
}
