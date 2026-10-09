import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ estado: "ok" });
  } catch {
    return Response.json({ estado: "error" }, { status: 503 });
  }
}
