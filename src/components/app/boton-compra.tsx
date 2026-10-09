"use client";

import { useActionState, useEffect, useState } from "react";
import { Campo } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { BotonEnviar } from "@/components/ui/boton-enviar";
import { Dialogo } from "@/components/ui/dialogo";
import { registrarCompra } from "@/server/acciones/compras";
import type { Resultado } from "@/server/resultado";

function FormularioCompra({ hoy, onCerrar }: { hoy: string; onCerrar: () => void }) {
  const [estado, accion] = useActionState<Resultado, FormData>(registrarCompra, null);
  const campos = estado && !estado.ok ? estado.campos : undefined;
  const valores = estado && !estado.ok ? estado.valores : undefined;

  useEffect(() => {
    if (estado?.ok) onCerrar();
  }, [estado, onCerrar]);

  return (
    <form action={accion} className="pila" noValidate>
      <Campo etiqueta="Fecha" nombre="fecha" type="date" max={hoy} defaultValue={valores?.fecha ?? hoy} error={campos?.fecha} required />
      <Campo
        etiqueta="Cantidad (lb)"
        nombre="cantidadLb"
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        placeholder="Ej. 25"
        defaultValue={valores?.cantidadLb}
        error={campos?.cantidadLb}
        required
      />
      <Campo
        etiqueta="Precio pagado (Q)"
        nombre="precioTotalQtz"
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        placeholder="Ej. 112.50"
        defaultValue={valores?.precioTotalQtz}
        error={campos?.precioTotalQtz}
        required
      />
      <Aviso resultado={estado} />
      <div className="dialogo-acciones">
        <button type="button" className="btn btn-secondary" onClick={onCerrar}>
          Cancelar
        </button>
        <BotonEnviar>Guardar</BotonEnviar>
      </div>
    </form>
  );
}

export function BotonCompra({ hoy }: { hoy: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-primary btn-grande" onClick={() => setAbierto(true)}>
        Registrar compra
      </button>
      <Dialogo abierto={abierto} titulo="Registrar compra" onCerrar={() => setAbierto(false)}>
        <FormularioCompra hoy={hoy} onCerrar={() => setAbierto(false)} />
      </Dialogo>
    </>
  );
}
