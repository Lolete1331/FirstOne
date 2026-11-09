import { describe, expect, it } from "vitest";
import {
  countdownParts,
  currentGameYear,
  formatClaimDate,
  formatPreciseTime,
  formatSinceReset,
  nextResetAt,
  timeAgo,
  yearProgress,
} from "@/lib/time/year";

describe("año de juego (UTC)", () => {
  it("el año cambia exactamente el 1 de enero a las 00:00 UTC", () => {
    expect(currentGameYear(new Date("2026-12-31T23:59:59.999Z"))).toBe(2026);
    expect(currentGameYear(new Date("2027-01-01T00:00:00.000Z"))).toBe(2027);
  });

  it("no depende de la zona horaria del usuario", () => {
    // Medianoche en Madrid (UTC+1) sigue siendo 2026 en UTC.
    expect(currentGameYear(new Date("2027-01-01T00:30:00+01:00"))).toBe(2026);
    // 31 dic 20:00 en Ciudad de México (UTC-6) ya es 2027 en UTC.
    expect(currentGameYear(new Date("2026-12-31T20:00:00-06:00"))).toBe(2027);
  });

  it("calcula el próximo reinicio", () => {
    expect(nextResetAt(new Date("2026-11-09T12:00:00Z")).toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(nextResetAt(new Date("2027-01-01T00:00:00Z")).toISOString()).toBe("2028-01-01T00:00:00.000Z");
  });

  it("cuenta atrás", () => {
    const now = new Date("2026-12-30T22:58:57Z");
    expect(countdownParts(nextResetAt(now), now)).toMatchObject({ days: 1, hours: 1, minutes: 1, seconds: 3 });
    expect(countdownParts(new Date(0), now).totalMs).toBe(0); // nunca negativa
  });

  it("progreso del año", () => {
    expect(yearProgress(new Date("2026-01-01T00:00:00Z"))).toBe(0);
    expect(yearProgress(new Date("2026-07-02T12:00:00Z"))).toBeCloseTo(50, 0);
  });
});

describe("formatos", () => {
  it("formatea la fecha de reclamación", () => {
    expect(formatClaimDate("2026-01-03T14:22:00Z", { timeZone: "UTC" })).toBe("3 de enero a las 14:22");
    expect(formatClaimDate("2026-01-03T14:22:00Z", { timeZone: "America/Mexico_City" })).toBe(
      "3 de enero a las 08:22",
    );
  });

  it("muestra milisegundos", () => {
    expect(formatPreciseTime("2026-01-01T00:00:07.053Z", "UTC")).toBe("00:00:07.053");
  });

  it("duración tras el reinicio", () => {
    expect(formatSinceReset(0.25)).toBe("0,250 s");
    expect(formatSinceReset(182)).toBe("3 min 2 s");
    expect(formatSinceReset(7500)).toBe("2 h 5 min");
    expect(formatSinceReset(86400 * 4)).toBe("4 días");
  });

  it("hace cuánto", () => {
    const now = new Date("2026-05-05T10:00:00Z");
    expect(timeAgo("2026-05-05T09:59:58Z", now)).toBe("ahora");
    expect(timeAgo("2026-05-05T09:59:30Z", now)).toBe("hace 30 s");
    expect(timeAgo("2026-05-05T09:55:00Z", now)).toBe("hace 5 min");
  });
});
