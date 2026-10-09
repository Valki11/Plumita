"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  className?: string;
  pendiente?: string;
};

export function BotonEnviar({ children, className = "btn btn-primary", pendiente = "Guardando…" }: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendiente : children}
    </button>
  );
}
