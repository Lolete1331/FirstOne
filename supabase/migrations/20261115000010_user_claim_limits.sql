-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0010 · Límite de palabras por minuto personalizado por usuario
-- ════════════════════════════════════════════════════════════════════════════
-- Por defecto, 10 palabras/minuto por usuario (claim_limits()). El admin puede fijar otro
-- número para una cuenta concreta. El límite por conexión (IP) sigue siendo el general.
create table public.user_claim_limits (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  per_minute int not null check (per_minute between 1 and 120),
  set_at     timestamptz not null default now()
);
alter table public.user_claim_limits enable row level security;   -- nadie la lee desde el cliente

CREATE OR REPLACE FUNCTION public._claim_word_at(p_user_id uuid, p_word text, p_ip inet, p_at timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_word     text := public.normalize_word(p_word);
  v_now      timestamptz := coalesce(p_at, clock_timestamp());
  v_year     smallint := extract(year from (v_now at time zone 'UTC'))::smallint;
  v_ts       timestamptz;
  v_pos      integer;
  v_existing public.claims%rowtype;
  v_owner    record;
  v_user_n   int;
  v_ip_n     int;
  v_lim      record;
begin
  if p_user_id is null then
    return jsonb_build_object('status', 'unauthenticated');
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    return jsonb_build_object('status', 'no_profile');
  end if;

  -- 1) Límite de intentos (cuenta también los intentos fallidos).
  select * into v_lim from public.claim_limits();
  insert into public.claim_attempts (user_id, ip, attempted_at) values (p_user_id, p_ip, v_now);
  select count(*) into v_user_n from public.claim_attempts
    where user_id = p_user_id and attempted_at > v_now - interval '1 minute' and attempted_at <= v_now;
  -- Límite personal si el admin le ha puesto uno (tabla user_claim_limits); si no, el general.
  if v_user_n > coalesce((select l.per_minute from public.user_claim_limits l where l.user_id = p_user_id),
                         v_lim.per_user) then
    return jsonb_build_object('status', 'rate_limited', 'retry_after', 60);
  end if;
  if p_ip is not null then
    select count(*) into v_ip_n from public.claim_attempts
      where ip = p_ip and attempted_at > v_now - interval '1 minute' and attempted_at <= v_now;
    if v_ip_n > v_lim.per_ip then
      return jsonb_build_object('status', 'rate_limited', 'retry_after', 60);
    end if;
  end if;
  -- Limpieza perezosa de intentos antiguos.
  if random() < 0.01 then
    delete from public.claim_attempts where attempted_at < v_now - interval '1 hour';
  end if;

  -- 2) ¿Está en el diccionario?
  if v_word !~ '^[a-záéíóúüñ]{1,40}$'
     or not exists (select 1 from public.dictionary_words where word = v_word) then
    return jsonb_build_object('status', 'invalid', 'word', v_word);
  end if;

  -- 3) ¿Ya la había mandado esta persona este año?
  select * into v_existing from public.claims
    where word = v_word and year = v_year and user_id = p_user_id;
  if found then
    return public._claim_result('already_yours', v_existing);
  end if;

  -- 4) Asignar posición. La fila del contador queda bloqueada hasta el COMMIT,
  --    así que las reclamaciones simultáneas se ordenan por llegada a la BD.
  begin
    insert into public.word_counters as wc (word, year, claim_count)
      values (v_word, v_year, 1)
    on conflict (word, year) do update set claim_count = wc.claim_count + 1
    returning claim_count into v_pos;

    -- Hora exacta tomada con el turno ya asignado. Si la espera cruzó la medianoche
    -- del 1 de enero, la reclamación se queda en el año en que llegó.
    v_ts := coalesce(p_at, least(clock_timestamp(),
                                 public.year_start(v_year + 1) - interval '1 microsecond'));

    insert into public.claims (word, user_id, position, claimed_at)
      values (v_word, p_user_id, v_pos, v_ts)
    returning * into v_existing;
  exception when unique_violation then
    -- Doble envío simultáneo del mismo usuario: se deshace también el contador.
    select * into v_existing from public.claims
      where word = v_word and year = v_year and user_id = p_user_id;
    return public._claim_result('already_yours', v_existing);
  end;

  return public._claim_result(case when v_pos = 1 then 'won' else 'joined' end, v_existing);
end;
$function$;
