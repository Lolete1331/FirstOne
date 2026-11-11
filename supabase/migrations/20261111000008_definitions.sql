-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0008 · Caché de definiciones (Wikcionario, CC BY-SA 4.0)
-- ════════════════════════════════════════════════════════════════════════════
-- Cada palabra se consulta a Wikcionario una sola vez; después se sirve desde aquí.
-- Solo escribe el servidor (service_role); todo el mundo puede leer.

create table public.word_definitions (
  word       text primary key references public.dictionary_words (word) on delete cascade,
  lemma      text not null,
  groups     jsonb not null default '[]'::jsonb,   -- [{ pos, senses: [{ n, text, fields }] }]
  source     text not null check (source in ('wiktionary', 'none')),
  fetched_at timestamptz not null default now()
);

alter table public.word_definitions enable row level security;
create policy "definiciones legibles por todos" on public.word_definitions for select using (true);
revoke insert, update, delete on public.word_definitions from anon, authenticated;
