-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0004 · Feed en vivo (Supabase Realtime Broadcast)
-- ════════════════════════════════════════════════════════════════════════════
-- Cada reclamación nueva se emite al canal público "live-feed" con todos los datos
-- que necesita la UI (palabra, @usuario, país, posición), así el cliente no tiene
-- que hacer una consulta extra por cada mensaje.

create or replace function public.broadcast_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
begin
  select jsonb_build_object(
    'id',         new.id,
    'word',       new.word,
    'year',       new.year,
    'position',   new.position,
    'claimed_at', new.claimed_at,
    'username',   p.username,
    'country',    p.country
  ) into v_payload
  from public.profiles p where p.id = new.user_id;

  begin
    perform realtime.send(v_payload, 'claim', 'live-feed', false);
  exception when others then
    -- El feed nunca debe impedir una reclamación.
    raise warning 'broadcast_claim: %', sqlerrm;
  end;
  return null;
end;
$$;

create trigger claims_broadcast
  after insert on public.claims
  for each row execute function public.broadcast_claim();

revoke all on function public.broadcast_claim() from public, anon, authenticated;
