import { afterAll, describe, expect, it } from "vitest";
import { asRole, claimNow, createUser, hasDb, pool } from "./helpers";

const today = () => new Date().toISOString().slice(0, 10);

describe.skipIf(!hasDb)("rachas, insignias y grupos", () => {
  afterAll(async () => {
    if (hasDb) await pool.end();
  });

  it("guarda resultados de juegos solo del jugador conectado y con datos válidos", async () => {
    const u = await createUser();
    await asRole("authenticated", u.id, "select public.record_game_result('refranes', $1::date, 4, 5)", [today()]);
    // Repetir un juego de preguntas no cambia el primer resultado…
    await asRole("authenticated", u.id, "select public.record_game_result('refranes', $1::date, 5, 5)", [today()]);
    // …pero en anagramas se guarda el mejor.
    await asRole("authenticated", u.id, "select public.record_game_result('anagramas', $1::date, 3, 40)", [today()]);
    await asRole("authenticated", u.id, "select public.record_game_result('anagramas', $1::date, 9, 40)", [today()]);
    const { rows } = await pool.query("select game, score from public.game_results where user_id = $1 order by game", [u.id]);
    expect(rows).toEqual([
      { game: "anagramas", score: 9 },
      { game: "refranes", score: 4 },
    ]);
    await expect(asRole("authenticated", u.id, "select public.record_game_result('refranes', '2030-01-01', 1, 5)")).rejects.toThrow();
    await expect(asRole("authenticated", u.id, "select public.record_game_result('existe', $1::date, 11, 10)", [today()])).rejects.toThrow();
    // Sin sesión no se guarda nada (o ni siquiera se puede llamar)
    await asRole("anon", null, "select public.record_game_result('existe', $1::date, 1, 10)", [today()]).catch(() => null);
    expect((await pool.query("select count(*)::int as n from public.game_results where game = 'existe'")).rows[0].n).toBe(0);
    // Nadie puede leer la tabla directamente (sin permisos, sale vacía)
    expect(await asRole("authenticated", u.id, "select * from public.game_results")).toEqual([]);
  });

  it("calcula la racha de días seguidos", async () => {
    const u = await createUser();
    const d = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
    // jugó hoy, ayer y anteayer; y hace 10-14 días (5 seguidos)
    for (const n of [0, 1, 2, 10, 11, 12, 13, 14]) {
      await pool.query("insert into public.game_results (user_id, game, day, score, total, completed_at) values ($1, 'existe', '2026-11-15'::date + $2::int, 1, 10, $3)", [u.id, n, d(n)]);
    }
    const { rows } = await pool.query("select public.user_streak($1) as s", [u.username]);
    expect(rows[0].s).toMatchObject({ current: 3, best: 5, today: true, days: 8 });
  });

  it("las insignias reflejan medallas, palabras largas y partidas perfectas", async () => {
    const u = await createUser();
    await claimNow(u.id, "esternocleidomastoideo");
    await claimNow(u.id, "girasol");
    await asRole("authenticated", u.id, "select public.record_game_result('significa', $1::date, 5, 5)", [today()]);
    const { rows } = await pool.query("select public.user_badges($1) as b", [u.username]);
    expect(rows[0].b).toMatchObject({ medals: 2, words: 2, longest: 22, perfect: { significa: 1 }, max_games_day: 1 });
  });

  it("grupos: crear, unirse, clasificación solo para miembros, salir y traspasar", async () => {
    const a = await createUser();
    const b = await createUser();
    const outsider = await createUser();
    const [{ g }] = await asRole<{ g: { code: string; name: string } }>("authenticated", a.id, "select public.create_group('  2.º Bachillerato   B ') as g");
    expect(g.name).toBe("2.º Bachillerato B");
    expect(g.code).toMatch(/^[A-Z2-9]{6}$/);
    await asRole("authenticated", b.id, "select public.join_group($1)", [g.code.toLowerCase()]); // sin distinguir mayúsculas
    await claimNow(b.id, "ornitorrinco");

    const info = async (uid: string | null) =>
      (await asRole<{ i: { members: number; is_member: boolean; ranking: { username: string; medals: number }[] | null } }>(
        uid ? "authenticated" : "anon", uid, "select public.group_info($1) as i", [g.code],
      ))[0].i;
    const seenByB = await info(b.id);
    expect(seenByB.members).toBe(2);
    expect(seenByB.ranking?.[0]).toMatchObject({ username: b.username, medals: 1 });
    const seenByOutsider = await info(outsider.id);
    expect(seenByOutsider.is_member).toBe(false);
    expect(seenByOutsider.ranking).toBeNull();

    // Solo el creador puede quitar a alguien
    await expect(asRole("authenticated", b.id, "select public.remove_group_member($1, $2)", [g.code, a.username])).rejects.toThrow();
    // Si sale el creador, el grupo pasa al siguiente
    await asRole("authenticated", a.id, "select public.leave_group($1)", [g.code]);
    const { rows } = await pool.query("select owner_id from public.groups where code = $1", [g.code]);
    expect(rows[0].owner_id).toBe(b.id);
    // Si sale el último, el grupo desaparece
    await asRole("authenticated", b.id, "select public.leave_group($1)", [g.code]);
    expect((await pool.query("select count(*)::int as n from public.groups where code = $1", [g.code])).rows[0].n).toBe(0);
    await expect(asRole("authenticated", b.id, "select public.join_group('ZZZZZZ')")).rejects.toThrow(/No existe/);
  });
});
