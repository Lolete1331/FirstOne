import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("cookie anti-bots (Turnstile)", async () => {
  beforeAll(() => {
    process.env.HUMAN_COOKIE_SECRET = "test-secret";
  });
  const { issueHumanToken, verifyHumanToken, HUMAN_TTL_SECONDS } = await import("@/lib/human");
  const user = "6f1c1d1e-0000-4000-8000-000000000001";

  it("acepta un token válido del mismo usuario", () => {
    expect(verifyHumanToken(issueHumanToken(user), user)).toBe(true);
  });

  it("rechaza tokens de otro usuario, manipulados o caducados", () => {
    const t = issueHumanToken(user);
    expect(verifyHumanToken(t, "otro-usuario")).toBe(false);
    expect(verifyHumanToken(t.slice(0, -2) + "xx", user)).toBe(false);
    expect(verifyHumanToken(undefined, user)).toBe(false);
    const now = Date.now();
    const old = issueHumanToken(user, now);
    expect(verifyHumanToken(old, user, now + (HUMAN_TTL_SECONDS + 1) * 1000)).toBe(false);
  });
});

describe("IP del cliente", async () => {
  const { getClientIp } = await import("@/lib/request-ip");
  it("lee la primera IP de x-forwarded-for y valida el formato", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe("203.0.113.5");
    expect(getClientIp(new Headers({ "x-real-ip": "2001:db8::1" }))).toBe("2001:db8::1");
    expect(getClientIp(new Headers({ "x-forwarded-for": "'; drop table--" }))).toBe(null);
    expect(getClientIp(new Headers())).toBe(null);
  });
});
