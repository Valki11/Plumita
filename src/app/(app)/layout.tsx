import { BarraSuperior, NavegacionInferior } from "@/components/app/marco-app";
import { requerirUsuario } from "@/server/auth/sesion";

export const dynamic = "force-dynamic";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  await requerirUsuario();
  return (
    <div className="marco">
      <BarraSuperior />
      <main className="marco-contenido pantalla">{children}</main>
      <NavegacionInferior />
    </div>
  );
}
