import { GestorAves } from "@/components/app/gestor-aves";
import { ahora, fechaISO } from "@/lib/tiempo";
import { requerirUsuario } from "@/server/auth/sesion";
import { gruposDeAves } from "@/server/consultas/aves";

export default async function MisAves() {
  const usuario = await requerirUsuario();
  const hoy = fechaISO(ahora());
  const grupos = await gruposDeAves(usuario.id, hoy);
  return <GestorAves grupos={grupos} hoy={hoy} />;
}
