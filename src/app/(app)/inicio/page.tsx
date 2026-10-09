import Link from "next/link";
import { UMBRAL_DIAS_ALERTA } from "@/lib/constantes";
import { formatearDias, formatearLb } from "@/lib/formato";
import { formatearHora, minutosDelDia } from "@/lib/tiempo";
import { requerirUsuario } from "@/server/auth/sesion";
import { estadoGranja } from "@/server/consultas/granja";
import { cantidadPorToma, redondearLb } from "@/server/dominio/alimento";
import { proximaAlimentacion } from "@/server/dominio/horarios";

function TarjetaAlcance({ dias }: { dias: number | null }) {
  if (dias === null) {
    return (
      <div className="tarjeta">
        <p className="card-kicker">Alcance del inventario</p>
        <p>
          Agrega aves en <Link href="/aves">Mis aves</Link> para calcular cuánto te dura el alimento.
        </p>
      </div>
    );
  }
  if (dias <= UMBRAL_DIAS_ALERTA) {
    return (
      <div className="tarjeta tarjeta-alerta" role="status">
        <p className="card-kicker">Alerta de inventario</p>
        <p>
          {dias === 0 ? (
            <>
              El alimento <strong>no alcanza para un día completo</strong>. Considera comprar más pronto.
            </>
          ) : (
            <>
              El alimento alcanza para <strong>{formatearDias(dias)} más</strong>. Considera comprar más pronto.
            </>
          )}
        </p>
      </div>
    );
  }
  return (
    <div className="tarjeta">
      <p className="card-kicker">Alcance del inventario</p>
      <p>
        El alimento alcanza para <strong>{formatearDias(dias)} más</strong>.
      </p>
    </div>
  );
}

export default async function Inicio() {
  const usuario = await requerirUsuario();
  const estado = await estadoGranja(usuario);

  const proxima = proximaAlimentacion(estado.horasActivas, minutosDelDia(estado.instante));
  const porToma = cantidadPorToma(estado.consumoDiario, estado.horasActivas.length);
  const activas = estado.aves.filter((a) => a.activo).length;

  return (
    <div className="pila-grande">
      <div>
        <h1>Hola, {usuario.nombreUsuario}</h1>
        <p className="pantalla-subtitulo" style={{ margin: 0 }}>
          Así está tu granja hoy
        </p>
      </div>

      <div className="rejilla-2">
        <div className="tarjeta">
          <p className="card-kicker">Aves activas</p>
          <p className="valor-grande">{activas}</p>
          <p className="texto-suave">en tu granja</p>
        </div>
        <div className="tarjeta">
          <p className="card-kicker">Alimento</p>
          <p className="valor-grande">{formatearLb(estado.inventario)}</p>
          <p className="texto-suave">disponibles</p>
        </div>
      </div>

      <TarjetaAlcance dias={estado.diasAlcance} />

      <div className="tarjeta">
        <p className="card-kicker">Próxima alimentación</p>
        {proxima && porToma ? (
          <>
            <p className="valor-grande" style={{ fontSize: 22 }}>
              {proxima.esManana ? "Mañana" : "Hoy"} · {formatearHora(proxima.hora)}
            </p>
            <p>
              Dar <strong>{formatearLb(redondearLb(porToma))}</strong> de alimento
            </p>
          </>
        ) : (
          <p>
            Configura un horario de alimentación en <Link href="/ajustes">Ajustes</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
