import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { DIAS_SESION, NOMBRE_COOKIE_SESION } from "@/lib/constantes";
import { prisma } from "@/server/db";
import { getEnv } from "@/server/env";

function clave() {
  return new TextEncoder().encode(getEnv().SESSION_SECRET);
}

export async function crearSesion(idUsuario: number): Promise<void> {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(idUsuario))
    .setIssuedAt()
    .setExpirationTime(`${DIAS_SESION}d`)
    .sign(clave());
  const almacen = await cookies();
  almacen.set(NOMBRE_COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().COOKIE_SECURE,
    path: "/",
    maxAge: DIAS_SESION * 24 * 60 * 60,
  });
}

export async function borrarSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(NOMBRE_COOKIE_SESION);
}

async function idDeSesion(): Promise<number | null> {
  const almacen = await cookies();
  const token = almacen.get(NOMBRE_COOKIE_SESION)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

export const usuarioActual = cache(async () => {
  const id = await idDeSesion();
  if (id === null) return null;
  return prisma.usuario.findUnique({ where: { id } });
});

export async function requerirUsuario() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}
