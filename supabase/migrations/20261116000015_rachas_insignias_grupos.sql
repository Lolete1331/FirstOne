-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0015 · Resultados de juegos en la cuenta, rachas, insignias y grupos
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Resultados de los juegos diarios (solo jugadores con cuenta) ───────────
create table public.game_results (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  game         text not null check (game in ('sopa', 'significa', 'existe', 'refranes', 'intrusa', 'b-o-v', 'ahorcado', 'anagramas')),
  day          date not null,                 -- el día del juego (puede ser un día anterior)
  score        int  not null check (score >= 0),
  total        int  not null check (total > 0 and score <= total),
  seconds      int  check (seconds >= 0),     -- sopa: tiempo en completarla
  completed_at timestamptz not null default clock_timestamp(),
  primary key (user_id, game, day)
);
create index game_results_user_idx on public.game_results (user_id, completed_at);
alter table public.game_results enable row level security;   -- se lee y escribe solo con las funciones de abajo
create index if not exists hidden_word_plays_user_idx on public.hidden_word_plays (user_id, created_at);

-- Guarda el resultado del jugador conectado. En los juegos de preguntas cuenta el primer resultado;
-- en anagramas (que se puede ir mejorando durante el día) se guarda el mejor.
create or replace function public.record_game_result(p_game text, p_day date, p_score int, p_total int, p_seconds int default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'UTC')::date;
begin
  if v_uid is null or not exists (select 1 from public.profiles where id = v_uid and banned_at is null) then
    return;
  end if;
  if p_day is null or p_day > v_today or p_day < date '2026-11-15' then
    raise exception 'día no válido';
  end if;
  if p_total is null or p_total <= 0 or p_total > 1000 or p_score is null or p_score < 0 or p_score > p_total then
    raise exception 'resultado no válido';
  end if;
  insert into public.game_results (user_id, game, day, score, total, seconds)
  values (v_uid, p_game, p_day, p_score, p_total, p_seconds)
  on conflict (user_id, game, day) do update
    set score = greatest(public.game_results.score, excluded.score),
        total = excluded.total
    where public.game_results.game = 'anagramas';
end;
$$;
revoke all on function public.record_game_result(text, date, int, int, int) from public, anon;
grant execute on function public.record_game_result(text, date, int, int, int) to authenticated;

-- ─── Rachas ─────────────────────────────────────────────────────────────────
-- Días (UTC) en que el jugador hizo algo: conquistar palabras, terminar un juego o jugar la palabra oculta.
create or replace function public._activity_days(p_user uuid)
returns setof date language sql stable security definer set search_path = public as $$
  select (claimed_at at time zone 'UTC')::date from public.claims where user_id = p_user
  union
  select (completed_at at time zone 'UTC')::date from public.game_results where user_id = p_user
  union
  select (created_at at time zone 'UTC')::date from public.hidden_word_plays where user_id = p_user
$$;
revoke all on function public._activity_days(uuid) from public, anon, authenticated;

