import Decimal from "decimal.js";
import { prisma } from "@/server/db";
import { ahora, deFechaDB, fechaISO } from "@/lib/tiempo";
import { consumoDiarioLb } from "@/server/dominio/alimento";
import { diasAlcance, inventarioLb } from "@/server/dominio/inventario";
import type { AveDominio, NombreTipo, ReglaAlimenticia } from "@/server/dominio/tipos";

export function dec(valor: { toString(): string }): Decimal {
  return new Decimal(valor.toString());
}

export async function reglasAlimenticias(): Promise<ReglaAlimenticia[]> {
  const tipos = await prisma.tipoAve.findMany({ include: { consumos: true }, orderBy: { id: "asc" } });
  return tipos.map((tipo) => {
    const pollito = tipo.consumos.find((c) => c.etapa === "pollito");
    const adulto = tipo.consumos.find((c) => c.etapa === "adulto");
    if (!pollito || !adulto) throw new Error(`Tabla alimenticia incompleta para ${tipo.nombre}`);
    return {
      tipo: tipo.nombre as NombreTipo,
      limitePollitoSemanas: tipo.semanasLimitePollito,
      consumoPollitoLb: dec(pollito.consumoDiarioLb),
      consumoAdultoLb: dec(adulto.consumoDiarioLb),
    };
  });
}

export interface AveRegistrada extends AveDominio {
  id: number;
  descripcion: string;
}

export async function avesDelUsuario(idUsuario: number): Promise<AveRegistrada[]> {
  const aves = await prisma.ave.findMany({
    where: { idUsuario },
    include: { tipo: true },
    orderBy: { id: "asc" },
  });
  return aves.map((ave) => ({
    id: ave.id,
    tipo: ave.tipo.nombre as NombreTipo,
    fechaIngreso: deFechaDB(ave.fechaIngreso),
    edadEstimadaIngresoSemanas: ave.edadEstimadaIngresoSemanas,
    descripcion: ave.descripcion,
    activo: ave.activo,
  }));
}

export async function horariosDelUsuario(idUsuario: number) {
  return prisma.horarioAlimentacion.findMany({ where: { idUsuario }, orderBy: { hora: "asc" } });
}

export async function totalesInventario(idUsuario: number) {
  const [compras, consumo, ultimaCompra] = await Promise.all([
    prisma.compraAlimento.aggregate({ where: { idUsuario }, _sum: { cantidadLb: true } }),
    prisma.registroAlimentacion.aggregate({ where: { idUsuario }, _sum: { cantidadTotalLb: true } }),
    prisma.compraAlimento.findFirst({
      where: { idUsuario },
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
    }),
  ]);
  return {
    comprado: compras._sum.cantidadLb ? dec(compras._sum.cantidadLb) : new Decimal(0),
    consumido: consumo._sum.cantidadTotalLb ? dec(consumo._sum.cantidadTotalLb) : new Decimal(0),
    precioUltimaCompra: ultimaCompra ? dec(ultimaCompra.precioPorLibraQtz) : null,
  };
}

export async function estadoGranja(usuario: { id: number; margenProyeccionPct: { toString(): string } }) {
  const instante = ahora();
  const hoy = fechaISO(instante);
  const [aves, reglas, horarios, totales] = await Promise.all([
    avesDelUsuario(usuario.id),
    reglasAlimenticias(),
    horariosDelUsuario(usuario.id),
    totalesInventario(usuario.id),
  ]);
  const consumoDiario = consumoDiarioLb(aves, reglas, hoy);
  const inventario = inventarioLb([totales.comprado], [totales.consumido]);
  return {
    instante,
    hoy,
    aves,
    reglas,
    horasActivas: horarios.filter((h) => h.activo).map((h) => h.hora),
    consumoDiario,
    inventario,
    diasAlcance: diasAlcance(inventario, consumoDiario),
    precioUltimaCompra: totales.precioUltimaCompra,
    margenPct: dec(usuario.margenProyeccionPct),
  };
}
