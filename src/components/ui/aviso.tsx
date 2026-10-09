import type { Resultado } from "@/server/resultado";

export function Aviso({ resultado }: { resultado: Resultado }) {
  if (!resultado || !resultado.mensaje) return null;
  if (resultado.ok) {
    return (
      <p className="aviso" role="status">
        {resultado.mensaje}
      </p>
    );
  }
  return (
    <p className="aviso aviso-error" role="alert">
      {resultado.mensaje}
    </p>
  );
}
