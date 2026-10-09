import { z } from "zod";

export const esquemaHorario = z.object({
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Escribe una hora válida"),
});

export const esquemaId = z.object({
  id: z.coerce.number().int().positive(),
});
