import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { FormularioRegistro } from "@/components/app/formulario-registro";
import { usuarioActual } from "@/server/auth/sesion";
import { getEnv } from "@/server/env";

export const dynamic = "force-dynamic";

export default async function Registro() {
  if (await usuarioActual()) redirect("/inicio");
  const abierto = getEnv().REGISTRO_ABIERTO;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        <Link href="/login" className="btn btn-ghost btn-redondo" aria-label="Volver al inicio de sesión">
          <ChevronLeft size={24} strokeWidth={2.75} aria-hidden="true" />
        </Link>
        <h1 style={{ fontSize: 30, margin: 0 }}>Crear cuenta</h1>
      </div>
      {abierto ? (
        <>
          <p className="texto-suave">Crea tu cuenta para llevar el control de la alimentación de tu granja.</p>
          <FormularioRegistro />
          <p className="enlace-pie">
            ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
          </p>
        </>
      ) : (
        <>
          <p className="aviso aviso-error" role="status">
            El registro está cerrado.
          </p>
          <p className="enlace-pie">
            <Link href="/login">Ir a iniciar sesión</Link>
          </p>
        </>
      )}
    </>
  );
}
