import { z } from "zod";

const celular = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 -]{6,18}[0-9]$/, "Escribe un número de celular válido");

export const esquemaRegistro = z.object({
  nombreUsuario: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,40}$/, "Usa de 3 a 40 letras minúsculas, números, punto o guion"),
  contrasena: z.string().min(8, "Mínimo 8 caracteres").max(128, "Máximo 128 caracteres"),
  celular,
});

export const esquemaLogin = z.object({
  nombreUsuario: z.string().trim().toLowerCase().min(1, "Escribe tu usuario"),
  contrasena: z.string().min(1, "Escribe tu contraseña"),
});

export const esquemaCuenta = z.object({
  celular,
  contrasenaNueva: z
    .string()
    .max(128, "Máximo 128 caracteres")
    .refine((valor) => valor === "" || valor.length >= 8, "Mínimo 8 caracteres"),
});
