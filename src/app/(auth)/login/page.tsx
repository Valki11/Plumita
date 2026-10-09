import Link from "next/link";
import { redirect } from "next/navigation";
import { Feather } from "lucide-react";
import { FormularioLogin } from "@/components/app/formulario-login";
import { usuarioActual } from "@/server/auth/sesion";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export default async function Login() {
  if (await usuarioActual()) redirect("/inicio");

  return (
    <>
      <div className="pila" style={{ justifyItems: "center", textAlign: "center", marginBottom: "var(--space-8)" }}>
        <div className="logo logo-grande" aria-hidden="true">
          <Feather size={34} strokeWidth={2.75} />
        </div>
        <h1 style={{ fontSize: 34, margin: 0 }}>Plumita</h1>
        <p className="texto-suave" style={{ margin: 0 }}>
          Control de alimentación de tu granja
        </p>
      </div>
      <FormularioLogin />
      {getEnv().REGISTRO_ABIERTO && (
        <p className="enlace-pie">
          ¿No tienes cuenta? <Link href="/registro">Regístrate</Link>
        </p>
      )}
    </>
  );
}
