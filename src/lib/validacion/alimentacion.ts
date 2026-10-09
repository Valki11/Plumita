import { z } from "zod";

export const esquemaAlimentacion = z.object({
  cantidad: z.coerce
    .number({ error: "Escribe la cantidad" })
    .positive("Debe ser mayor que cero")
    .max(200, "Parece demasiado"),
});

export const esquemaCompra = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escribe una fecha válida"),
  cantidadLb: z.coerce
    .number({ error: "Escribe la cantidad" })
    .positive("Debe ser mayor que cero")
    .max(10000, "Parece demasiado"),
  precioTotalQtz: z.coerce
    .number({ error: "Escribe el precio" })
    .positive("Debe ser mayor que cero")
    .max(1000000, "Parece demasiado"),
});