-- Racha actual (días seguidos hasta hoy o ayer), la mejor racha y si hoy ya ha jugado.
create or replace function public._streak(p_user uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  with d as (select distinct x as day from public._activity_days(p_user) x),
       g as (select day, day - (row_number() over (order by day))::int as grp from d),
       runs as (select max(day) as e, count(*) as n from g group by grp)
  select jsonb_build_object(
    'current', coalesce((select n from runs where e >= (now() at time zone 'UTC')::date - 1 order by e desc limit 1), 0),
    'best',    coalesce((select max(n) from runs), 0),
    'today',   exists (select 1 from d where day = (now() at time zone 'UTC')::date),
    'days',    (select count(*) from d)
  )
$$;
revoke all on function public._streak(uuid) from public, anon, authenticated;

create or replace function public.user_streak(p_username text)
returns jsonb language sql stable security definer set search_path = public as $$
  select public._streak(p.id) from public.profiles p where lower(p.username) = lower(p_username)
$$;

-- ─── Insignias (los datos; los nombres y umbrales están en la web) ──────────
create or replace function public.user_badges(p_username text)
returns jsonb language sql stable security definer set search_path = public as $$
  with u as (select id from public.profiles where lower(username) = lower(p_username)),
       gr as (select g.* from public.game_results g, u where g.user_id = u.id),
       per_day as (
         select day, count(distinct game) as n from (
           select day, game from gr
           union all
           select p.day, 'oculta' from public.hidden_word_plays p, u where p.user_id = u.id
         ) x group by day
       )
  select jsonb_build_object(
    'words',          (select count(*) from public.claims c, u where c.user_id = u.id),
    'medals',         (select count(*) from public.claims c, u where c.user_id = u.id and c.position = 1),
    'longest',        (select coalesce(max(char_length(c.word)), 0) from public.claims c, u where c.user_id = u.id and c.position = 1),
    'new_year',       exists (select 1 from public.claims c, u where c.user_id = u.id and c.position = 1
                              and c.claimed_at < public.year_start(c.year) + interval '1 hour'),
    'oculta_solved',  (select count(*) from public.hidden_word_solves s, u where s.user_id = u.id),
    'oculta_first',   exists (select 1 from public.hidden_word_solves s, u where s.user_id = u.id
                              and public.hidden_word_on_time(s.day, s.solved_at)
                              and not exists (select 1 from public.hidden_word_solves o
                                              where o.day = s.day and o.solved_at < s.solved_at
                                                and public.hidden_word_on_time(o.day, o.solved_at))),
    'oculta_one',     exists (select 1 from public.hidden_word_solves s, u where s.user_id = u.id and s.attempts = 1),
    'games',          (select count(*) from gr),
    'perfect',        (select coalesce(jsonb_object_agg(game, n), '{}'::jsonb) from
                        (select game, count(*) as n from gr where score = total group by game) t),
    'sopa_best',      (select min(seconds) from gr where game = 'sopa' and score = total and seconds is not null),
    'anagramas_best', (select coalesce(max(score), 0) from gr where game = 'anagramas'),
    'max_games_day',  (select coalesce(max(n), 0) from per_day),
    'best_streak',    (select (public._streak(u.id) ->> 'best')::int from u)
  )
  from u
$$;

-- Resumen de juegos del jugador (para su perfil): partidas, perfectas y acierto medio por juego.
create or replace function public.user_game_stats(p_username text)
returns table (game text, played bigint, perfect bigint, avg_pct int, last_7 bigint)
language sql stable security definer set search_path = public as $$
  select g.game, count(*), count(*) filter (where g.score = g.total),
         round(100.0 * avg(g.score::numeric / g.total))::int,
         count(*) filter (where g.completed_at > now() - interval '7 days')
  from public.game_results g join public.profiles p on p.id = g.user_id
  where lower(p.username) = lower(p_username)
  group by g.game
$$;

-- Resultados del jugador conectado (para marcar en la web los juegos que ya hizo, también en otro dispositivo).
create or replace function public.my_game_results(p_from date default null)
returns table (game text, day date, score int, total int)
language sql stable security definer set search_path = public as $$
  select g.game, g.day, g.score, g.total from public.game_results g
  where g.user_id = auth.uid() and (p_from is null or g.day >= p_from)
$$;
revoke all on function public.my_game_results(date) from public, anon;
grant execute on function public.my_game_results(date) to authenticated;

-- ─── Grupos (clases, amigos, familia) con clasificación propia ──────────────
create table public.groups (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique check (code ~ '^[A-Z2-9]{6}$'),
  name       text not null check (char_length(btrim(name)) between 3 and 40),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);
alter table public.groups enable row level security;          -- todo con las funciones de abajo
alter table public.group_members enable row level security;

create or replace function public._group_by_code(p_code text)
returns public.groups language sql stable security definer set search_path = public as $$
  select * from public.groups where code = upper(btrim(p_code))
$$;
revoke all on function public._group_by_code(text) from public, anon, authenticated;

create or replace function public.create_group(p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_id uuid;
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  if v_uid is null or not exists (select 1 from public.profiles where id = v_uid and banned_at is null) then
    raise exception 'Necesitas una cuenta para crear un grupo';
  end if;
  if char_length(v_name) not between 3 and 40 then raise exception 'El nombre debe tener entre 3 y 40 caracteres'; end if;
  if (select count(*) from public.groups where owner_id = v_uid) >= 10 then raise exception 'Puedes crear como mucho 10 grupos'; end if;
  loop
    v_code := (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '') from generate_series(1, 6));
    exit when not exists (select 1 from public.groups where code = v_code);
  end loop;
  insert into public.groups (code, name, owner_id) values (v_code, v_name, v_uid) returning id into v_id;
  insert into public.group_members (group_id, user_id) values (v_id, v_uid);
  return jsonb_build_object('code', v_code, 'name', v_name);
end;
$$;

create or replace function public.join_group(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); g public.groups;
begin
  if v_uid is null or not exists (select 1 from public.profiles where id = v_uid and banned_at is null) then
    raise exception 'Necesitas una cuenta para unirte a un grupo';
  end if;
  g := public._group_by_code(p_code);
  if g.id is null then raise exception 'No existe ningún grupo con ese código'; end if;
  if exists (select 1 from public.group_members where group_id = g.id and user_id = v_uid) then
    return jsonb_build_object('code', g.code, 'name', g.name);
  end if;
  if (select count(*) from public.group_members where group_id = g.id) >= 500 then raise exception 'Este grupo está completo (500 personas)'; end if;
  if (select count(*) from public.group_members where user_id = v_uid) >= 30 then raise exception 'Puedes estar como mucho en 30 grupos'; end if;
  insert into public.group_members (group_id, user_id) values (g.id, v_uid);
  return jsonb_build_object('code', g.code, 'name', g.name);
end;
$$;

-- Salir de un grupo. Si sale quien lo creó, el grupo pasa al miembro más antiguo (o se borra si queda vacío).
create or replace function public.leave_group(p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); g public.groups; v_next uuid;
begin
  g := public._group_by_code(p_code);
  if v_uid is null or g.id is null then return; end if;
  delete from public.group_members where group_id = g.id and user_id = v_uid;
  if g.owner_id = v_uid then
    select user_id into v_next from public.group_members where group_id = g.id order by joined_at limit 1;
    if v_next is null then delete from public.groups where id = g.id;
    else update public.groups set owner_id = v_next where id = g.id;
    end if;
  end if;
end;
$$;

-- Quien creó el grupo puede quitar a alguien o borrar el grupo.
create or replace function public.remove_group_member(p_code text, p_username text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); g public.groups;
begin
  g := public._group_by_code(p_code);
  if g.id is null or g.owner_id is distinct from v_uid then raise exception 'Solo quien creó el grupo puede quitar a alguien'; end if;
  delete from public.group_members m using public.profiles p
   where m.group_id = g.id and m.user_id = p.id and lower(p.username) = lower(p_username) and p.id <> v_uid;
end;
$$;

create or replace function public.delete_group(p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); g public.groups;
begin
  g := public._group_by_code(p_code);
  if g.id is null or g.owner_id is distinct from v_uid then raise exception 'Solo quien creó el grupo puede borrarlo'; end if;
  delete from public.groups where id = g.id;
end;
$$;

create or replace function public.my_groups()
returns table (code text, name text, members bigint, is_owner boolean)
language sql stable security definer set search_path = public as $$
  select g.code, g.name, (select count(*) from public.group_members x where x.group_id = g.id), g.owner_id = auth.uid()
  from public.groups g join public.group_members m on m.group_id = g.id
  where m.user_id = auth.uid()
  order by m.joined_at desc
$$;

-- Ficha de un grupo. Cualquiera con el código ve el nombre y cuántos son (para unirse);
-- la clasificación solo la ven sus miembros.
create or replace function public.group_info(p_code text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); g public.groups; v_member boolean; v_year int := public.current_game_year();
begin
  g := public._group_by_code(p_code);
  if g.id is null then return null; end if;
  v_member := v_uid is not null and exists (select 1 from public.group_members where group_id = g.id and user_id = v_uid);
  return jsonb_build_object(
    'code', g.code,
    'name', g.name,
    'members', (select count(*) from public.group_members where group_id = g.id),
    'owner', (select username from public.profiles where id = g.owner_id),
    'is_member', v_member,
    'is_owner', g.owner_id = v_uid,
    'ranking', case when not v_member then null else (
      select coalesce(jsonb_agg(r order by r.medals desc, r.words desc, r.username), '[]'::jsonb) from (
        select p.username, p.country,
               (select count(*) from public.claims c where c.user_id = p.id and c.year = v_year and c.position = 1) as medals,
               (select count(*) from public.claims c where c.user_id = p.id and c.year = v_year) as words,
               (public._streak(p.id) ->> 'current')::int as streak,
               (select count(*) from public.game_results gr where gr.user_id = p.id and gr.completed_at > now() - interval '7 days')
                 + (select count(*) from public.hidden_word_solves s where s.user_id = p.id and s.solved_at > now() - interval '7 days') as games_week
        from public.group_members m join public.profiles p on p.id = m.user_id
        where m.group_id = g.id and p.banned_at is null
      ) r
    ) end
  );
end;
$$;

revoke all on function public.create_group(text), public.join_group(text), public.leave_group(text),
  public.remove_group_member(text, text), public.delete_group(text), public.my_groups() from public, anon;
grant execute on function public.create_group(text), public.join_group(text), public.leave_group(text),
  public.remove_group_member(text, text), public.delete_group(text), public.my_groups() to authenticated;
