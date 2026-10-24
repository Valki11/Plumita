import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

const env = loadEnv("test", process.cwd(), "");
const urlPrueba = (env.DATABASE_URL ?? "").replace(/\/[^/?]+(\?|$)/, "/plumita_test$1");

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/global-setup.ts"],
    fileParallelism: false,
    env: {
      DATABASE_URL: urlPrueba,
      SESSION_SECRET: "secreto-de-pruebas-secreto-de-pruebas-0123456789",
      COOKIE_SECURE: "false",
      REGISTRO_ABIERTO: "true",
    },
  },
});
