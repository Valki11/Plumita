"use client";

import { useActionState } from "react";
import { Campo } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { BotonEnviar } from "@/components/ui/boton-enviar";
import { actualizarCuenta } from "@/server/acciones/cuenta";
import type { Resultado } from "@/server/resultado";

export function FormularioCuenta({ celular }: { celular: string }) {
  const [estado, accion] = useActionState<Resultado, FormData>(actualizarCuenta, null);
  const campos = estado && !estado.ok ? estado.campos : undefined;

  return (
    <form action={accion} className="pila" noValidate>
      <Campo
        etiqueta="Número de celular"
        nombre="celular"
        type="tel"
        inputMode="tel"
        defaultValue={celular}
        autoComplete="tel"
        error={campos?.celular}
      />
      <Campo
        etiqueta="Nueva contraseña"
        nombre="contrasenaNueva"
        type="password"
        placeholder="Dejar en blanco para no cambiar"
        autoComplete="new-password"
        error={campos?.contrasenaNueva}
      />
      <Aviso resultado={estado} />
      <BotonEnviar className="btn btn-primary btn-grande">Guardar cambios</BotonEnviar>
    </form>
  );
}
