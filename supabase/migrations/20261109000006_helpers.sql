-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0006 · Ayudas para la UI
-- ════════════════════════════════════════════════════════════════════════════

-- ¿Está libre este @usuario? (sin distinguir mayúsculas)
create or replace function public.username_available(p_username text)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_username ~ '^[A-Za-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles where lower(username) = lower(p_username))
$$;

-- Estado de una palabra este año, para la pista mientras escribes:
-- ¿existe? ¿tiene dueño? ¿cuántos la han mandado?
create or replace function public.word_status(p_word text)
returns jsonb
language sql stable security definer set search_path = public as $$
  with w as (select public.normalize_word(p_word) as v, public.current_game_year() as y)
  select jsonb_build_object(
    'word',   w.v,
    'exists', exists (select 1 from public.dictionary_words d where d.word = w.v),
    'total',  coalesce((select claim_count from public.word_counters c where c.word = w.v and c.year = w.y), 0),
    'owner',  (select p.username from public.claims c join public.profiles p on p.id = c.user_id
               where c.word = w.v and c.year = w.y and c.position = 1)
  )
  from w
$$;
