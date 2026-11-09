-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0005 · Consultas públicas: feed, rankings, historial, perfil, estadísticas
-- ════════════════════════════════════════════════════════════════════════════

create index word_counters_search_idx on public.word_counters (year, word text_pattern_ops);
create index word_counters_word_idx   on public.word_counters (word);

-- Año en curso según UTC (el reinicio es el 1 de enero 00:00 UTC).
create or replace function public.current_game_year()
returns smallint language sql stable as $$
  select extract(year from (now() at time zone 'UTC'))::smallint
$$;

-- ─── Feed ───────────────────────────────────────────────────────────────────
create or replace function public.recent_claims(p_limit int default 30, p_only_firsts boolean default false)
returns table (id bigint, word text, year smallint, "position" int, claimed_at timestamptz,
               username text, country char(2))
language sql stable as $$
  select c.id, c.word, c.year, c.position, c.claimed_at, p.username, p.country
  from public.claims c left join public.profiles p on p.id = c.user_id
  where not p_only_firsts or c.position = 1
  order by c.claimed_at desc
  limit least(greatest(p_limit, 1), 100)
$$;

-- ─── Rankings ───────────────────────────────────────────────────────────────
-- Ranking de usuarios: primero por medallas (palabras de las que es dueño),
-- luego por participaciones totales, y a igualdad, quien llegó antes.
create or replace function public.top_users(p_year int default null, p_limit int default 50)
returns table (rank bigint, username text, country char(2), medals bigint, words bigint)
language sql stable as $$
  with y as (select coalesce(p_year, public.current_game_year()) as v),
  agg as (
    select c.user_id,
           count(*) filter (where c.position = 1) as medals,
           count(*) as words,
           min(c.claimed_at) filter (where c.position = 1) as first_medal
    from public.claims c, y where c.year = y.v and c.user_id is not null
    group by c.user_id
  )
  select rank() over (order by a.medals desc, a.words desc) as rank,
         p.username, p.country, a.medals, a.words
  from agg a join public.profiles p on p.id = a.user_id
  order by a.medals desc, a.words desc, a.first_medal asc nulls last
  limit least(greatest(p_limit, 1), 200)
$$;

create or replace function public.top_countries(p_year int default null, p_limit int default 50)
returns table (rank bigint, country char(2), medals bigint, words bigint, players bigint)
language sql stable as $$
  with y as (select coalesce(p_year, public.current_game_year()) as v)
  select rank() over (order by count(*) filter (where c.position = 1) desc, count(*) desc),
         p.country,
         count(*) filter (where c.position = 1),
         count(*),
         count(distinct c.user_id)
  from public.claims c join public.profiles p on p.id = c.user_id, y
  where c.year = y.v and p.country is not null
  group by p.country
  order by 3 desc, 4 desc
  limit least(greatest(p_limit, 1), 250)
$$;

-- ─── Perfil ─────────────────────────────────────────────────────────────────
create or replace function public.user_profile(p_username text)
returns table (username text, country char(2), created_at timestamptz,
               medals_total bigint, words_total bigint, medals_this_year bigint)
language sql stable as $$
  select p.username, p.country, p.created_at,
         count(c.id) filter (where c.position = 1),
         count(c.id),
         count(c.id) filter (where c.position = 1 and c.year = public.current_game_year())
  from public.profiles p left join public.claims c on c.user_id = p.id
  where lower(p.username) = lower(p_username)
  group by p.id
$$;

create or replace function public.user_claims(p_username text, p_limit int default 500, p_offset int default 0)
returns table (word text, year smallint, "position" int, claimed_at timestamptz, total int)
language sql stable as $$
  select c.word, c.year, c.position, c.claimed_at, wc.claim_count
  from public.claims c
  join public.profiles p on p.id = c.user_id
  join public.word_counters wc on wc.word = c.word and wc.year = c.year
  where lower(p.username) = lower(p_username)
  order by c.year desc, c.claimed_at desc
  limit least(greatest(p_limit, 1), 1000) offset greatest(p_offset, 0)
$$;

