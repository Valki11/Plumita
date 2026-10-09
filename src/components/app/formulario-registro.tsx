"use client";

import { useActionState } from "react";
import { Campo } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { BotonEnviar } from "@/components/ui/boton-enviar";
import { registrarUsuario } from "@/server/acciones/auth";
import type { Resultado } from "@/server/resultado";

export function FormularioRegistro() {
  const [estado, accion] = useActionState<Resultado, FormData>(registrarUsuario, null);
  const campos = estado && !estado.ok ? estado.campos : undefined;

  return (
    <form action={accion} className="pila-grande" noValidate>
      <Campo
        etiqueta="Usuario"
        nombre="nombreUsuario"
        placeholder="Elige un nombre de usuario"
        autoComplete="username"
        autoCapitalize="none"
        error={campos?.nombreUsuario}
        required
      />
      <Campo
        etiqueta="Contraseña"
        nombre="contrasena"
        type="password"
        placeholder="Crea una contraseña"
        autoComplete="new-password"
        ayuda="Mínimo 8 caracteres"
        error={campos?.contrasena}
        required
      />
      <Campo
        etiqueta="Número de celular"
        nombre="celular"
        type="tel"
        inputMode="tel"
        placeholder="Dato de contacto"
        autoComplete="tel"
        error={campos?.celular}
        required
      />
      <Aviso resultado={estado} />
      <BotonEnviar className="btn btn-primary btn-grande" pendiente="Creando…">
        Crear cuenta
      </BotonEnviar>
    </form>
  );
}
