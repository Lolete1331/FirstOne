-- Invitaciones a grupos por @usuario (19-nov-2026).
-- Quien creó el grupo invita a alguien por su nombre de usuario; a esa persona le sale un aviso en la web
-- y decide si entra o no. Nadie entra en un grupo sin aceptarlo.

create table public.group_invites (
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  invited_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_invites_user_idx on public.group_invites (user_id);
alter table public.group_invites enable row level security;   -- todo con las funciones de abajo

create or replace function public.invite_to_group(p_code text, p_username text)
returns text language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); g public.groups; v_user uuid;
begin
  g := public._group_by_code(p_code);
  if g.id is null or g.owner_id is distinct from v_uid then raise exception 'Solo quien creó el grupo puede invitar'; end if;
  select id into v_user from public.profiles
   where lower(username) = lower(btrim(replace(coalesce(p_username, ''), '@', ''))) and banned_at is null;
  if v_user is null then raise exception 'No existe ningún jugador con ese nombre'; end if;
  if exists (select 1 from public.group_members where group_id = g.id and user_id = v_user) then return 'member'; end if;
  if exists (select 1 from public.group_invites where group_id = g.id and user_id = v_user) then return 'invited'; end if;
  if (select count(*) from public.group_invites where group_id = g.id) >= 50 then
    raise exception 'Tienes 50 invitaciones sin responder en este grupo. Espera a que contesten.';
  end if;
  -- Si esa persona ya había pedido entrar, invitarla equivale a aceptarla.
  if exists (select 1 from public.group_join_requests where group_id = g.id and user_id = v_user) then
    perform public.respond_join_request(g.code, (select username from public.profiles where id = v_user), true);
    return 'member';
  end if;
  insert into public.group_invites (group_id, user_id, invited_by) values (g.id, v_user, v_uid);
  return 'invited';
end;
$$;

create or replace function public.cancel_group_invite(p_code text, p_username text)
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); g public.groups;
begin
  g := public._group_by_code(p_code);
  if g.id is null or g.owner_id is distinct from v_uid then raise exception 'Solo quien creó el grupo puede hacer esto'; end if;
  delete from public.group_invites i using public.profiles p
   where i.group_id = g.id and i.user_id = p.id and lower(p.username) = lower(p_username);
end;
$$;

-- Mis invitaciones (el invitado sí recibe el código: es su invitación).
create or replace function public.my_group_invites()
returns table (code text, name text, members bigint, invited_by text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select g.code, g.name, (select count(*) from public.group_members x where x.group_id = g.id),
         (select username from public.profiles where id = i.invited_by), i.created_at
  from public.group_invites i join public.groups g on g.id = i.group_id
  where i.user_id = auth.uid()
  order by i.created_at desc
$$;

create or replace function public.answer_group_invite(p_code text, p_accept boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); g public.groups;
begin
  g := public._group_by_code(p_code);
  if g.id is null or v_uid is null then return null; end if;
  if not exists (select 1 from public.group_invites where group_id = g.id and user_id = v_uid) then
    raise exception 'Esa invitación ya no existe';
  end if;
  delete from public.group_invites where group_id = g.id and user_id = v_uid;
  if p_accept then return public.join_group(g.code); end if;  -- join_group comprueba los límites
  return null;
end;
$$;

-- La ficha del grupo incluye, para quien lo creó, las invitaciones pendientes.
create or replace function public.group_pending_invites(p_code text)
returns table (username text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.username, i.created_at
  from public.group_invites i join public.groups g on g.id = i.group_id join public.profiles p on p.id = i.user_id
  where g.code = upper(btrim(p_code)) and g.owner_id = auth.uid()
  order by i.created_at
$$;

-- Al unirse por cualquier vía, la invitación deja de estar pendiente.
create or replace function public._clear_invite_on_join()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.group_invites where group_id = new.group_id and user_id = new.user_id;
  return new;
end;
$$;
create trigger group_members_clear_invite after insert on public.group_members
  for each row execute function public._clear_invite_on_join();

revoke all on function public.invite_to_group(text, text), public.cancel_group_invite(text, text), public.my_group_invites(),
  public.answer_group_invite(text, boolean), public.group_pending_invites(text) from public, anon;
grant execute on function public.invite_to_group(text, text), public.cancel_group_invite(text, text), public.my_group_invites(),
  public.answer_group_invite(text, boolean), public.group_pending_invites(text) to authenticated;
revoke all on function public._clear_invite_on_join() from public, anon, authenticated;
