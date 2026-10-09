import { BotonCompra } from "@/components/app/boton-compra";
import { formatearLb, formatearQuetzales } from "@/lib/formato";
import { deFechaDB, formatearFechaCorta } from "@/lib/tiempo";
import { requerirUsuario } from "@/server/auth/sesion";
import { prisma } from "@/server/db";
import { estadoGranja } from "@/server/consultas/granja";
import { proyeccion } from "@/server/dominio/inventario";
import { DIAS_PROYECCION } from "@/lib/constantes";

function TextoProyeccion({
  sinAves,
  libras,
  costo,
}: {
  sinAves: boolean;
  libras: Parameters<typeof formatearLb>[0];
  costo: Parameters<typeof formatearQuetzales>[0] | null;
}) {
  if (sinAves) return <p>Sin aves activas no se puede calcular cuánto alimento necesitarás.</p>;
  if (Number(libras.toString()) === 0) {
    return <p>Tienes alimento suficiente para los próximos {DIAS_PROYECCION} días.</p>;
  }
  if (costo === null) {
    return (
      <p>
        Necesitarás comprar <strong>{formatearLb(libras)}</strong> más. Registra una compra para ver el costo
        estimado.
      </p>
    );
  }
  return (
    <p>
      Necesitarás comprar <strong>{formatearLb(libras)}</strong> más, un estimado de{" "}
      <strong>{formatearQuetzales(costo)}</strong>.
    </p>
  );
}

export default async function Inventario() {
  const usuario = await requerirUsuario();
  const [estado, compras] = await Promise.all([
    estadoGranja(usuario),
    prisma.compraAlimento.findMany({
      where: { idUsuario: usuario.id },
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      take: 15,
    }),
  ]);

  const resultado = proyeccion(estado.consumoDiario, estado.inventario, estado.margenPct, estado.precioUltimaCompra);

  return (
    <div className="pila-grande">
      <h1>Inventario</h1>

      <div className="tarjeta">
        <p className="card-kicker">Disponible ahora</p>
        <p className="valor-grande">{formatearLb(estado.inventario)}</p>
      </div>

      <div className="tarjeta">
        <p className="card-kicker">Proyección a {DIAS_PROYECCION} días</p>
        <TextoProyeccion sinAves={estado.consumoDiario.lte(0)} libras={resultado.libras} costo={resultado.costo} />
        <p className="texto-suave">Incluye un margen del {estado.margenPct.toString()} %.</p>
      </div>

      <BotonCompra hoy={estado.hoy} />

      <section aria-labelledby="titulo-compras">
        <h2 id="titulo-compras" className="titulo-seccion" style={{ marginTop: 0 }}>
          Compras anteriores
        </h2>
        {compras.length === 0 ? (
          <p className="texto-suave">Todavía no has registrado ninguna compra.</p>
        ) : (
          <ul className="pila" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {compras.map((compra) => (
              <li key={compra.id} className="fila">
                <div className="fila-texto">
                  <span className="fila-principal">{formatearFechaCorta(deFechaDB(compra.fecha))}</span>
                  <span className="fila-secundaria">{formatearLb(Number(compra.cantidadLb))}</span>
                </div>
                <span className="fila-principal">{formatearQuetzales(Number(compra.precioTotalQtz))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
