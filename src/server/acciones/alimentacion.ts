"use server";

import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";
import { esquemaAlimentacion } from "@/lib/validacion/alimentacion";
import { requerirUsuario } from "@/server/auth/sesion";
import { prisma } from "@/server/db";
import { exito, falloDeZod, type Resultado } from "@/server/resultado";

export async function registrarAlimentacion(_previo: Resultado, formData: FormData): Promise<Resultado> {
  const usuario = await requerirUsuario();
  const datos = esquemaAlimentacion.safeParse(Object.fromEntries(formData));
  if (!datos.success) return falloDeZod(datos.error, formData);

  await prisma.registroAlimentacion.create({
    data: {
      idUsuario: usuario.id,
      cantidadTotalLb: new Decimal(datos.data.cantidad).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString(),
    },
  });
  revalidatePath("/", "layout");
  return exito("Listo, quedó registrado.");
}
