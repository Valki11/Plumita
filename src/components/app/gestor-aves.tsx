"use client";

import { useActionState, useEffect, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Campo } from "@/components/ui/campo";
import { Aviso } from "@/components/ui/aviso";
import { BotonEnviar } from "@/components/ui/boton-enviar";
import { Dialogo } from "@/components/ui/dialogo";
import { IconoGrafico, type NombreIcono } from "@/components/ui/icono-grafico";
import { formatearSemanas } from "@/lib/formato";
import { cambiarEstadoAve, crearAve, editarAve } from "@/server/acciones/aves";
import type { AveVista, GrupoVista } from "@/server/consultas/aves";
import type { Resultado } from "@/server/resultado";

const NOMBRES_TIPO = { gallina: "Gallina", gallo: "Gallo", pato: "Pato" } as const;
const TIPOS = ["gallina", "gallo", "pato"] as const;

const ICONO_GRUPO: Record<GrupoVista["clave"], NombreIcono> = {
  polluelos: "polluelo",
  gallinas: "gallina",
  gallos: "gallo",
  patos: "pato",
};

type Edicion = { modo: "crear" } | { modo: "editar"; ave: AveVista } | null;

function FormularioAve({
  edicion,
  hoy,
  onCerrar,
}: {
  edicion: NonNullable<Edicion>;
  hoy: string;
  onCerrar: () => void;
}) {
  const accionServidor = edicion.modo === "crear" ? crearAve : editarAve;
  const [estado, accion] = useActionState<Resultado, FormData>(accionServidor, null);
  const campos = estado && !estado.ok ? estado.campos : undefined;
  const valores = estado && !estado.ok ? estado.valores : undefined;
  const ave = edicion.modo === "editar" ? edicion.ave : null;

  useEffect(() => {
    if (estado?.ok) onCerrar();
  }, [estado, onCerrar]);

  return (
    <form action={accion} className="pila" noValidate>
      {ave && <input type="hidden" name="id" value={ave.id} />}
      {ave ? (
        <p className="texto-suave" style={{ margin: 0 }}>
          Tipo: <strong>{NOMBRES_TIPO[ave.tipo]}</strong>
        </p>
      ) : (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="texto-suave" style={{ padding: 0, marginBottom: 5 }}>
            Tipo de ave
          </legend>
          <div className="seg" style={{ display: "flex" }}>
            {TIPOS.map((tipo) => (
              <label key={tipo} className="seg-opt seg-opt-icono">
                <input type="radio" name="tipo" value={tipo} defaultChecked={(valores?.tipo ?? "gallina") === tipo} />
                <IconoGrafico nombre={tipo} tamano={36} />
                {NOMBRES_TIPO[tipo]}
              </label>
            ))}
          </div>
          {campos?.tipo && <p className="error-campo">{campos.tipo}</p>}
        </fieldset>
      )}
      <Campo
        etiqueta="Fecha aproximada de ingreso"
        nombre="fechaIngreso"
        type="date"
        max={hoy}
        defaultValue={valores?.fechaIngreso ?? ave?.fechaIngreso ?? hoy}
        error={campos?.fechaIngreso}
        required
      />
      <Campo
        etiqueta="Edad estimada al ingresar (semanas)"
        nombre="edadSemanas"
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        defaultValue={valores?.edadSemanas ?? ave?.edadEstimadaIngresoSemanas ?? 0}
        error={campos?.edadSemanas}
        required
      />
      <Campo
        etiqueta="Descripción"
        nombre="descripcion"
        maxLength={120}
        placeholder="Ej. Ponedora, la más grande…"
        defaultValue={valores?.descripcion ?? ave?.descripcion ?? ""}
        error={campos?.descripcion}
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

function FilaAve({ ave, onEditar }: { ave: AveVista; onEditar: () => void }) {
  return (
    <div className="fila fila-apilada">
      <div className="fila-texto">
        <span>
          <span className="fila-principal">
            {NOMBRES_TIPO[ave.tipo]} · {formatearSemanas(ave.edadActualSemanas)}
          </span>{" "}
          <span className={`tag ${ave.activo ? "tag-activa" : "tag-inactiva"}`}>
            {ave.activo ? "Activa" : "Inactiva"}
          </span>
        </span>
        {ave.descripcion && <span className="fila-secundaria">{ave.descripcion}</span>}
      </div>
      <div className="fila-acciones">
        <button type="button" className="btn btn-secondary btn-pequeno" onClick={onEditar}>
          Editar
        </button>
        <form action={cambiarEstadoAve}>
          <input type="hidden" name="id" value={ave.id} />
          <input type="hidden" name="activo" value={String(!ave.activo)} />
          <button type="submit" className="btn btn-ghost btn-pequeno">
            {ave.activo ? "Inactivar" : "Reactivar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function GestorAves({ grupos, hoy }: { grupos: GrupoVista[]; hoy: string }) {
  const [edicion, setEdicion] = useState<Edicion>(null);

  return (
    <>
      <div className="encabezado-seccion" style={{ marginBottom: "var(--space-4)" }}>
        <h1 style={{ margin: 0 }}>Mis aves</h1>
        <button
          type="button"
          className="btn btn-primary btn-redondo"
          aria-label="Agregar ave"
          onClick={() => setEdicion({ modo: "crear" })}
        >
          <Plus size={24} strokeWidth={2.75} aria-hidden="true" />
        </button>
      </div>
      <div className="pila">
        {grupos.map((grupo) => (
          <details key={grupo.clave} className="grupo" open={grupo.clave === "polluelos" || undefined}>
            <summary>
              <span
                className={`icono-circulo icono-circulo-grande ${grupo.clave === "polluelos" || grupo.clave === "patos" ? "icono-circulo-verde" : ""}`}
                aria-hidden="true"
              >
                <IconoGrafico nombre={ICONO_GRUPO[grupo.clave]} tamano={38} />
              </span>
              <span className="grupo-titulo">
                <h2>{grupo.titulo}</h2>
                <span>
                  {grupo.activos}{" "}
                  {grupo.clave === "gallinas" || grupo.clave === "patos"
                    ? grupo.activos === 1
                      ? "activa"
                      : "activas"
                    : grupo.activos === 1
                      ? "activo"
                      : "activos"}
                </span>
              </span>
              <ChevronDown className="grupo-chevron" size={20} strokeWidth={2.75} aria-hidden="true" />
            </summary>
            <div className="grupo-cuerpo">
              {grupo.aves.length === 0 ? (
                <p className="grupo-vacio">Aún no tienes aves en este grupo.</p>
              ) : (
                grupo.aves.map((ave) => (
                  <FilaAve key={ave.id} ave={ave} onEditar={() => setEdicion({ modo: "editar", ave })} />
                ))
              )}
            </div>
          </details>
        ))}
      </div>
      <Dialogo
        abierto={edicion !== null}
        titulo={edicion?.modo === "editar" ? "Editar ave" : "Agregar ave"}
        onCerrar={() => setEdicion(null)}
      >
        {edicion && <FormularioAve edicion={edicion} hoy={hoy} onCerrar={() => setEdicion(null)} />}
      </Dialogo>
    </>
  );
}
