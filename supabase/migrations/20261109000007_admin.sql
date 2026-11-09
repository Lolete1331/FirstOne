-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0007 · Administración
-- ════════════════════════════════════════════════════════════════════════════
-- El permiso de admin vive en la base de datos (profiles.is_admin) y lo comprueba
-- Postgres en cada función de admin: no basta con ocultar botones en la interfaz.
--
-- Hacer admin a alguien (desde el SQL Editor de Supabase o psql, como postgres):
--   select public.make_admin('tu_usuario');

alter table public.profiles
  add column is_admin   boolean not null default false,
  add column banned_at  timestamptz,
  add column ban_reason text;

-- Nadie puede darse permisos de admin ni quitarse un bloqueo desde la app.
create or replace function public.profiles_protect_admin_fields()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.is_admin := false;
      new.banned_at := null;
      new.ban_reason := null;
    elsif new.is_admin is distinct from old.is_admin
       or new.banned_at is distinct from old.banned_at
       or new.ban_reason is distinct from old.ban_reason then
      raise exception 'forbidden' using hint = 'Solo un admin puede cambiar estos campos.';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_admin_fields
  before insert or update on public.profiles
  for each row execute function public.profiles_protect_admin_fields();

-- ¿El usuario de esta petición es admin (y no está bloqueado)?
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_admin and banned_at is null)
$$;

create or replace function public.assert_admin()
returns uuid
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return auth.uid();
end;
$$;

-- Solo para el dueño del proyecto (SQL Editor / psql). No accesible desde la app.
create or replace function public.make_admin(p_username text, p_admin boolean default true)
returns text
language plpgsql security definer set search_path = public as $$
declare v text;
begin
  update public.profiles set is_admin = p_admin where lower(username) = lower(p_username) returning username into v;
  if v is null then raise exception 'No existe el usuario @%', p_username; end if;
  return format('@%s ahora %s admin', v, case when p_admin then 'es' else 'no es' end);
end;
$$;

-- ─── Registro de acciones de admin ──────────────────────────────────────────
create table public.admin_log (
  id         bigint generated always as identity primary key,
  admin_id   uuid references public.profiles (id) on delete set null,
  action     text not null,
  target     text,
  details    jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_log enable row level security;  -- solo vía funciones

create or replace function public._admin_log(p_action text, p_target text, p_details jsonb default null)
returns void language sql security definer set search_path = public as $$
  insert into public.admin_log (admin_id, action, target, details) values (auth.uid(), p_action, p_target, p_details)
$$;

-- ─── Palabras ocultas (ofensivas) ───────────────────────────────────────────
-- Siguen siendo válidas y quedan en el historial, pero no salen en el feed ni en el buscador.
create table public.hidden_words (
  word      text primary key references public.dictionary_words (word),
  hidden_by uuid references public.profiles (id) on delete set null,
  hidden_at timestamptz not null default now()
);
alter table public.hidden_words enable row level security;
create policy "palabras ocultas visibles por todos" on public.hidden_words for select using (true);

-- Feed y buscador sin palabras ocultas
create or replace function public.recent_claims(p_limit int default 30, p_only_firsts boolean default false)
returns table (id bigint, word text, year smallint, "position" int, claimed_at timestamptz,
               username text, country char(2))
language sql stable as $$
  select c.id, c.word, c.year, c.position, c.claimed_at, p.username, p.country
  from public.claims c left join public.profiles p on p.id = c.user_id
  where (not p_only_firsts or c.position = 1)
    and not exists (select 1 from public.hidden_words h where h.word = c.word)
  order by c.claimed_at desc
  limit least(greatest(p_limit, 1), 100)
$$;

create or replace function public.search_words(p_year int default null, p_query text default '',
                                               p_limit int default 50, p_offset int default 0)
returns table (word text, year smallint, total int, owner text, owner_country char(2), owner_claimed_at timestamptz)
language sql stable as $$
  with q as (
    select coalesce(p_year, public.current_game_year()) as y,
           regexp_replace(public.normalize_word(p_query), '[^a-záéíóúüñ]', '', 'g') as prefix
  )
  select wc.word, wc.year, wc.claim_count, p.username, p.country, c.claimed_at
  from q
  join public.word_counters wc on wc.year = q.y and wc.word like q.prefix || '%'
  join public.claims c on c.word = wc.word and c.year = wc.year and c.position = 1
  left join public.profiles p on p.id = c.user_id
  where not exists (select 1 from public.hidden_words h where h.word = wc.word)
  order by case when q.prefix = '' then null else wc.word end, c.claimed_at desc
  limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)
$$;

create or replace function public.broadcast_claim()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_payload jsonb;
begin
  if exists (select 1 from public.hidden_words where word = new.word) then
    return null;
  end if;
  select jsonb_build_object(
    'id', new.id, 'word', new.word, 'year', new.year, 'position', new.position,
    'claimed_at', new.claimed_at, 'username', p.username, 'country', p.country
  ) into v_payload
  from public.profiles p where p.id = new.user_id;
  begin
    perform realtime.send(v_payload, 'claim', 'live-feed', false);
  exception when others then
    raise warning 'broadcast_claim: %', sqlerrm;
  end;
  return null;
end;
$$;

-- ─── Usuarios bloqueados no pueden reclamar ────────────────────────────────
create or replace function public.claim_word(p_user_id uuid, p_word text, p_ip inet default null)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
begin
  if exists (select 1 from public.profiles where id = p_user_id and banned_at is not null) then
    return jsonb_build_object('status', 'banned');
  end if;
  return public._claim_word_at(p_user_id, p_word, p_ip, null);
end;
$$;
revoke all on function public.claim_word(uuid, text, inet) from public, anon, authenticated;
grant execute on function public.claim_word(uuid, text, inet) to service_role;

