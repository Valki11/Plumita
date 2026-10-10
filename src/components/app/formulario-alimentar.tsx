"use client";

import { useActionState } from "react";
import { Campo } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { BotonEnviar } from "@/components/ui/boton-enviar";
import { IconoGrafico } from "@/components/ui/icono-grafico";
import { registrarAlimentacion } from "@/server/acciones/alimentacion";
import type { Resultado } from "@/server/resultado";

export function FormularioAlimentar({ cantidadSugerida }: { cantidadSugerida: string }) {
  const [estado, accion] = useActionState<Resultado, FormData>(registrarAlimentacion, null);
  const campos = estado && !estado.ok ? estado.campos : undefined;
  const valores = estado && !estado.ok ? estado.valores : undefined;

  return (
    <form action={accion} className="pila" noValidate>
      <Campo
        etiqueta="Cantidad que diste (lb)"
        nombre="cantidad"
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        defaultValue={valores?.cantidad ?? cantidadSugerida}
        error={campos?.cantidad}
        required
      />
      <Aviso resultado={estado} />
      <BotonEnviar className="btn btn-primary btn-grande" pendiente="Registrando…">
        <span className="btn-icono-fondo">
          <IconoGrafico nombre="maiz" tamano={24} />
        </span>
        Ya les di de comer
      </BotonEnviar>
    </form>
  );
}
