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
  it("grupos: buscar por nombre, pedir entrar, aceptar o rechazar y clasificación de grupos", async () => {
    const owner = await createUser();
    const fan = await createUser();
    const other = await createUser();
    const tag = Math.random().toString(36).slice(2, 7);
    const [{ g }] = await asRole<{ g: { code: string } }>("authenticated", owner.id, `select public.create_group('Clase Ñandú ${tag}') as g`);
    const [{ p }] = await asRole<{ p: { code: string } }>("authenticated", owner.id, `select public.create_group('Privado ${tag}', false) as p`);

    // Se encuentra sin tildes ni mayúsculas; el privado no sale y no se ve el código
    const found = await asRole<{ id: string; name: string; status: string | null; code?: string }>(
      "anon", null, "select * from public.search_groups($1)", [`clase ñANDU ${tag}`],
    );
    expect(found).toHaveLength(1);
    expect(found[0]).not.toHaveProperty("code");
    expect(await asRole("anon", null, "select * from public.search_groups($1)", [`privado ${tag}`])).toEqual([]);
    expect(await asRole("anon", null, "select * from public.search_groups('%')")).toEqual([]);

    // Pedir entrar → pendiente; el creador lo ve y acepta
    const id = found[0].id;
    expect((await asRole<{ s: string }>("authenticated", fan.id, "select public.request_join_group($1) as s", [id]))[0].s).toBe("pending");
    expect((await asRole<{ status: string }>("authenticated", fan.id, "select * from public.search_groups($1)", [tag]))[0].status).toBe("pending");
    await asRole("authenticated", other.id, "select public.request_join_group($1)", [id]);
    const infoOwner = (await asRole<{ i: { requests: { username: string }[] } }>("authenticated", owner.id, "select public.group_info($1) as i", [g.code]))[0].i;
    expect(infoOwner.requests.map((r) => r.username).sort()).toEqual([fan.username, other.username].sort());
    // Solo el creador puede responder
    await expect(asRole("authenticated", fan.id, "select public.respond_join_request($1, $2, true)", [g.code, other.username])).rejects.toThrow();
    await asRole("authenticated", owner.id, "select public.respond_join_request($1, $2, true)", [g.code, fan.username]);
    await asRole("authenticated", owner.id, "select public.respond_join_request($1, $2, false)", [g.code, other.username]);
    const mine = await asRole<{ code: string }>("authenticated", fan.id, "select * from public.my_groups()");
    expect(mine.map((x) => x.code)).toContain(g.code);
    expect(await asRole("authenticated", other.id, "select * from public.my_groups()")).toEqual([]);
    expect(await asRole("authenticated", other.id, "select * from public.my_join_requests()")).toEqual([]);
    // No se puede pedir entrar en un grupo privado
    const [{ pid }] = (await pool.query("select id as pid from public.groups where code = $1", [p.code])).rows;
    await expect(asRole("authenticated", fan.id, "select public.request_join_group($1)", [pid])).rejects.toThrow();

    // Clasificación: el grupo visible con 2 personas suma puntos; el privado no aparece
    await claimNow(fan.id, "quetzal");
    await asRole("authenticated", fan.id, "select public.record_game_result('refranes', $1::date, 4, 5)", [today()]);
    const ranking = await asRole<{ id: string; points: string; code: string | null }>("authenticated", fan.id, "select * from public.group_ranking('week', 100)");
    const row = ranking.find((r) => r.id === id);
    expect(Number(row?.points)).toBe(2); // 1 juego + 1 medalla
    expect(row?.code).toBe(g.code); // es miembro: puede ir a su grupo
    expect(ranking.find((r) => r.id === pid)).toBeUndefined();
    const anonRanking = await asRole<{ id: string; code: string | null }>("anon", null, "select * from public.group_ranking('year', 100)");
    expect(anonRanking.find((r) => r.id === id)?.code).toBeNull();

    // Al hacerlo privado deja de salir y se borran las solicitudes
    await asRole("authenticated", other.id, "select public.request_join_group($1)", [id]);
    await asRole("authenticated", owner.id, "select public.set_group_public($1, false)", [g.code]);
    expect(await asRole("anon", null, "select * from public.search_groups($1)", [tag])).toEqual([]);
    expect(await asRole("authenticated", other.id, "select * from public.my_join_requests()")).toEqual([]);
  });
  it("grupos: invitar por @usuario, aceptar o rechazar", async () => {
    const owner = await createUser();
    const fiel = await createUser();
    const otro = await createUser();
    const [{ g }] = await asRole<{ g: { code: string } }>("authenticated", owner.id, "select public.create_group('Los fieles') as g");
    expect((await asRole<{ s: string }>("authenticated", owner.id, "select public.invite_to_group($1, $2) as s", [g.code, "@" + fiel.username.toUpperCase()]))[0].s).toBe("invited");
    await asRole("authenticated", owner.id, "select public.invite_to_group($1, $2)", [g.code, otro.username]);
    // Solo el creador invita, y el nombre tiene que existir
    await expect(asRole("authenticated", fiel.id, "select public.invite_to_group($1, $2)", [g.code, otro.username])).rejects.toThrow();
    await expect(asRole("authenticated", owner.id, "select public.invite_to_group($1, 'noexiste_zz')", [g.code])).rejects.toThrow(/No existe/);
    // Invitado: ve la invitación con quién le invita; NO está dentro hasta aceptar
    const inv = await asRole<{ code: string; invited_by: string }>("authenticated", fiel.id, "select * from public.my_group_invites()");
    expect(inv).toEqual([expect.objectContaining({ code: g.code, invited_by: owner.username })]);
    expect(await asRole("authenticated", fiel.id, "select * from public.my_groups()")).toEqual([]);
    expect((await asRole("authenticated", owner.id, "select * from public.group_pending_invites($1)", [g.code])).length).toBe(2);
    expect(await asRole("authenticated", fiel.id, "select * from public.group_pending_invites($1)", [g.code])).toEqual([]);
    await asRole("authenticated", fiel.id, "select public.answer_group_invite($1, true)", [g.code]);
    await asRole("authenticated", otro.id, "select public.answer_group_invite($1, false)", [g.code]);
    expect((await asRole<{ code: string }>("authenticated", fiel.id, "select * from public.my_groups()")).map((x) => x.code)).toEqual([g.code]);
    expect(await asRole("authenticated", otro.id, "select * from public.my_groups()")).toEqual([]);
    expect(await asRole("authenticated", owner.id, "select * from public.group_pending_invites($1)", [g.code])).toEqual([]);
    // Invitar a alguien que ya está dentro no hace nada
    expect((await asRole<{ s: string }>("authenticated", owner.id, "select public.invite_to_group($1, $2) as s", [g.code, fiel.username]))[0].s).toBe("member");
  });
  it("avisa al dueño de cuántos han intentado quitarle sus palabras desde su última visita", async () => {
    const owner = await createUser();
    const a = await createUser();
    const b = await createUser();
    await claimNow(owner.id, "zarigüeya");
    await claimNow(owner.id, "almohada");
    await claimNow(a.id, "zarigüeya");
    await claimNow(b.id, "zarigüeya");
    await claimNow(b.id, "almohada");
    type Alert = { total: number; people: number; words: { word: string; n: number; last_user: string }[] };
    const get = async (uid: string) => (await asRole<{ r: Alert }>("authenticated", uid, "select public.my_word_challengers() as r"))[0].r;
    const r = await get(owner.id);
    expect(r.total).toBe(3);
    expect(r.people).toBe(2);
    expect(r.words[0]).toMatchObject({ word: "zarigüeya", n: 2, last_user: b.username });
    // Los que llegaron después no reciben avisos de palabras que no son suyas
    expect((await get(a.id)).total).toBe(0);
    // Tras cerrar el aviso, vuelve a cero
    await asRole("authenticated", owner.id, "select public.mark_word_challengers_seen()");
    expect((await get(owner.id)).total).toBe(0);
    expect((await asRole<{ r: unknown }>("anon", null, "select 1 as r").catch(() => null))).toBeTruthy();
  });
});
