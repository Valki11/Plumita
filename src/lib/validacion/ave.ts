import { z } from "zod";

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escribe una fecha válida");

export const esquemaAve = z.object({
  tipo: z.enum(["gallina", "gallo", "pato"], { error: "Elige el tipo de ave" }),
  fechaIngreso: fecha,
  edadSemanas: z.coerce
    .number({ error: "Escribe la edad en semanas" })
    .int("Usa un número entero")
    .min(0, "No puede ser negativa")
    .max(520, "Parece demasiado"),
  descripcion: z.string().trim().max(120, "Máximo 120 caracteres"),
});

export const esquemaEstadoAve = z.object({
  id: z.coerce.number().int().positive(),
  activo: z.enum(["true", "false"]).transform((valor) => valor === "true"),
});
