-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0003 · Reclamar una palabra (todo en una transacción)
-- ════════════════════════════════════════════════════════════════════════════

-- Inicio de un año de juego (1 de enero 00:00 UTC).
create or replace function public.year_start(p_year int)
returns timestamptz language sql immutable as $$
  select make_timestamptz(p_year, 1, 1, 0, 0, 0, 'UTC')
$$;

-- Límites anti-abuso (por minuto).
create or replace function public.claim_limits()
returns table (per_user int, per_ip int)
language sql immutable as $$ select 10, 30 $$;

-- Núcleo de la reclamación. NO se expone a los clientes.
-- p_at = NULL (producción): el instante se toma con clock_timestamp() JUSTO al obtener
--   el turno (cerrojo del contador), así posición y hora siempre van en el mismo orden.
-- p_at explícito: solo para tests (simular el cambio de año).
create or replace function public._claim_word_at(
  p_user_id uuid,
  p_word    text,
  p_ip      inet,
  p_at      timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
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
    where user_id = p_user_id and attempted_at > v_now - interval '1 minute';
  if v_user_n > v_lim.per_user then
    return jsonb_build_object('status', 'rate_limited', 'retry_after', 60);
  end if;
  if p_ip is not null then
    select count(*) into v_ip_n from public.claim_attempts
      where ip = p_ip and attempted_at > v_now - interval '1 minute';
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
$$;

-- Construye la respuesta: la reclamación propia + quién es el dueño.
create or replace function public._claim_result(p_status text, p_claim public.claims)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'status',     p_status,
    'word',       p_claim.word,
    'year',       p_claim.year,
    'position',   p_claim.position,
    'claimed_at', p_claim.claimed_at,
    'total',      (select claim_count from public.word_counters
                    where word = p_claim.word and year = p_claim.year),
    'owner', (
      select jsonb_build_object('username', p.username, 'country', p.country, 'claimed_at', c.claimed_at)
      from public.claims c join public.profiles p on p.id = c.user_id
      where c.word = p_claim.word and c.year = p_claim.year and c.position = 1
    )
  )
$$;

-- Punto de entrada que usa la app. Solo lo llama el servidor (service_role) después de
-- verificar la sesión y Turnstile, por eso recibe el user_id y la IP.
create or replace function public.claim_word(p_user_id uuid, p_word text, p_ip inet default null)
returns jsonb
language sql
volatile
security definer
set search_path = public
as $$
  select public._claim_word_at(p_user_id, p_word, p_ip, null)
$$;

-- Supabase concede EXECUTE a anon/authenticated por defecto: se retira explícitamente.
revoke all on function public._claim_word_at(uuid, text, inet, timestamptz) from public, anon, authenticated;
revoke all on function public._claim_result(text, public.claims) from public, anon, authenticated;
revoke all on function public.claim_word(uuid, text, inet) from public, anon, authenticated;
grant execute on function public.claim_word(uuid, text, inet) to service_role;
