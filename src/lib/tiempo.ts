import { ZONA_HORARIA } from "./constantes";

const MS_DIA = 86_400_000;

const formato = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function partes(fecha: Date) {
  const valores: Record<string, string> = {};
  for (const parte of formato.formatToParts(fecha)) valores[parte.type] = parte.value;
  return valores;
}

export function ahora(): Date {
  return new Date();
}

export function fechaISO(instante: Date): string {
  const p = partes(instante);
  return `${p.year}-${p.month}-${p.day}`;
}

export function horaHHMM(instante: Date): string {
  const p = partes(instante);
  return `${p.hour}:${p.minute}`;
}

export function minutosDeHora(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutosDelDia(instante: Date): number {
  return minutosDeHora(horaHHMM(instante));
}

function aUTC(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aUTC(hasta) - aUTC(desde)) / MS_DIA);
}

export function sumarDias(iso: string, dias: number): string {
  return new Date(aUTC(iso) + dias * MS_DIA).toISOString().slice(0, 10);
}

export function aFechaDB(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function deFechaDB(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export function formatearHora(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const sufijo = h >= 12 ? "p.m." : "a.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function formatearFechaCorta(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]}`;
}

export function etiquetaDia(instante: Date, referencia: Date): string {
  const dias = diasEntre(fechaISO(instante), fechaISO(referencia));
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias === 2) return "Anteayer";
  return formatearFechaCorta(fechaISO(instante));
}
