import { afterEach, describe, expect, it, vi } from "vitest";
import { redactar, registrarLog } from "@/server/log";

const TOKEN_BOT = "123456789:AAH-abcdefghijklmnopqrstuvwxyz0123456";
const HASH = "$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHQ$aGFzaGhhc2hoYXNoaGFzaA";
const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.firmafirmafirma";

afterEach(() => vi.restoreAllMocks());

describe("redactar", () => {
  it("oculta valores de claves sensibles, también anidadas", () => {
    const salida = JSON.stringify(
      redactar({
        contrasena: "secreta-123",
        contrasenaNueva: "otra-secreta",
        usuario: { passwordHash: HASH, cookie: JWT },
        telegram: { token: TOKEN_BOT, codigoVinculacion: "abc123" },
        lista: [{ authorization: "Bearer x" }],
        nombreUsuario: "rosa",
      }),
    );
    for (const secreto of ["secreta-123", "otra-secreta", HASH, JWT, TOKEN_BOT, "abc123", "Bearer x"]) {
      expect(salida).not.toContain(secreto);
    }
    expect(salida).toContain("rosa");
  });

  it("oculta secretos que aparecen dentro de texto libre", () => {
    const salida = JSON.stringify(
      redactar({
        mensaje: `falló ${TOKEN_BOT} con ${HASH} y ${JWT}`,
        error: new Error(`token ${TOKEN_BOT}`),
      }),
    );
    for (const secreto of [TOKEN_BOT, HASH, JWT]) expect(salida).not.toContain(secreto);
  });

  it("no pierde datos no sensibles ni se cae con fechas y bigint", () => {
    expect(redactar({ cantidad: 2, fecha: new Date("2026-10-20T00:00:00Z"), id: BigInt(5) })).toEqual({
      cantidad: 2,
      fecha: "2026-10-20T00:00:00.000Z",
      id: "5",
    });
  });

  it("corta estructuras demasiado profundas", () => {
    let profundo: Record<string, unknown> = { fin: "x" };
    for (let i = 0; i < 10; i++) profundo = { hijo: profundo };
    expect(JSON.stringify(redactar(profundo))).toContain("[REDACTADO]");
  });
});

describe("registrarLog", () => {
  it("escribe una línea JSON sin datos sensibles", () => {
    const espia = vi.spyOn(console, "log").mockImplementation(() => undefined);
    registrarLog("info", "prueba", { contrasena: "secreta-123", detalle: `token ${TOKEN_BOT}`, ok: true });
    const linea = String(espia.mock.calls[0][0]);
    expect(JSON.parse(linea).evento).toBe("prueba");
    expect(linea).not.toContain("secreta-123");
    expect(linea).not.toContain(TOKEN_BOT);
    expect(linea).toContain("true");
  });

  it("los errores van a stderr", () => {
    const espia = vi.spyOn(console, "error").mockImplementation(() => undefined);
    registrarLog("error", "fallo", { error: new Error("x") });
    expect(espia).toHaveBeenCalledTimes(1);
  });
});
