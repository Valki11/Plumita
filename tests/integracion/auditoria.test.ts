import { afterAll, describe, expect, inject, it } from "vitest";
import { registrarAuditoria } from "@/server/auditoria";
import { prisma } from "@/server/db";

describe.skipIf(!inject("baseDisponible"))("auditoria append-only", () => {
  afterAll(() => prisma.$disconnect());

  it("registra un evento con su detalle redactado", async () => {
    await registrarAuditoria({
      evento: "cambio_contrasena",
      resultado: "exito",
      idUsuario: 7,
      ip: "192.168.1.20",
      userAgent: "pruebas",
      detalle: { contrasena: "secreta-123", motivo: "rutina" },
    });
    const fila = await prisma.auditoria.findFirstOrThrow({
      where: { evento: "cambio_contrasena", idUsuario: 7 },
      orderBy: { id: "desc" },
    });
    expect(fila.resultado).toBe("exito");
    expect(fila.ip).toBe("192.168.1.20");
    expect(JSON.stringify(fila.detalle)).not.toContain("secreta-123");
    expect(JSON.stringify(fila.detalle)).toContain("rutina");
  });

  it("rechaza UPDATE", async () => {
    await registrarAuditoria({ evento: "logout", resultado: "exito" });
    await expect(prisma.$executeRawUnsafe(`UPDATE auditoria SET resultado = 'fallo'`)).rejects.toThrow(/append-only/);
  });

  it("rechaza DELETE", async () => {
    await expect(prisma.$executeRawUnsafe(`DELETE FROM auditoria`)).rejects.toThrow(/append-only/);
  });

  it("rechaza TRUNCATE", async () => {
    await expect(prisma.$executeRawUnsafe(`TRUNCATE TABLE auditoria`)).rejects.toThrow(/append-only/);
  });

  it("las filas siguen intactas tras los intentos", async () => {
    const total = await prisma.auditoria.count();
    expect(total).toBeGreaterThan(0);
  });
});
