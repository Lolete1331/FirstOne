-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0002 · Perfiles y reclamaciones
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Perfiles públicos ──────────────────────────────────────────────────────
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  username         text not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  country          char(2) check (country ~ '^[A-Z]{2}$'),
  username_changes smallint not null default 0,
  created_at       timestamptz not null default now()
);
-- Únicos sin distinguir mayúsculas: "Diego" y "diego" son el mismo usuario.
create unique index profiles_username_lower_key on public.profiles (lower(username));

alter table public.profiles enable row level security;
create policy "perfiles visibles por todos" on public.profiles
  for select using (true);
create policy "cada uno crea su perfil" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "cada uno edita su perfil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- El @usuario solo se puede cambiar UNA vez (el historial debe ser coherente).
create or replace function public.profiles_guard()
returns trigger
language plpgsql
as $$
begin
  if new.id <> old.id or new.created_at <> old.created_at then
    raise exception 'campo inmutable';
  end if;
  if lower(new.username) <> lower(old.username) then
    if old.username_changes >= 1 then
      raise exception 'username_locked' using hint = 'El nombre de usuario solo puede cambiarse una vez.';
    end if;
    new.username_changes := old.username_changes + 1;
  else
    new.username_changes := old.username_changes;
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- ─── Reclamaciones ──────────────────────────────────────────────────────────
-- Cada persona que manda una palabra queda apuntada con su posición
-- (1 = primera = dueña de la palabra ese año y gana la medalla 🥇).
create table public.claims (
  id         bigint generated always as identity primary key,
  word       text not null references public.dictionary_words (word),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  position   integer not null check (position >= 1),
  claimed_at timestamptz not null default clock_timestamp(),   -- precisión de microsegundos
  -- El año lo decide SIEMPRE la base de datos a partir de claimed_at en UTC.
  -- El "reinicio" del 1 de enero 00:00 UTC es simplemente un año nuevo aquí.
  year       smallint generated always as
             (extract(year from (claimed_at at time zone 'UTC'))::smallint) stored,

  constraint claims_one_per_user unique (word, year, user_id),   -- cada persona, una vez por palabra y año
  constraint claims_position_unique unique (word, year, position)
);

-- REGLA 2: un único dueño (posición 1) por palabra y año, garantizado por Postgres.
create unique index claims_one_owner_per_word_year
  on public.claims (word, year) where position = 1;

create index claims_feed_idx    on public.claims (claimed_at desc);
create index claims_year_idx    on public.claims (year, claimed_at);
create index claims_user_idx    on public.claims (user_id, year);
create index claims_medals_idx  on public.claims (year, user_id) where position = 1;

alter table public.claims enable row level security;
create policy "reclamaciones visibles por todos" on public.claims
  for select using (true);
-- Sin políticas de insert/update/delete: solo claim_word() (security definer) escribe.

-- Contador por (palabra, año). Su fila hace de cerrojo: las posiciones se asignan
-- en orden estricto de llegada, sin huecos, aunque lleguen miles a la vez.
create table public.word_counters (
  word        text not null references public.dictionary_words (word),
  year        smallint not null,
  claim_count integer not null default 0,
  primary key (word, year)
);
alter table public.word_counters enable row level security;
create policy "contadores visibles por todos" on public.word_counters
  for select using (true);

-- ─── Anti-abuso ─────────────────────────────────────────────────────────────
create table public.claim_attempts (
  id           bigint generated always as identity primary key,
  user_id      uuid,
  ip           inet,
  attempted_at timestamptz not null default clock_timestamp()
);
create index claim_attempts_user_idx on public.claim_attempts (user_id, attempted_at);
create index claim_attempts_ip_idx   on public.claim_attempts (ip, attempted_at);
alter table public.claim_attempts enable row level security;   -- nadie lo lee desde el cliente
