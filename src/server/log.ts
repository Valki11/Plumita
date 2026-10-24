const REDACTADO = "[REDACTADO]";
const PROFUNDIDAD_MAXIMA = 6;

const CLAVE_SENSIBLE = /contrase|password|hash|cookie|token|codigo|secret|secreto|authorization|sesion|session/i;

const PATRONES_SENSIBLES = [
  /\b\d{6,}:[A-Za-z0-9_-]{30,}\b/g,
  /\$argon2[a-z0-9]*\$[^\s"'\\]+/g,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
];

function redactarTexto(texto: string): string {
  return PATRONES_SENSIBLES.reduce((actual, patron) => actual.replace(patron, REDACTADO), texto);
}

export function redactar(valor: unknown, profundidad = 0): unknown {
  if (valor === null || valor === undefined) return valor;
  if (typeof valor === "string") return redactarTexto(valor);
  if (typeof valor === "bigint") return valor.toString();
  if (typeof valor !== "object") return valor;
  if (profundidad >= PROFUNDIDAD_MAXIMA) return REDACTADO;
  if (valor instanceof Date) return valor.toISOString();
  if (valor instanceof Error) return { nombre: valor.name, mensaje: redactarTexto(valor.message) };
  if (Array.isArray(valor)) return valor.map((elemento) => redactar(elemento, profundidad + 1));
  const resultado: Record<string, unknown> = {};
  for (const [clave, contenido] of Object.entries(valor)) {
    resultado[clave] = CLAVE_SENSIBLE.test(clave) ? REDACTADO : redactar(contenido, profundidad + 1);
  }
  return resultado;
}

export type NivelLog = "info" | "warn" | "error";

export function registrarLog(nivel: NivelLog, evento: string, datos?: Record<string, unknown>): void {
  const linea = JSON.stringify({
    nivel,
    evento,
    ...(datos ? { datos: redactar(datos) } : {}),
  });
  if (nivel === "error") console.error(linea);
  else console.log(linea);
}
