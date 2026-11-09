-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0001 · Diccionario
-- ════════════════════════════════════════════════════════════════════════════

-- Normalización canónica. DEBE coincidir con src/lib/words/normalize.ts.
--   NFC → trim → colapsar espacios → minúsculas. Respeta tildes y ñ.
create or replace function public.normalize_word(p text)
returns text
language sql
immutable
parallel safe
as $$
  -- translate() garantiza Á→á, Ñ→ñ… aunque el locale de la BD sea "C".
  select translate(
    lower(regexp_replace(btrim(normalize(coalesce(p, ''), NFC)), '\s+', ' ', 'g')),
    'ÁÉÍÓÚÜÑ', 'áéíóúüñ'
  )
$$;

create table public.dictionary_words (
  word       text primary key
             check (word = public.normalize_word(word) and word ~ '^[a-záéíóúüñ]{1,40}$'),
  source     text not null default 'lemario',
  created_at timestamptz not null default now()
);

comment on table public.dictionary_words is
  'Palabras válidas (lemas del DLE + femeninos). Se carga con `npm run dict:load`.';

alter table public.dictionary_words enable row level security;
create policy "diccionario legible por todos" on public.dictionary_words
  for select using (true);

-- ¿Existe la palabra? (normaliza la entrada)
create or replace function public.word_exists(p_word text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.dictionary_words where word = public.normalize_word(p_word))
$$;
