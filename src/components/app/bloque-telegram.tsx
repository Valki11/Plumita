import { IconoGrafico } from "@/components/ui/icono-grafico";

export function BloqueTelegram() {
  return (
    <section aria-labelledby="titulo-telegram" className="tarjeta">
      <div className="fila-icono">
        <IconoGrafico nombre="telegram" tamano={44} />
        <div>
          <h2 id="titulo-telegram" className="titulo-seccion" style={{ margin: 0 }}>
            Telegram
          </h2>
          <p className="texto-suave">Enlazar dispositivo con chat en Telegram</p>
        </div>
      </div>
      <p>
        <span className="tag tag-proximamente">Próximamente</span>
      </p>
      <button type="button" className="btn btn-secondary btn-grande" disabled>
        Vincular Telegram
      </button>
    </section>
  );
}
