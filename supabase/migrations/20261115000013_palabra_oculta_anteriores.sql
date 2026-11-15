-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0013 · «La palabra oculta»: jugar palabras de días anteriores
-- ════════════════════════════════════════════════════════════════════════════
-- Se pueden jugar las palabras de días pasados, pero la clasificación de cada día solo
-- cuenta a quien la encontró ESE día (UTC): después, la solución ya puede ser conocida.

create or replace function public.hidden_word_on_time(p_day date, p_at timestamptz)
returns boolean language sql immutable as $$
  select p_at < ((p_day + 1)::timestamp at time zone 'UTC')
$$;

create or replace function public.hidden_word_ranking(p_day date, p_limit int default 10)
returns table (pos bigint, username text, country char(2), attempts smallint, hints smallint,
               solved_at timestamptz, total bigint)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by s.solved_at), p.username, p.country, s.attempts, s.hints, s.solved_at,
         count(*) over ()
  from public.hidden_word_solves s join public.profiles p on p.id = s.user_id
  where s.day = p_day and p.banned_at is null and public.hidden_word_on_time(s.day, s.solved_at)
  order by s.solved_at
  limit least(greatest(p_limit, 1), 100)
$$;

-- Cuántas personas encontraron cada palabra el día que salió (para la lista de anteriores).
create or replace function public.hidden_word_day_counts(p_from date, p_to date)
returns table (day date, solvers bigint)
language sql stable security definer set search_path = public as $$
  select s.day, count(*)
  from public.hidden_word_solves s join public.profiles p on p.id = s.user_id
  where s.day between p_from and p_to and p.banned_at is null and public.hidden_word_on_time(s.day, s.solved_at)
  group by s.day
$$;
