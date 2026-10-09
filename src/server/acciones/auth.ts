"use server";

import { redirect } from "next/navigation";
import { esquemaLogin, esquemaRegistro } from "@/lib/validacion/cuenta";
import { hashearContrasena, verificarContrasena } from "@/server/auth/hash";
import { borrarSesion, crearSesion } from "@/server/auth/sesion";
import { prisma } from "@/server/db";
import { getEnv } from "@/server/env";
import { esErrorUnico, fallo, falloDeZod, type Resultado } from "@/server/resultado";

const MENSAJE_CREDENCIALES = "Usuario o contraseña incorrectos.";

let hashFalso: Promise<string> | null = null;

export async function registrarUsuario(_previo: Resultado, formData: FormData): Promise<Resultado> {
  if (!getEnv().REGISTRO_ABIERTO) return fallo("El registro está cerrado.");
  const datos = esquemaRegistro.safeParse(Object.fromEntries(formData));
  if (!datos.success) return falloDeZod(datos.error, formData);

  let idUsuario: number;
  try {
    const usuario = await prisma.usuario.create({
      data: {
        nombreUsuario: datos.data.nombreUsuario,
        contrasenaHash: await hashearContrasena(datos.data.contrasena),
        celular: datos.data.celular,
      },
    });
    idUsuario = usuario.id;
  } catch (error) {
    if (esErrorUnico(error)) {
      return fallo("Revisa los campos marcados.", { nombreUsuario: "Ese usuario ya existe" }, formData);
    }
    throw error;
  }

  await crearSesion(idUsuario);
  redirect("/inicio");
}

export async function iniciarSesion(_previo: Resultado, formData: FormData): Promise<Resultado> {
  const datos = esquemaLogin.safeParse(Object.fromEntries(formData));
  if (!datos.success) return falloDeZod(datos.error, formData);

  const usuario = await prisma.usuario.findUnique({ where: { nombreUsuario: datos.data.nombreUsuario } });
  if (!usuario) {
    hashFalso ??= hashearContrasena("contrasena-inexistente");
    await verificarContrasena(await hashFalso, datos.data.contrasena);
    return fallo(MENSAJE_CREDENCIALES, undefined, formData);
  }
  if (!(await verificarContrasena(usuario.contrasenaHash, datos.data.contrasena))) {
    return fallo(MENSAJE_CREDENCIALES, undefined, formData);
  }

  await crearSesion(usuario.id);
  redirect("/inicio");
}

export async function cerrarSesion(): Promise<void> {
  await borrarSesion();
  redirect("/login");
}