-- ─── Historial ──────────────────────────────────────────────────────────────
-- Una fila por año en que se reclamó la palabra: dueño + cuántos la mandaron.
create or replace function public.word_history(p_word text)
returns table (year smallint, total int, owner text, owner_country char(2), owner_claimed_at timestamptz,
               seconds_after_reset double precision)
language sql stable as $$
  select wc.year, wc.claim_count, p.username, p.country, c.claimed_at,
         extract(epoch from c.claimed_at - public.year_start(wc.year))
  from public.word_counters wc
  join public.claims c on c.word = wc.word and c.year = wc.year and c.position = 1
  left join public.profiles p on p.id = c.user_id
  where wc.word = public.normalize_word(p_word)
  order by wc.year desc
$$;

-- Todos los que mandaron la palabra ese año, en orden de llegada (paginado).
create or replace function public.word_claimants(p_word text, p_year int, p_offset int default 0, p_limit int default 50)
returns table ("position" int, username text, country char(2), claimed_at timestamptz)
language sql stable as $$
  select c.position, p.username, p.country, c.claimed_at
  from public.claims c left join public.profiles p on p.id = c.user_id
  where c.word = public.normalize_word(p_word) and c.year = p_year
    and c.position > greatest(p_offset, 0)
  order by c.position
  limit least(greatest(p_limit, 1), 200)
$$;

-- Buscar palabras reclamadas en un año (por prefijo).
create or replace function public.search_words(p_year int default null, p_query text default '',
                                               p_limit int default 50, p_offset int default 0)
returns table (word text, year smallint, total int, owner text, owner_country char(2), owner_claimed_at timestamptz)
language sql stable as $$
  with q as (
    select coalesce(p_year, public.current_game_year()) as y,
           -- solo letras: evita comodines de LIKE
           regexp_replace(public.normalize_word(p_query), '[^a-záéíóúüñ]', '', 'g') as prefix
  )
  select wc.word, wc.year, wc.claim_count, p.username, p.country, c.claimed_at
  from q
  join public.word_counters wc on wc.year = q.y and wc.word like q.prefix || '%'
  join public.claims c on c.word = wc.word and c.year = wc.year and c.position = 1
  left join public.profiles p on p.id = c.user_id
  order by case when q.prefix = '' then null else wc.word end, c.claimed_at desc
  limit least(greatest(p_limit, 1), 200) offset greatest(p_offset, 0)
$$;

create or replace function public.available_years()
returns table (year smallint)
language sql stable as $$
  select distinct year from public.word_counters
  union select public.current_game_year()
  order by 1 desc
$$;

-- ─── Estadísticas ───────────────────────────────────────────────────────────
create or replace function public.year_stats(p_year int default null)
returns jsonb
language sql stable as $$
  with y as (select coalesce(p_year, public.current_game_year()) as v),
  dict as (select count(*)::bigint as n from public.dictionary_words),
  counters as (
    select count(*)::bigint as conquered, coalesce(sum(claim_count), 0)::bigint as claims
    from public.word_counters, y where year = y.v
  ),
  fastest as (
    select c.word, p.username, p.country, c.claimed_at,
           extract(epoch from c.claimed_at - public.year_start(y.v)) as seconds
    from public.claims c left join public.profiles p on p.id = c.user_id, y
    where c.year = y.v and c.position = 1
    order by c.claimed_at asc limit 1
  ),
  most_wanted as (
    select wc.word, wc.claim_count from public.word_counters wc, y
    where wc.year = y.v order by wc.claim_count desc, wc.word limit 1
  )
  select jsonb_build_object(
    'year',             (select v from y),
    'words_conquered',  counters.conquered,
    'total_claims',     counters.claims,
    'players',          (select count(distinct user_id) from public.claims, y where year = y.v),  -- count ignora NULL
    'dictionary_total', dict.n,
    'percent',          case when dict.n = 0 then 0 else round(counters.conquered * 100.0 / dict.n, 4) end,
    'fastest',          (select to_jsonb(f) from fastest f),
    'most_wanted',      (select to_jsonb(m) from most_wanted m)
  )
  from counters, dict
$$;
