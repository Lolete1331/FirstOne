import { afterAll, describe, expect, it } from "vitest";
import { asRole, claimAt, claimNow, createUser, freshWord, hasDb, pool } from "./helpers";
import { normalizeWord } from "@/lib/words/normalize";

describe.skipIf(!hasDb)("base de datos", () => {
  afterAll(() => pool?.end());

  describe("diccionario y normalización", () => {
    it("normalize_word() de SQL coincide con normalizeWord() de TypeScript", async () => {
      const inputs = ["  Año ", "AÑO", "ano", "Pingüino", "ÁRBOL", "camio\u0301n", "an\u0303o", "  dos   palabras ", "ÉXITO", "Ñandú"];
      for (const input of inputs) {
        const { rows } = await pool.query("select public.normalize_word($1) as w", [input]);
        expect(rows[0].w, JSON.stringify(input)).toBe(normalizeWord(input));
      }
    });

    it("valida contra el diccionario respetando tildes y ñ", async () => {
      const check = async (w: string) =>
        (await pool.query("select public.word_exists($1) as e", [w])).rows[0].e as boolean;
      expect(await check("año")).toBe(true);
      expect(await check("ano")).toBe(true);
      expect(await check(" AÑO ")).toBe(true);
      expect(await check("an\u0303o")).toBe(true); // ñ descompuesta
      expect(await check("abogada")).toBe(true); // femenino generado
      expect(await check("niña")).toBe(true);
      expect(await check("perros")).toBe(false); // plural
      expect(await check("xqzwv")).toBe(false);
    });

    it("rechaza palabras que no están en el diccionario", async () => {
      const u = await createUser();
      const r = await claimNow(u.id, "xqzwvplf");
      expect(r.status).toBe("invalid");
      const r2 = await claimNow(u.id, "dos palabras");
      expect(r2.status).toBe("invalid");
    });
  });

  describe("reclamaciones y unicidad por año", () => {
    it("la primera persona gana la medalla y las siguientes quedan apuntadas en orden", async () => {
      const word = await freshWord();
      const [a, b, c] = [await createUser(), await createUser("MX"), await createUser("AR")];

      const ra = await claimNow(a.id, word.toUpperCase());
      expect(ra).toMatchObject({ status: "won", position: 1, word, total: 1 });
      expect(ra.owner?.username).toBe(a.username);
      expect(ra.claimed_at).toMatch(/\.\d{3,6}/); // guarda (al menos) milisegundos

      const rb = await claimNow(b.id, word);
      expect(rb).toMatchObject({ status: "joined", position: 2, total: 2 });
      expect(rb.owner?.username).toBe(a.username);

      const rc = await claimNow(c.id, ` ${word} `);
      expect(rc).toMatchObject({ status: "joined", position: 3, total: 3 });
    });

    it("si repites una palabra no avanza el contador", async () => {
      const word = await freshWord();
      const a = await createUser();
      await claimNow(a.id, word);
      const again = await claimNow(a.id, word);
      expect(again).toMatchObject({ status: "already_yours", position: 1, total: 1 });
    });

    it("con 30 envíos simultáneos hay exactamente un ganador y posiciones 1..30 sin huecos", async () => {
      const word = await freshWord();
      const users = await Promise.all(Array.from({ length: 30 }, () => createUser()));
      const results = await Promise.all(users.map((u) => claimNow(u.id, word)));

      expect(results.filter((r) => r.status === "won")).toHaveLength(1);
      const positions = results.map((r) => r.position!).sort((x, y) => x - y);
      expect(positions).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));

      // El orden de posiciones respeta el orden de llegada (claimed_at).
      const { rows } = await pool.query(
        "select position from public.claims where word = $1 order by claimed_at, id",
        [word],
      );
      expect(rows.map((r) => r.position)).toEqual(positions);
    });

    it("un doble envío simultáneo del mismo usuario cuenta una sola vez", async () => {
      const word = await freshWord();
      const u = await createUser();
      const rs = await Promise.all(Array.from({ length: 5 }, () => claimNow(u.id, word)));
      expect(rs.filter((r) => r.status === "won")).toHaveLength(1);
      const { rows } = await pool.query("select claim_count from public.word_counters where word = $1", [word]);
      expect(rows[0].claim_count).toBe(1);
    });

    it("si alguien borra su cuenta, el historial y las posiciones se conservan", async () => {
      const word = await freshWord();
      const [a, b, c] = [await createUser(), await createUser(), await createUser()];
      await claimNow(a.id, word);
      await claimNow(b.id, word);
      await pool.query("delete from auth.users where id = $1", [a.id]); // borra perfil en cascada

      const rc = await claimNow(c.id, word);
      expect(rc).toMatchObject({ status: "joined", position: 3, total: 3 });
      expect(rc.owner).toMatchObject({ username: null });

      const { rows } = await pool.query("select * from public.word_claimants($1, $2)", [word, rc.year]);
      expect(rows.map((r) => [r.position, r.username])).toEqual([
        [1, null],
        [2, b.username],
        [3, c.username],
      ]);
    });

    it("la restricción UNIQUE de Postgres impide dos dueños aunque se salte la función", async () => {
      const word = await freshWord();
      const [a, b] = [await createUser(), await createUser()];
      await pool.query("insert into public.claims (word, user_id, position) values ($1, $2, 1)", [word, a.id]);
      await expect(
        pool.query("insert into public.claims (word, user_id, position) values ($1, $2, 1)", [word, b.id]),
      ).rejects.toThrow(/claims_one_owner_per_word_year|claims_position_unique/);
      await expect(
        pool.query("insert into public.claims (word, user_id, position) values ($1, $2, 2)", [word, a.id]),
      ).rejects.toThrow(/claims_one_per_user/);
    });
  });

  describe("cambio de año (1 de enero 00:00 UTC)", () => {
    it("el último milisegundo del año cuenta para ese año y el primero del siguiente reinicia la carrera", async () => {
      const word = await freshWord();
      const [a, b] = [await createUser(), await createUser()];

      const last = await claimAt(a.id, word, "2030-12-31T23:59:59.999Z");
      expect(last).toMatchObject({ status: "won", year: 2030, position: 1 });

      // Hora local de Madrid ya es 1 de enero, pero en UTC aún es 2030 → mismo año.
      const madrid = await claimAt(b.id, word, "2031-01-01T00:30:00+01:00");
      expect(madrid).toMatchObject({ status: "joined", year: 2030, position: 2 });

      const first = await claimAt(b.id, word, "2031-01-01T00:00:00.000Z");
      expect(first).toMatchObject({ status: "won", year: 2031, position: 1 });
      expect(first.owner?.username).toBe(b.username);

      const aAgain = await claimAt(a.id, word, "2031-01-01T00:00:01Z");
      expect(aAgain).toMatchObject({ status: "joined", year: 2031, position: 2 });

      // El historial conserva ambos años, sin borrar nada.
      const { rows } = await pool.query("select * from public.word_history($1)", [word]);
      expect(rows.map((r) => [r.year, r.owner, r.total])).toEqual([
        [2031, b.username, 2],
        [2030, a.username, 2],
      ]);
      expect(rows[0].seconds_after_reset).toBe(0);
    });

    it("year_stats calcula la palabra más rápida tras el reinicio", async () => {
      const word = await freshWord();
      const u = await createUser();
      // Año aleatorio: el test es repetible aunque la BD persista entre ejecuciones.
      const year = 2100 + Math.floor(Math.random() * 7000);
      await claimAt(u.id, word, `${year}-01-01T00:00:00.250Z`);
      const { rows } = await pool.query("select public.year_stats($1) as s", [year]);
      expect(rows[0].s.fastest).toMatchObject({ word, username: u.username, seconds: 0.25 });
      expect(rows[0].s.words_conquered).toBe(1);
      expect(Number(rows[0].s.dictionary_total)).toBeGreaterThan(90000);
    });
  });

  describe("anti-abuso", () => {
    it("limita a 10 intentos por minuto y usuario", async () => {
      const u = await createUser();
      const base = Date.parse("2050-03-01T10:00:00Z");
      const statuses = [];
      for (let i = 0; i < 11; i++) {
        statuses.push((await claimAt(u.id, await freshWord(), new Date(base + i * 1000).toISOString())).status);
      }
      expect(statuses.slice(0, 10).every((s) => s === "won")).toBe(true);
      expect(statuses[10]).toBe("rate_limited");
      // Pasado el minuto, vuelve a poder.
      const later = await claimAt(u.id, await freshWord(), new Date(base + 61_000).toISOString());
      expect(later.status).toBe("won");
    });

    it("limita a 30 intentos por minuto y IP", async () => {
      const base = Date.parse("2050-04-01T10:00:00Z");
      const ip = "203.0.113.7";
      let last;
      for (let i = 0; i < 31; i++) {
        const u = await createUser();
        last = await claimAt(u.id, "xqzwv", new Date(base + i * 100).toISOString(), ip);
      }
      expect(last!.status).toBe("rate_limited");
    });
  });

  describe("permisos (RLS)", () => {
    it("un cliente no puede llamar a claim_word ni escribir en claims directamente", async () => {
      const u = await createUser();
      const word = await freshWord();
      await expect(asRole("authenticated", u.id, "select public.claim_word($1, $2)", [u.id, word])).rejects.toThrow(
        /permission denied/,
      );
      await expect(
        asRole("authenticated", u.id, "select public._claim_word_at($1, $2, null, now())", [u.id, word]),
      ).rejects.toThrow(/permission denied/);
      await expect(
        asRole("authenticated", u.id, "insert into public.claims (word, user_id, position) values ($1, $2, 1)", [
          word,
          u.id,
        ]),
      ).rejects.toThrow(/row-level security|permission denied/);
    });

    it("cualquiera (anon) puede leer el feed, rankings e historial", async () => {
      const rows = await asRole("anon", null, "select * from public.recent_claims(5)");
      expect(Array.isArray(rows)).toBe(true);
      await asRole("anon", null, "select * from public.top_users(null, 5)");
      await asRole("anon", null, "select * from public.top_countries(null, 5)");
      await asRole("anon", null, "select public.year_stats()");
    });

    it("solo puedes crear tu propio perfil", async () => {
      const { randomUUID } = await import("node:crypto");
      const me = randomUUID();
      const other = randomUUID();
      await pool.query("insert into auth.users (id) values ($1), ($2)", [me, other]);
      await expect(
        asRole("authenticated", me, "insert into public.profiles (id, username) values ($1, 'impostor_x')", [other]),
      ).rejects.toThrow(/row-level security/);
      await asRole("authenticated", me, "insert into public.profiles (id, username, country) values ($1, $2, 'CL')", [
        me,
        `me_${me.slice(0, 8)}`,
      ]);
    });

    it("el @usuario solo se puede cambiar una vez", async () => {
      const u = await createUser();
      await asRole("authenticated", u.id, "update public.profiles set username = $2 where id = $1", [
        u.id,
        `${u.username.slice(0, 15)}_v2`,
      ]);
      await expect(
        asRole("authenticated", u.id, "update public.profiles set username = $2 where id = $1", [
          u.id,
          `${u.username.slice(0, 15)}_v3`,
        ]),
      ).rejects.toThrow(/username_locked/);
      // El país sí se puede cambiar siempre.
      await asRole("authenticated", u.id, "update public.profiles set country = 'PE' where id = $1", [u.id]);
    });
  });

  describe("ayudas de la UI", () => {
    it("username_available ignora mayúsculas y valida el formato", async () => {
      const u = await createUser();
      const q = async (n: string) =>
        (await asRole<{ a: boolean }>("anon", null, "select public.username_available($1) as a", [n]))[0].a;
      expect(await q(u.username.toUpperCase())).toBe(false);
      expect(await q("libre_del_todo")).toBe(true);
      expect(await q("no válido")).toBe(false);
    });

    it("word_status informa si existe, el dueño y cuántos la mandaron este año", async () => {
      const word = await freshWord();
      const [a, b] = [await createUser(), await createUser()];
      await claimNow(a.id, word);
      await claimNow(b.id, word);
      const [{ s }] = await asRole<{ s: Record<string, unknown> }>("anon", null, "select public.word_status($1) as s", [
        word.toUpperCase(),
      ]);
      expect(s).toEqual({ word, exists: true, total: 2, owner: a.username });
      const [{ s: none }] = await asRole<{ s: Record<string, unknown> }>(
        "anon",
        null,
        "select public.word_status('xqzwv') as s",
      );
      expect(none).toMatchObject({ exists: false, total: 0, owner: null });
    });
  });

  describe("feed en vivo", () => {
    it("cada reclamación se emite al canal live-feed con el @usuario", async () => {
      const u = await createUser("CO");
      const word = await freshWord();
      await claimNow(u.id, word);
      // En la simulación se guarda en realtime.sent_messages; en Supabase real, en realtime.messages.
      const { rows: shim } = await pool.query("select to_regclass('realtime.sent_messages') is not null as ok");
      const table = shim[0].ok ? "realtime.sent_messages" : "realtime.messages";
      const { rows } = await pool.query(
        `select topic, event, private, payload from ${table} where payload->>'word' = $1`,
        [word],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ event: "claim", topic: "live-feed", private: false });
      expect(rows[0].payload).toMatchObject({ word, username: u.username, country: "CO", position: 1 });
    });
  });
});
