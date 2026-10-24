import { execFileSync } from "node:child_process";
import { loadEnv } from "vite";
import { PrismaClient } from "@prisma/client";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    baseDisponible: boolean;
  }
}

export default async function setup(project: TestProject) {
  const env = loadEnv("test", process.cwd(), "");
  const urlBase = env.DATABASE_URL;
  const urlPrueba = (urlBase ?? "").replace(/\/[^/?]+(\?|$)/, "/plumita_test$1");
  project.provide("baseDisponible", false);
  if (!urlBase) {
    console.warn("[pruebas] DATABASE_URL no definida: se omiten las pruebas de integración.");
    return;
  }

  const admin = new PrismaClient({ datasources: { db: { url: urlBase } } });
  try {
    const existe = await admin.$queryRaw<{ n: number }[]>`SELECT 1 AS n FROM pg_database WHERE datname = 'plumita_test'`;
    if (existe.length === 0) await admin.$executeRawUnsafe("CREATE DATABASE plumita_test");
    const entorno = { ...process.env, DATABASE_URL: urlPrueba };
    execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
      env: entorno,
      stdio: "ignore",
    });
    execFileSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"], {
      env: entorno,
      stdio: "ignore",
    });
    project.provide("baseDisponible", true);
  } catch (error) {
    console.warn("[pruebas] Base de datos no disponible: se omiten las pruebas de integración.", String(error).slice(0, 200));
  } finally {
    await admin.$disconnect();
  }
}
