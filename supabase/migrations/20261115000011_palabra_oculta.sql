-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0011 · «La palabra oculta» (una palabra al día para adivinar)
-- ════════════════════════════════════════════════════════════════════════════
-- La palabra del día NO se guarda en la base de datos: la calcula el servidor con una clave secreta.
-- Aquí solo se apuntan los intentos de quien juega con cuenta (para que no pueda repetir)
-- y quién la acierta (clasificación «los primeros en encontrarla»).
-- Solo escribe el servidor (service_role).

-- Buscar en el diccionario sin tener en cuenta tildes ni diéresis (la ñ sí cuenta).
create or replace function public.fold_word(p text)
returns text language sql immutable parallel safe as $$
  select translate(lower(p), 'áéíóúüàèìòùâêîôûäëïö', 'aeiouuaeiouaeiouaeio')
$$;

create index if not exists dictionary_words_folded_idx on public.dictionary_words (public.fold_word(word));

-- Devuelve la palabra del diccionario que corresponde a lo escrito (con sus tildes), o NULL.
create or replace function public.dictionary_lookup_folded(p_folded text)
returns text language sql stable security definer set search_path = public as $$
  select word from public.dictionary_words
  where public.fold_word(word) = p_folded
  order by (word = p_folded) desc, word
  limit 1
$$;

-- Intentos de cada jugador con cuenta (guess NULL = pidió la pista).
create table public.hidden_word_plays (
  day        date not null,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  n          smallint not null check (n between 1 and 6),
  guess      text,
  created_at timestamptz not null default clock_timestamp(),
  primary key (day, user_id, n)            -- dos peticiones a la vez no pueden gastar el mismo intento
);
alter table public.hidden_word_plays enable row level security;   -- solo el servidor

-- Quién la ha encontrado cada día y en cuántos intentos.
create table public.hidden_word_solves (
  day       date not null,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  attempts  smallint not null check (attempts between 1 and 6),
  hints     smallint not null default 0,
  solved_at timestamptz not null default clock_timestamp(),
  primary key (day, user_id)
);
create index hidden_word_solves_day_idx on public.hidden_word_solves (day, solved_at);
alter table public.hidden_word_solves enable row level security;  -- se lee con la función de abajo

-- Clasificación pública de un día: los primeros en encontrarla.
create or replace function public.hidden_word_ranking(p_day date, p_limit int default 10)
returns table (pos bigint, username text, country char(2), attempts smallint, hints smallint,
               solved_at timestamptz, total bigint)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by s.solved_at), p.username, p.country, s.attempts, s.hints, s.solved_at,
         count(*) over ()
  from public.hidden_word_solves s join public.profiles p on p.id = s.user_id
  where s.day = p_day and p.banned_at is null
  order by s.solved_at
  limit least(greatest(p_limit, 1), 100)
$$;

revoke all on function public.dictionary_lookup_folded(text) from public, anon, authenticated;
grant execute on function public.dictionary_lookup_folded(text) to service_role;
