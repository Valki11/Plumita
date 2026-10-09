"use server";

import { revalidatePath } from "next/cache";
import { esquemaCuenta } from "@/lib/validacion/cuenta";
import { hashearContrasena } from "@/server/auth/hash";
import { requerirUsuario } from "@/server/auth/sesion";
import { prisma } from "@/server/db";
import { exito, falloDeZod, type Resultado } from "@/server/resultado";

export async function actualizarCuenta(_previo: Resultado, formData: FormData): Promise<Resultado> {
  const usuario = await requerirUsuario();
  const datos = esquemaCuenta.safeParse(Object.fromEntries(formData));
  if (!datos.success) return falloDeZod(datos.error);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      celular: datos.data.celular,
      ...(datos.data.contrasenaNueva
        ? { contrasenaHash: await hashearContrasena(datos.data.contrasenaNueva) }
        : {}),
    },
  });
  revalidatePath("/ajustes");
  return exito("Cambios guardados.");
}
