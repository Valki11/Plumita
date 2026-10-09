import { FormularioCuenta } from "@/components/app/formulario-cuenta";
import { ListaHorarios } from "@/components/app/lista-horarios";
import { MAX_HORARIOS } from "@/lib/constantes";
import { formatearSemanas } from "@/lib/formato";
import { requerirUsuario } from "@/server/auth/sesion";
import { cerrarSesion } from "@/server/acciones/auth";
import { horariosDelUsuario, reglasAlimenticias } from "@/server/consultas/granja";

const NOMBRES = { gallina: "Gallina", gallo: "Gallo", pato: "Pato" } as const;

export default async function Ajustes() {
  const usuario = await requerirUsuario();
  const [horarios, reglas] = await Promise.all([horariosDelUsuario(usuario.id), reglasAlimenticias()]);

  return (
    <div className="pila-grande">
      <h1>Configuración</h1>
      <FormularioCuenta celular={usuario.celular} />
      <ListaHorarios
        horarios={horarios.map((h) => ({ id: h.id, hora: h.hora, activo: h.activo }))}
        maximo={MAX_HORARIOS}
      />
      <section aria-labelledby="titulo-tabla">
        <h2 id="titulo-tabla" className="titulo-seccion">
          Tabla alimenticia de referencia
        </h2>
        <div className="tabla-contenedor">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Ave</th>
                <th scope="col">Etapa</th>
                <th scope="col">Ración diaria</th>
              </tr>
            </thead>
            <tbody>
              {reglas.flatMap((regla) => [
                <tr key={`${regla.tipo}-pollito`}>
                  <td>{NOMBRES[regla.tipo]}</td>
                  <td>Pollito · hasta {formatearSemanas(regla.limitePollitoSemanas)}</td>
                  <td>{regla.consumoPollitoLb.toString()} lb</td>
                </tr>,
                <tr key={`${regla.tipo}-adulto`}>
                  <td>{NOMBRES[regla.tipo]}</td>
                  <td>Adulto</td>
                  <td>{regla.consumoAdultoLb.toString()} lb</td>
                </tr>,
              ])}
            </tbody>
          </table>
        </div>
      </section>
      <form action={cerrarSesion}>
        <button type="submit" className="btn btn-secondary btn-grande">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
