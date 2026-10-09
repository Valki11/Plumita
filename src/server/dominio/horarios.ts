import { minutosDeHora } from "@/lib/tiempo";

export interface HorarioSugerido {
  hora: string;
  esManana: boolean;
}

function ordenar(horas: string[]): string[] {
  return [...horas].sort((a, b) => minutosDeHora(a) - minutosDeHora(b));
}

export function horarioParaAlimentar(horasActivas: string[], minutosAhora: number): string | null {
  if (horasActivas.length === 0) return null;
  const ordenadas = ordenar(horasActivas);
  const pasadas = ordenadas.filter((h) => minutosDeHora(h) <= minutosAhora);
  return pasadas.length > 0 ? pasadas[pasadas.length - 1] : ordenadas[0];
}

export function proximaAlimentacion(horasActivas: string[], minutosAhora: number): HorarioSugerido | null {
  if (horasActivas.length === 0) return null;
  const ordenadas = ordenar(horasActivas);
  const siguiente = ordenadas.find((h) => minutosDeHora(h) > minutosAhora);
  return siguiente ? { hora: siguiente, esManana: false } : { hora: ordenadas[0], esManana: true };
}
