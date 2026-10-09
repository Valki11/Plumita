import type { z } from "zod";

export type Resultado =
  | { ok: true; mensaje?: string }
  | { ok: false; mensaje: string; campos?: Record<string, string>; valores?: Record<string, string> }
  | null;

export function exito(mensaje?: string): Resultado {
  return { ok: true, mensaje };
}

export function valoresDe(formData: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [nombre, valor] of formData.entries()) {
    if (typeof valor === "string" && !nombre.startsWith("$") && !nombre.toLowerCase().includes("contrasena")) {
      valores[nombre] = valor;
    }
  }
  return valores;
}

export function fallo(mensaje: string, campos?: Record<string, string>, formData?: FormData): Resultado {
  return { ok: false, mensaje, campos, valores: formData ? valoresDe(formData) : undefined };
}

export function camposDeZod(error: z.ZodError): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const problema of error.issues) {
    const nombre = String(problema.path[0] ?? "");
    if (nombre && !(nombre in campos)) campos[nombre] = problema.message;
  }
  return campos;
}

export function falloDeZod(error: z.ZodError, formData: FormData): Resultado {
  return fallo("Revisa los campos marcados.", camposDeZod(error), formData);
}

export function esErrorUnico(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}
