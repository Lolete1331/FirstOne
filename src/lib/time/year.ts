/**
 * Utilidades de tiempo del juego. El año de juego SIEMPRE se calcula en UTC:
 * el reinicio es el 1 de enero a las 00:00 UTC para todo el mundo.
 * (La fuente de verdad es Postgres; esto es para la UI: cuenta atrás, textos…)
 */

export function currentGameYear(now: Date = new Date()): number {
  return now.getUTCFullYear();
}

export function yearStart(year: number): Date {
  return new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
}

/** Próximo reinicio: 1 de enero del año siguiente, 00:00:00.000 UTC. */
export function nextResetAt(now: Date = new Date()): Date {
  return yearStart(currentGameYear(now) + 1);
}

export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number; totalMs: number };

export function countdownParts(target: Date, now: Date = new Date()): CountdownParts {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const s = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    totalMs,
  };
}

/** Porcentaje del año de juego transcurrido (0-100). */
export function yearProgress(now: Date = new Date()): number {
  const y = currentGameYear(now);
  const start = yearStart(y).getTime();
  const end = yearStart(y + 1).getTime();
  return ((now.getTime() - start) / (end - start)) * 100;
}

/** "3 de enero a las 14:22" (en la zona horaria de quien lo ve, salvo que se indique). */
export function formatClaimDate(iso: string | Date, opts: { timeZone?: string; withYear?: boolean } = {}): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const date = new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "long",
    ...(opts.withYear ? { year: "numeric" } : {}),
    timeZone: opts.timeZone,
  }).format(d);
  const time = new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: opts.timeZone,
  }).format(d);
  return `${date} a las ${time}`;
}

/** Hora con milisegundos: "14:22:07.153". */
export function formatPreciseTime(iso: string | Date, timeZone?: string): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const t = new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(d);
  return `${t}.${String(d.getUTCMilliseconds()).padStart(3, "0")}`;
}

/** Duración legible desde el reinicio: "0,250 s", "3 min 2 s", "2 h 5 min", "4 días". */
export function formatSinceReset(seconds: number): string {
  if (seconds < 60) return `${seconds.toLocaleString("es", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min ${Math.floor(seconds % 60)} s`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ${m % 60} min`;
  return `${Math.floor(h / 24)} días`;
}

/** "hace 3 s", "hace 5 min"… para el feed en vivo. */
export function timeAgo(iso: string | Date, now: Date = new Date()): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const s = Math.max(0, Math.round((now.getTime() - d.getTime()) / 1000));
  if (s < 5) return "ahora";
  if (s < 60) return `hace ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}