-- ─── Funciones del panel /admin ─────────────────────────────────────────────
create or replace function public.admin_overview()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.assert_admin();
  return jsonb_build_object(
    'claims_last_minute', (select count(*) from public.claims where claimed_at > now() - interval '1 minute'),
    'claims_last_hour',   (select count(*) from public.claims where claimed_at > now() - interval '1 hour'),
    'claims_today',       (select count(*) from public.claims where claimed_at > date_trunc('day', now() at time zone 'UTC') at time zone 'UTC'),
    'attempts_last_hour', (select count(*) from public.claim_attempts where attempted_at > now() - interval '1 hour'),
    'users_total',        (select count(*) from public.profiles),
    'users_today',        (select count(*) from public.profiles where created_at > date_trunc('day', now() at time zone 'UTC') at time zone 'UTC'),
    'users_banned',       (select count(*) from public.profiles where banned_at is not null),
    'hidden_words',       (select count(*) from public.hidden_words),
    -- Quién más intentos hace en los últimos 10 minutos (posibles bots)
    'top_attempters', (
      select coalesce(jsonb_agg(t order by t.attempts desc), '[]'::jsonb) from (
        select p.id, p.username, count(*) as attempts, p.banned_at is not null as banned
        from public.claim_attempts a join public.profiles p on p.id = a.user_id
        where a.attempted_at > now() - interval '10 minutes'
        group by p.id order by count(*) desc limit 10
      ) t
    )
  );
end;
$$;

create or replace function public.admin_search_users(p_query text default '', p_limit int default 30)
returns table (id uuid, username text, country char(2), created_at timestamptz, is_admin boolean,
               banned_at timestamptz, ban_reason text, medals bigint, words bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.assert_admin();
  return query
    select p.id, p.username, p.country, p.created_at, p.is_admin, p.banned_at, p.ban_reason,
           count(c.id) filter (where c.position = 1), count(c.id)
    from public.profiles p left join public.claims c on c.user_id = p.id
    where p_query = '' or p.username ilike '%' || replace(replace(p_query, '%', ''), '_', '\_') || '%'
    group by p.id
    order by p.banned_at is not null desc, count(c.id) desc
    limit least(greatest(p_limit, 1), 100);
end;
$$;

create or replace function public.admin_set_ban(p_user_id uuid, p_banned boolean, p_reason text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_admin uuid := public.assert_admin(); v_name text;
begin
  if p_user_id = v_admin then raise exception 'No puedes bloquearte a ti mismo'; end if;
  update public.profiles
     set banned_at = case when p_banned then now() end,
         ban_reason = case when p_banned then nullif(btrim(p_reason), '') end
   where id = p_user_id
  returning username into v_name;
  if v_name is null then raise exception 'Usuario no encontrado'; end if;
  perform public._admin_log(case when p_banned then 'ban' else 'unban' end, '@' || v_name,
                            jsonb_build_object('reason', p_reason));
end;
$$;

-- Anula una reclamación y sube un puesto a todos los que llegaron después.
-- Si era la #1, la #2 pasa a ser la dueña (y gana la medalla).
create or replace function public.admin_void_claim(p_word text, p_year int, p_user_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_word text := public.normalize_word(p_word);
  v_pos int;
  r record;
begin
  perform public.assert_admin();
  -- Cerrojo del contador: nadie puede reclamar esta palabra mientras reordenamos.
  perform 1 from public.word_counters where word = v_word and year = p_year for update;

  delete from public.claims where word = v_word and year = p_year and user_id = p_user_id
  returning position into v_pos;
  if v_pos is null then raise exception 'Reclamación no encontrada'; end if;

  -- En orden ascendente para no chocar con la restricción UNIQUE (palabra, año, posición).
  for r in select id from public.claims where word = v_word and year = p_year and position > v_pos order by position loop
    update public.claims set position = position - 1 where id = r.id;
  end loop;

  update public.word_counters set claim_count = claim_count - 1 where word = v_word and year = p_year;
  delete from public.word_counters where word = v_word and year = p_year and claim_count <= 0;

  perform public._admin_log('void_claim', v_word,
    jsonb_build_object('year', p_year, 'position', v_pos, 'user_id', p_user_id));
  return jsonb_build_object('word', v_word, 'year', p_year, 'removed_position', v_pos);
end;
$$;

create or replace function public.admin_hide_word(p_word text, p_hidden boolean default true)
returns void
language plpgsql security definer set search_path = public as $$
declare v_word text := public.normalize_word(p_word);
begin
  perform public.assert_admin();
  if p_hidden then
    insert into public.hidden_words (word, hidden_by) values (v_word, auth.uid()) on conflict do nothing;
  else
    delete from public.hidden_words where word = v_word;
  end if;
  perform public._admin_log(case when p_hidden then 'hide_word' else 'unhide_word' end, v_word);
end;
$$;

create or replace function public.admin_recent_log(p_limit int default 50)
returns table (id bigint, admin text, action text, target text, details jsonb, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.assert_admin();
  return query
    select l.id, p.username, l.action, l.target, l.details, l.created_at
    from public.admin_log l left join public.profiles p on p.id = l.admin_id
    order by l.created_at desc limit least(greatest(p_limit, 1), 200);
end;
$$;

revoke all on function public.make_admin(text, boolean) from public, anon, authenticated;
revoke all on function public._admin_log(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.profiles_protect_admin_fields() from public, anon, authenticated;

create or replace function public.admin_hidden_words()
returns table (word text, hidden_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.assert_admin();
  return query select h.word, h.hidden_at from public.hidden_words h order by h.hidden_at desc;
end;
$$;
