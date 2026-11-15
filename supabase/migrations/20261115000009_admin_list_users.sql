-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0009 · Panel /admin: listado de usuarios ordenable
-- ════════════════════════════════════════════════════════════════════════════
-- p_sort: 'recientes' (alta más reciente) · 'actividad' (jugó hace menos) · 'palabras' ·
--         'medallas' · 'alfabetico' · 'bloqueados' (los bloqueados primero).
-- Devuelve también el total de usuarios que cumplen la búsqueda (para "Mostrando X de Y").
create or replace function public.admin_list_users(
  p_query text default '',
  p_sort  text default 'recientes',
  p_limit int  default 50
)
returns table (id uuid, username text, country char(2), created_at timestamptz, is_admin boolean,
               banned_at timestamptz, ban_reason text, medals bigint, words bigint,
               last_claim_at timestamptz, total bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.assert_admin();
  return query
    with u as (
      select p.id, p.username, p.country, p.created_at, p.is_admin, p.banned_at, p.ban_reason,
             count(c.id) filter (where c.position = 1) as medals,
             count(c.id) as words,
             max(c.claimed_at) as last_claim_at
      from public.profiles p left join public.claims c on c.user_id = p.id
      where coalesce(p_query, '') = ''
         or p.username ilike '%' || replace(replace(p_query, '%', ''), '_', '\_') || '%'
      group by p.id
    )
    select u.*, count(*) over () as total
    from u
    order by
      case when p_sort = 'bloqueados' then u.banned_at end desc nulls last,
      case when p_sort = 'actividad'  then u.last_claim_at end desc nulls last,
      case when p_sort = 'palabras'   then u.words end desc,
      case when p_sort = 'medallas'   then u.medals end desc,
      case when p_sort = 'alfabetico' then lower(u.username) end asc,
      u.created_at desc
    limit least(greatest(p_limit, 1), 1000);
end;
$$;
