"use client";

import { useEffect, useId, useRef } from "react";

type Props = {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: React.ReactNode;
};

export function Dialogo({ abierto, titulo, onCerrar, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      onClick={(evento) => {
        if (evento.target === ref.current) onCerrar();
      }}
    >
      {abierto && (
        <>
          <h2 id={idTitulo} className="dialogo-titulo">
            {titulo}
          </h2>
          {children}
        </>
      )}
    </dialog>
  );
}
