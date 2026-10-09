"use server";

import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";
import { aFechaDB, ahora, esFechaValida, fechaISO } from "@/lib/tiempo";
import { esquemaCompra } from "@/lib/validacion/alimentacion";
import { requerirUsuario } from "@/server/auth/sesion";
import { prisma } from "@/server/db";
import { precioPorLibra } from "@/server/dominio/inventario";
import { exito, fallo, falloDeZod, type Resultado } from "@/server/resultado";

export async function registrarCompra(_previo: Resultado, formData: FormData): Promise<Resultado> {
  const usuario = await requerirUsuario();
  const datos = esquemaCompra.safeParse(Object.fromEntries(formData));
  if (!datos.success) return falloDeZod(datos.error, formData);
  if (!esFechaValida(datos.data.fecha)) {
    return fallo("Revisa los campos marcados.", { fecha: "Escribe una fecha válida" }, formData);
  }
  if (datos.data.fecha > fechaISO(ahora())) {
    return fallo("Revisa los campos marcados.", { fecha: "La fecha no puede ser futura" }, formData);
  }

  const cantidad = new Decimal(datos.data.cantidadLb).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const total = new Decimal(datos.data.precioTotalQtz).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  if (cantidad.lte(0) || total.lte(0)) return fallo("Revisa los campos marcados.", { cantidadLb: "Debe ser mayor que cero" }, formData);

  await prisma.compraAlimento.create({
    data: {
      idUsuario: usuario.id,
      fecha: aFechaDB(datos.data.fecha),
      cantidadLb: cantidad.toString(),
      precioTotalQtz: total.toString(),
      precioPorLibraQtz: precioPorLibra(total, cantidad).toString(),
    },
  });
  await prisma.usuario.update({ where: { id: usuario.id }, data: { alertaInventarioEnviada: false } });
  revalidatePath("/", "layout");
  return exito();
}
