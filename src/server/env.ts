import { z } from "zod";

const esquema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  REGISTRO_ABIERTO: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
});

type Env = z.infer<typeof esquema>;

let cache: Env | null = null;

export function getEnv(): Env {
  if (!cache) cache = esquema.parse(process.env);
  return cache;
}
