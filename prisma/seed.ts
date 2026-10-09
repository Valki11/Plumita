import { PrismaClient, Etapa } from "@prisma/client";

const prisma = new PrismaClient();

const tabla = [
  { nombre: "gallina", limite: 8, pollito: "0.07", adulto: "0.24" },
  { nombre: "gallo", limite: 8, pollito: "0.07", adulto: "0.26" },
  { nombre: "pato", limite: 7, pollito: "0.13", adulto: "0.37" },
];

async function main() {
  for (const fila of tabla) {
    const tipo = await prisma.tipoAve.upsert({
      where: { nombre: fila.nombre },
      update: { semanasLimitePollito: fila.limite },
      create: { nombre: fila.nombre, semanasLimitePollito: fila.limite },
    });
    const consumos: [Etapa, string][] = [
      [Etapa.pollito, fila.pollito],
      [Etapa.adulto, fila.adulto],
    ];
    for (const [etapa, consumo] of consumos) {
      await prisma.tablaAlimenticia.upsert({
        where: { idTipoAve_etapa: { idTipoAve: tipo.id, etapa } },
        update: { consumoDiarioLb: consumo },
        create: { idTipoAve: tipo.id, etapa, consumoDiarioLb: consumo },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
