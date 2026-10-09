"use client";

import { useActionState } from "react";
import { Campo } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { BotonEnviar } from "@/components/ui/boton-enviar";
import { iniciarSesion } from "@/server/acciones/auth";
import type { Resultado } from "@/server/resultado";

export function FormularioLogin() {
  const [estado, accion] = useActionState<Resultado, FormData>(iniciarSesion, null);
  const campos = estado && !estado.ok ? estado.campos : undefined;

  return (
    <form action={accion} className="pila-grande" noValidate>
      <Campo
        etiqueta="Usuario"
        nombre="nombreUsuario"
        placeholder="Tu nombre de usuario"
        autoComplete="username"
        autoCapitalize="none"
        error={campos?.nombreUsuario}
        required
      />
      <Campo
        etiqueta="Contraseña"
        nombre="contrasena"
        type="password"
        placeholder="Tu contraseña"
        autoComplete="current-password"
        error={campos?.contrasena}
        required
      />
      <Aviso resultado={estado} />
      <BotonEnviar className="btn btn-primary btn-grande" pendiente="Entrando…">
        Iniciar sesión
      </BotonEnviar>
    </form>
  );
}
