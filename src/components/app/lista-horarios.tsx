"use client";

import { useActionState, useEffect, useState } from "react";
import { Clock, Plus } from "lucide-react";
import { Campo } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { BotonEnviar } from "@/components/ui/boton-enviar";
import { Dialogo } from "@/components/ui/dialogo";
import { formatearHora } from "@/lib/tiempo";
import {
  cambiarEstadoHorario,
  crearHorario,
  editarHorario,
  eliminarHorario,
} from "@/server/acciones/horarios";
import type { Resultado } from "@/server/resultado";

export interface HorarioVista {
  id: number;
  hora: string;
  activo: boolean;
}

type Edicion = { modo: "crear" } | { modo: "editar"; horario: HorarioVista } | null;

function FormularioHorario({ edicion, onCerrar }: { edicion: NonNullable<Edicion>; onCerrar: () => void }) {
  const accionServidor = edicion.modo === "crear" ? crearHorario : editarHorario;
  const [estado, accion] = useActionState<Resultado, FormData>(accionServidor, null);
  const campos = estado && !estado.ok ? estado.campos : undefined;
  const valores = estado && !estado.ok ? estado.valores : undefined;

  useEffect(() => {
    if (estado?.ok) onCerrar();
  }, [estado, onCerrar]);

  return (
    <form action={accion} className="pila" noValidate>
      {edicion.modo === "editar" && <input type="hidden" name="id" value={edicion.horario.id} />}
      <Campo
        etiqueta="Hora de alimentación"
        nombre="hora"
        type="time"
        defaultValue={valores?.hora ?? (edicion.modo === "editar" ? edicion.horario.hora : "07:00")}
        error={campos?.hora}
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

export function ListaHorarios({ horarios, maximo }: { horarios: HorarioVista[]; maximo: number }) {
  const [edicion, setEdicion] = useState<Edicion>(null);
  const llegoAlMaximo = horarios.length >= maximo;
  const sinActivos = !horarios.some((h) => h.activo);

  return (
    <section aria-labelledby="titulo-horarios" className="pila">
      <div className="encabezado-seccion">
        <h2 id="titulo-horarios" className="titulo-seccion titulo-con-icono" style={{ margin: 0 }}>
          <Clock size={22} strokeWidth={2.75} aria-hidden="true" />
          Horarios de alimentación
        </h2>
        <button
          type="button"
          className="btn btn-secondary btn-pequeno"
          disabled={llegoAlMaximo}
          onClick={() => setEdicion({ modo: "crear" })}
        >
          <Plus size={18} strokeWidth={2.75} aria-hidden="true" />
          Agregar
        </button>
      </div>
      {llegoAlMaximo && <p className="texto-suave">Llegaste al máximo de {maximo} horarios.</p>}
      {sinActivos && (
        <p className="aviso aviso-error" role="status">
          Configura al menos un horario activo para calcular la cantidad de cada toma.
        </p>
      )}
      {horarios.map((horario) => (
        <div key={horario.id} className="fila fila-apilada">
          <div className="fila-texto">
            <span className="fila-principal">{formatearHora(horario.hora)}</span>
            <span className="fila-secundaria">{horario.activo ? "Activo" : "Desactivado"}</span>
          </div>
          <div className="fila-acciones">
            <form action={cambiarEstadoHorario}>
              <input type="hidden" name="id" value={horario.id} />
              <input type="hidden" name="activo" value={String(!horario.activo)} />
              <button
                type="submit"
                className="interruptor"
                role="switch"
                aria-checked={horario.activo}
                aria-label={`Horario de ${formatearHora(horario.hora)} activo`}
              />
            </form>
            <button
              type="button"
              className="btn btn-secondary btn-pequeno"
              onClick={() => setEdicion({ modo: "editar", horario })}
            >
              Editar
            </button>
            <form
              action={eliminarHorario}
              onSubmit={(evento) => {
                if (!window.confirm("¿Eliminar este horario?")) evento.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={horario.id} />
              <button type="submit" className="btn btn-ghost btn-pequeno">
                Eliminar
              </button>
            </form>
          </div>
        </div>
      ))}
      <Dialogo
        abierto={edicion !== null}
        titulo={edicion?.modo === "editar" ? "Editar horario" : "Agregar horario"}
        onCerrar={() => setEdicion(null)}
      >
        {edicion && <FormularioHorario edicion={edicion} onCerrar={() => setEdicion(null)} />}
      </Dialogo>
    </section>
  );
}
