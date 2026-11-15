-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0012 · Panel /admin: cuántos usuarios han jugado y cuántos no terminaron el registro
-- ════════════════════════════════════════════════════════════════════════════
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
    -- Con al menos una palabra (lo que cuenta «jugadores» en Estadísticas)
    'users_played',       (select count(distinct user_id) from public.claims where user_id is not null),
    -- Entraron (Google/email) pero no llegaron a elegir su @usuario
    'signups_incomplete', (select count(*) from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id)),
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
