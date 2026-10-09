import { PrismaClient } from "@prisma/client";
import { reiniciarUsuario } from "./comun";
import { aFechaDB, ahora, fechaISO, minutosDeHora, sumarDias } from "../src/lib/tiempo";

const prisma = new PrismaClient();

const USUARIO = "rosa";
const CONTRASENA = "plumita123";
const HORARIOS = ["06:30", "12:30", "17:30"];
const POR_TOMA = "1.1";

const AVES = [
  { tipo: "gallina", semanas: 1, hace: 7, descripcion: "Del último nacimiento" },
  { tipo: "gallina", semanas: 3, hace: 14, descripcion: "Aún necesita calor extra" },
  { tipo: "gallo", semanas: 5, hace: 14, descripcion: "Crece rápido esta semana" },
  { tipo: "pato", semanas: 2, hace: 7, descripcion: "Le encanta el agua" },
  { tipo: "gallina", semanas: 30, hace: 60, descripcion: "Buena ponedora" },
  { tipo: "gallina", semanas: 40, hace: 120, descripcion: "Empolla seguido" },
  { tipo: "gallina", semanas: 28, hace: 30, descripcion: "Tranquila, come bien" },
  { tipo: "gallina", semanas: 52, hace: 200, descripcion: "La más vieja del grupo" },
  { tipo: "gallina", semanas: 34, hace: 90, descripcion: "Pone casi todos los días" },
  { tipo: "gallina", semanas: 26, hace: 45, descripcion: "Le gusta el maíz" },
  { tipo: "gallo", semanas: 36, hace: 100, descripcion: "Vigila el gallinero" },
  { tipo: "gallo", semanas: 44, hace: 150, descripcion: "El más grande del corral" },
  { tipo: "pato", semanas: 20, hace: 80, descripcion: "Sigue siempre a las gallinas" },
  { tipo: "pato", semanas: 24, hace: 110, descripcion: "Se aparta del grupo a veces" },
  { tipo: "pato", semanas: 16, hace: 40, descripcion: "Le gusta el agua fresca" },
] as const;

function instante(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00-06:00`);
}

async function main() {
  const usuario = await reiniciarUsuario(prisma, USUARIO, CONTRASENA, "+502 5555 1234");

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
    data: HORARIOS.map((hora) => ({ idUsuario: usuario.id, hora })),
  });

  await prisma.compraAlimento.createMany({
    data: [
      { fecha: sumarDias(hoy, -45), cantidadLb: "25", precioTotalQtz: "112.50", precioPorLibraQtz: "4.5" },
      { fecha: sumarDias(hoy, -12), cantidadLb: "30", precioTotalQtz: "141.00", precioPorLibraQtz: "4.7" },
    ].map((compra) => ({ idUsuario: usuario.id, ...compra, fecha: aFechaDB(compra.fecha) })),
  });

  const minutosAhora = minutosDeHora(
    new Intl.DateTimeFormat("en-GB", { timeZone: "America/Guatemala", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
      ahora(),
    ),
  );
  const registros: { idUsuario: number; fechaHora: Date; cantidadTotalLb: string }[] = [];
  for (let atras = 13; atras >= 0; atras--) {
    const fecha = sumarDias(hoy, -atras);
    for (const hora of HORARIOS) {
      if (atras === 0 && minutosDeHora(hora) > minutosAhora) continue;
      registros.push({ idUsuario: usuario.id, fechaHora: instante(fecha, hora), cantidadTotalLb: POR_TOMA });
    }
  }
  await prisma.registroAlimentacion.createMany({ data: registros });

  console.log(`Datos de demostración listos. Usuario: ${USUARIO}  Contraseña: ${CONTRASENA}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
