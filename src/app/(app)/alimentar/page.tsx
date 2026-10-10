import Link from "next/link";
import { FormularioAlimentar } from "@/components/app/formulario-alimentar";
import { IconoGrafico } from "@/components/ui/icono-grafico";
import { formatearLb } from "@/lib/formato";
import { etiquetaDia, formatearHora, horaHHMM, minutosDelDia } from "@/lib/tiempo";
import { requerirUsuario } from "@/server/auth/sesion";
import { prisma } from "@/server/db";
import { estadoGranja } from "@/server/consultas/granja";
import { cantidadPorToma, redondearLb } from "@/server/dominio/alimento";
import { horarioParaAlimentar } from "@/server/dominio/horarios";

export default async function Alimentar() {
  const usuario = await requerirUsuario();
  const [estado, historial] = await Promise.all([
    estadoGranja(usuario),
    prisma.registroAlimentacion.findMany({
      where: { idUsuario: usuario.id },
      orderBy: { fechaHora: "desc" },
      take: 15,
    }),
  ]);

  const porToma = cantidadPorToma(estado.consumoDiario, estado.horasActivas.length);
  const horario = horarioParaAlimentar(estado.horasActivas, minutosDelDia(estado.instante));
  const cantidad = porToma ? redondearLb(porToma) : null;

  return (
    <div className="pila-grande">
      <h1>Alimentar</h1>

      {porToma === null || horario === null ? (
        <div className="tarjeta tarjeta-alerta">
          <p className="card-kicker">Falta un horario</p>
          <p>Configura al menos un horario de alimentación para calcular cuánto dar en cada toma.</p>
          <p>
            <Link href="/ajustes">Ir a configuración</Link>
          </p>
        </div>
      ) : cantidad && cantidad.gt(0) ? (
        <>
          <div className="tarjeta tarjeta-centro">
            <IconoGrafico nombre="maiz" tamano={96} />
            <p className="card-kicker">Horario actual</p>
            <p className="valor-enorme">{formatearLb(cantidad)}</p>
            <p>{formatearHora(horario)}</p>
          </div>
          <FormularioAlimentar cantidadSugerida={cantidad.toString()} />
        </>
      ) : (
        <div className="tarjeta tarjeta-alerta">
          <p className="card-kicker">Sin aves activas</p>
          <p>Agrega aves en Mis aves para calcular la cantidad de cada toma.</p>
          <p>
            <Link href="/aves">Ir a Mis aves</Link>
          </p>
        </div>
      )}

      <section aria-labelledby="titulo-historial">
        <h2 id="titulo-historial" className="titulo-seccion" style={{ marginTop: 0 }}>
          Historial
        </h2>
        {historial.length === 0 ? (
          <p className="texto-suave">Todavía no has registrado ninguna alimentación.</p>
        ) : (
          <ul className="pila" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {historial.map((registro) => (
              <li key={registro.id} className="fila">
                <div className="fila-texto">
                  <span className="fila-principal">{etiquetaDia(registro.fechaHora, estado.instante)}</span>
                  <span className="fila-secundaria">{formatearHora(horaHHMM(registro.fechaHora))}</span>
                </div>
                <span className="tag tag-cantidad">{formatearLb(Number(registro.cantidadTotalLb))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
