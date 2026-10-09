import { PrismaClient } from "@prisma/client";
import { aFechaDB, ahora, fechaISO, sumarDias } from "../src/lib/tiempo";
import { reiniciarUsuario } from "./comun";

const prisma = new PrismaClient();

const USUARIO = "demo";
const CONTRASENA = "plumita123";

const AVES = [
  ...Array.from({ length: 4 }, () => ({ tipo: "gallina", semanas: 30, hace: 60, descripcion: "Gallina adulta" })),
  ...Array.from({ length: 2 }, () => ({ tipo: "gallo", semanas: 40, hace: 60, descripcion: "Gallo adulto" })),
  { tipo: "gallina", semanas: 2, hace: 7, descripcion: "Pollita de 3 semanas" },
  { tipo: "gallina", semanas: 4, hace: 14, descripcion: "Pollita de 6 semanas" },
  { tipo: "gallina", semanas: 8, hace: 0, descripcion: "En el límite: pasa a adulta en 7 días" },
  { tipo: "pato", semanas: 20, hace: 60, descripcion: "Pato adulto" },
];

async function main() {
  const usuario = await reiniciarUsuario(prisma, USUARIO, CONTRASENA, "+502 5555 0000");
  const tipos = await prisma.tipoAve.findMany();
  const hoy = fechaISO(ahora());

  for (const ave of AVES) {
    const tipo = tipos.find((t) => t.nombre === ave.tipo);
    if (!tipo) throw new Error(`Falta el tipo ${ave.tipo}. Ejecuta primero: npm run seed`);
    await prisma.ave.create({
      data: {
        idUsuario: usuario.id,
        idTipoAve: tipo.id,
        fechaIngreso: aFechaDB(sumarDias(hoy, -ave.hace)),
        edadEstimadaIngresoSemanas: ave.semanas,
        descripcion: ave.descripcion,
      },
    });
  }

  await prisma.horarioAlimentacion.createMany({
    data: ["07:00", "12:00", "17:00"].map((hora) => ({ idUsuario: usuario.id, hora })),
  });

  await prisma.compraAlimento.create({
    data: {
      idUsuario: usuario.id,
      fecha: aFechaDB(hoy),
      cantidadLb: "20",
      precioTotalQtz: "60",
      precioPorLibraQtz: "3",
    },
  });

  console.log(`Caso de demostración listo. Usuario: ${USUARIO}  Contraseña: ${CONTRASENA}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
