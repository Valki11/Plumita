import type { PrismaClient } from "@prisma/client";
import { hashearContrasena } from "../src/server/auth/hash";

export async function reiniciarUsuario(
  prisma: PrismaClient,
  nombreUsuario: string,
  contrasena: string,
  celular: string,
) {
  const existente = await prisma.usuario.findUnique({ where: { nombreUsuario } });
  if (existente) {
    const donde = { idUsuario: existente.id };
    await prisma.notificacionEnviada.deleteMany({ where: donde });
    await prisma.horarioAlimentacion.deleteMany({ where: donde });
    await prisma.registroAlimentacion.deleteMany({ where: donde });
    await prisma.compraAlimento.deleteMany({ where: donde });
    await prisma.ave.deleteMany({ where: donde });
    await prisma.usuario.delete({ where: { id: existente.id } });
  }
  return prisma.usuario.create({
    data: { nombreUsuario, contrasenaHash: await hashearContrasena(contrasena), celular },
  });
}
