import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { redactar, registrarLog } from "@/server/log";

export const EVENTOS_AUDITORIA = [
  "login_exitoso",
  "login_fallido",
  "logout",
  "registro",
  "cambio_contrasena",
  "cambio_celular",
  "telegram_vinculado",
  "telegram_desvinculado",
  "acceso_denegado",
  "limite_intentos",
  "purga_auditoria",
] as const;

export type EventoAuditoria = (typeof EVENTOS_AUDITORIA)[number];
export type ResultadoAuditoria = "exito" | "fallo" | "denegado";

export interface EntradaAuditoria {
  evento: EventoAuditoria;
  resultado: ResultadoAuditoria;
  idUsuario?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  detalle?: Record<string, unknown>;
}

export async function registrarAuditoria(entrada: EntradaAuditoria): Promise<void> {
  try {
    await prisma.auditoria.create({
      data: {
        evento: entrada.evento,
        resultado: entrada.resultado,
        idUsuario: entrada.idUsuario ?? null,
        ip: entrada.ip?.slice(0, 45) ?? null,
        userAgent: entrada.userAgent?.slice(0, 200) ?? null,
        detalle: entrada.detalle ? (redactar(entrada.detalle) as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  } catch (error) {
    registrarLog("error", "auditoria_fallo", { evento: entrada.evento, error });
  }
}
