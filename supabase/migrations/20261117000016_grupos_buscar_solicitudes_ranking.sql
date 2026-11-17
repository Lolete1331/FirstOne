-- Grupos (17-nov-2026): buscar grupos por nombre, pedir entrar (quien lo creó acepta o rechaza)
-- y clasificación de grupos.
--
-- · Un grupo puede ser «visible» (sale en el buscador y en la clasificación de grupos) o privado
--   (solo se entra con el código). Los grupos que ya existían siguen privados hasta que su creador
--   lo cambie; los nuevos son visibles salvo que se marque lo contrario.
-- · El código sigue siendo la invitación directa. Desde el buscador no se ve el código: se pide entrar.
-- · Puntos de la semana = juegos terminados + palabras ocultas acertadas + medallas conseguidas en los
--   últimos 7 días por los miembros. Puntos del año = medallas del año de los miembros.

alter table public.groups add column is_public boolean not null default false;
create index groups_public_idx on public.groups (is_public) where is_public;

create table public.group_join_requests (
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_join_requests_user_idx on public.group_join_requests (user_id);
alter table public.group_join_requests enable row level security;   -- todo con las funciones de abajo

-- Normaliza un nombre para buscar: sin tildes ni mayúsculas (también Á, Ñ… aunque el locale sea C).
create or replace function public._fold_name(p text)
returns text language sql immutable parallel safe as $$
  select public.fold_word(translate(coalesce(p, ''), 'ÁÉÍÓÚÜÑÀÈÌÒÙÂÊÎÔÛÄËÏÖ', 'áéíóúüñàèìòùâêîôûäëïö'))
$$;

-- Puntos de cada grupo (todos los grupos; quien llama decide cuáles mostrar).
create or replace function public._group_points()
returns table (group_id uuid, members bigint, points_week bigint, points_year bigint)
language sql stable security definer set search_path = public as $$
  with m as (
    select gm.group_id, gm.user_id
    from public.group_members gm join public.profiles p on p.id = gm.user_id
    where p.banned_at is null
  ),
  users as (select distinct user_id from m),
  per_user as (
    select u.user_id,
      (select count(*) from public.game_results gr where gr.user_id = u.user_id and gr.completed_at > now() - interval '7 days')
      + (select count(*) from public.hidden_word_solves s where s.user_id = u.user_id and s.solved_at > now() - interval '7 days')
      + (select count(*) from public.claims c where c.user_id = u.user_id and c.position = 1 and c.claimed_at > now() - interval '7 days')
        as week,
      (select count(*) from public.claims c where c.user_id = u.user_id and c.position = 1 and c.year = public.current_game_year())
        as year
    from users u
  )
  select m.group_id, count(*), coalesce(sum(pu.week), 0)::bigint, coalesce(sum(pu.year), 0)::bigint
  from m join per_user pu on pu.user_id = m.user_id
  group by m.group_id
$$;
revoke all on function public._group_points() from public, anon, authenticated;

-- Crear grupo, ahora con la opción de que sea visible (por defecto sí).
drop function public.create_group(text);
create or replace function public.create_group(p_name text, p_public boolean default true)
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
  insert into public.groups (code, name, owner_id, is_public) values (v_code, v_name, v_uid, coalesce(p_public, true)) returning id into v_id;
  insert into public.group_members (group_id, user_id) values (v_id, v_uid);
  return jsonb_build_object('code', v_code, 'name', v_name);
end;
$$;

-- Al unirse con el código, la solicitud pendiente (si la había) deja de hacer falta.
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
  delete from public.group_join_requests where group_id = g.id and user_id = v_uid;
  return jsonb_build_object('code', g.code, 'name', g.name);
end;
$$;

create or replace function public.set_group_public(p_code text, p_public boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); g public.groups;
begin
  g := public._group_by_code(p_code);
  if g.id is null or g.owner_id is distinct from v_uid then raise exception 'Solo quien creó el grupo puede cambiar esto'; end if;
  update public.groups set is_public = coalesce(p_public, false) where id = g.id;
  -- Si deja de ser visible, las solicitudes pendientes se descartan.
  if not coalesce(p_public, false) then delete from public.group_join_requests where group_id = g.id; end if;
end;
$$;

-- Buscar grupos visibles por nombre (sin distinguir tildes ni mayúsculas). No devuelve el código.
create or replace function public.search_groups(p_query text)
returns table (id uuid, name text, members bigint, points_week bigint, status text)
language sql stable security definer set search_path = public as $$
  with q as (select public._fold_name(btrim(p_query)) as t)
  select g.id, g.name, coalesce(pts.members, 0), coalesce(pts.points_week, 0),
         case
           when exists (select 1 from public.group_members x where x.group_id = g.id and x.user_id = auth.uid()) then 'member'
           when exists (select 1 from public.group_join_requests r where r.group_id = g.id and r.user_id = auth.uid()) then 'pending'
           else null
         end
  from public.groups g
  cross join q
  left join public._group_points() pts on pts.group_id = g.id
  where g.is_public and char_length(q.t) >= 2
    and public._fold_name(g.name) like '%' || replace(replace(replace(q.t, '\', '\\'), '%', '\%'), '_', '\_') || '%'
  order by (public._fold_name(g.name) like q.t || '%') desc, coalesce(pts.members, 0) desc, g.name
  limit 30
$$;

create or replace function public.request_join_group(p_group_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); g public.groups;
begin
  if v_uid is null or not exists (select 1 from public.profiles where id = v_uid and banned_at is null) then
    raise exception 'Necesitas una cuenta para pedir entrar en un grupo';
  end if;
  select * into g from public.groups where id = p_group_id and is_public;
  if g.id is null then raise exception 'Ese grupo no existe o ya no se puede buscar'; end if;
  if exists (select 1 from public.group_members where group_id = g.id and user_id = v_uid) then return 'member'; end if;
  if exists (select 1 from public.group_join_requests where group_id = g.id and user_id = v_uid) then return 'pending'; end if;
  if (select count(*) from public.group_join_requests where user_id = v_uid) >= 20 then
    raise exception 'Tienes demasiadas solicitudes pendientes (máximo 20). Espera a que te respondan.';
  end if;
  if (select count(*) from public.group_join_requests where group_id = g.id) >= 200 then
    raise exception 'Este grupo tiene demasiadas solicitudes pendientes. Prueba más tarde.';
  end if;
  insert into public.group_join_requests (group_id, user_id) values (g.id, v_uid);
  return 'pending';
end;
$$;

create or replace function public.cancel_join_request(p_group_id uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.group_join_requests where group_id = p_group_id and user_id = auth.uid()
$$;

-- Quien creó el grupo acepta o rechaza una solicitud.
create or replace function public.respond_join_request(p_code text, p_username text, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); g public.groups; v_user uuid;
begin
  g := public._group_by_code(p_code);
  if g.id is null or g.owner_id is distinct from v_uid then raise exception 'Solo quien creó el grupo puede responder solicitudes'; end if;
  select r.user_id into v_user from public.group_join_requests r join public.profiles p on p.id = r.user_id
   where r.group_id = g.id and lower(p.username) = lower(p_username);
  if v_user is null then return; end if;
  delete from public.group_join_requests where group_id = g.id and user_id = v_user;
  if p_accept then
    if (select count(*) from public.group_members where group_id = g.id) >= 500 then raise exception 'El grupo está completo (500 personas)'; end if;
    if (select count(*) from public.group_members where user_id = v_user) >= 30 then
      raise exception 'Esa persona ya está en 30 grupos, que es el máximo';
    end if;
    insert into public.group_members (group_id, user_id) values (g.id, v_user) on conflict do nothing;
  end if;
end;
$$;

-- Mis grupos, ahora con las solicitudes pendientes (para quien lo creó) y mis solicitudes enviadas.
drop function public.my_groups();
create or replace function public.my_groups()
returns table (code text, name text, members bigint, is_owner boolean, is_public boolean, requests bigint)
language sql stable security definer set search_path = public as $$
  select g.code, g.name, (select count(*) from public.group_members x where x.group_id = g.id), g.owner_id = auth.uid(),
         g.is_public,
         case when g.owner_id = auth.uid() then (select count(*) from public.group_join_requests r where r.group_id = g.id) else 0 end
  from public.groups g join public.group_members m on m.group_id = g.id
  where m.user_id = auth.uid()
  order by m.joined_at desc
$$;

create or replace function public.my_join_requests()
returns table (id uuid, name text, members bigint, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, (select count(*) from public.group_members x where x.group_id = g.id), r.created_at
  from public.group_join_requests r join public.groups g on g.id = r.group_id
  where r.user_id = auth.uid()
  order by r.created_at desc
$$;

-- Clasificación de grupos visibles con al menos 2 personas.
create or replace function public.group_ranking(p_period text default 'week', p_limit int default 50)
returns table (rank bigint, id uuid, name text, members bigint, points bigint, is_member boolean, code text)
language sql stable security definer set search_path = public as $$
  with r as (
    select g.id, g.name, g.code, pts.members,
           case when p_period = 'year' then pts.points_year else pts.points_week end as points
    from public.groups g join public._group_points() pts on pts.group_id = g.id
    where g.is_public and pts.members >= 2
  )
  select rank() over (order by r.points desc), r.id, r.name, r.members, r.points,
         exists (select 1 from public.group_members x where x.group_id = r.id and x.user_id = auth.uid()) as is_member,
         -- el código solo se devuelve a quien ya es miembro (para enlazar a su grupo)
         case when exists (select 1 from public.group_members x where x.group_id = r.id and x.user_id = auth.uid()) then r.code end
  from r
  order by r.points desc, r.members desc, r.name
  limit least(greatest(coalesce(p_limit, 50), 1), 100)
$$;

-- Ficha del grupo: se añaden visibilidad, puntos, puesto y (para quien lo creó) las solicitudes.
create or replace function public.group_info(p_code text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); g public.groups; v_member boolean; v_year int := public.current_game_year();
  v_week bigint; v_yearpts bigint; v_members bigint; v_rank_week bigint; v_rank_year bigint;
begin
  g := public._group_by_code(p_code);
  if g.id is null then return null; end if;
  v_member := v_uid is not null and exists (select 1 from public.group_members where group_id = g.id and user_id = v_uid);
  if v_member then
    select coalesce(sum(points_week), 0), coalesce(sum(points_year), 0) into v_week, v_yearpts
      from public._group_points() where group_id = g.id;
    select count(*) into v_members from public.group_members where group_id = g.id;
    -- Puesto entre los grupos visibles de 2 o más personas (contando este aunque sea privado).
    select 1 + count(*) filter (where pts.points_week > v_week), 1 + count(*) filter (where pts.points_year > v_yearpts)
      into v_rank_week, v_rank_year
      from public.groups x join public._group_points() pts on pts.group_id = x.id
     where x.is_public and pts.members >= 2 and x.id <> g.id;
  end if;
  return jsonb_build_object(
    'code', g.code,
    'name', g.name,
    'members', (select count(*) from public.group_members where group_id = g.id),
    'owner', (select username from public.profiles where id = g.owner_id),
    'is_member', v_member,
    'is_owner', g.owner_id = v_uid,
    'is_public', g.is_public,
    'points_week', v_week,
    'points_year', v_yearpts,
    'rank_week', case when v_members >= 2 then v_rank_week end,
    'rank_year', case when v_members >= 2 then v_rank_year end,
    'requests', case when g.owner_id is distinct from v_uid then null else (
      select coalesce(jsonb_agg(jsonb_build_object('username', p.username, 'country', p.country, 'created_at', r.created_at)
                                order by r.created_at), '[]'::jsonb)
      from public.group_join_requests r join public.profiles p on p.id = r.user_id
      where r.group_id = g.id and p.banned_at is null
    ) end,
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

-- El admin también puede borrar un grupo (por si alguno tiene un nombre ofensivo).
create or replace function public.admin_delete_group(p_group_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Solo el admin puede hacer esto'; end if;
  delete from public.groups where id = p_group_id;
end;
$$;

revoke all on function public.create_group(text, boolean), public.set_group_public(text, boolean),
  public.request_join_group(uuid), public.cancel_join_request(uuid), public.respond_join_request(text, text, boolean),
  public.my_groups(), public.my_join_requests(), public.admin_delete_group(uuid) from public, anon;
grant execute on function public.create_group(text, boolean), public.set_group_public(text, boolean),
  public.request_join_group(uuid), public.cancel_join_request(uuid), public.respond_join_request(text, text, boolean),
  public.my_groups(), public.my_join_requests(), public.admin_delete_group(uuid) to authenticated;
grant execute on function public.search_groups(text), public.group_ranking(text, int) to anon, authenticated;
