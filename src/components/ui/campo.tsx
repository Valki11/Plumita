type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  nombre: string;
  error?: string;
  ayuda?: string;
};

export function Campo({ etiqueta, nombre, error, ayuda, ...resto }: Props) {
  const id = `campo-${nombre}`;
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;
  const descripcion = [error ? idError : null, ayuda ? idAyuda : null].filter(Boolean).join(" ");

  return (
    <div className="field">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        name={nombre}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={descripcion || undefined}
        {...resto}
      />
      {ayuda && (
        <p id={idAyuda} className="texto-suave">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="error-campo">
          {error}
        </p>
      )}
    </div>
  );
}
