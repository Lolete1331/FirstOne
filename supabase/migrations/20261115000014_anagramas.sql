-- ════════════════════════════════════════════════════════════════════════════
-- FirstOne · 0014 · Juego «Anagramas»: palabras que se pueden formar con unas letras
-- ════════════════════════════════════════════════════════════════════════════
-- Devuelve las palabras del diccionario de 3 a 7 letras escritas solo con esas letras
-- (sin tener en cuenta tildes): la palabra tal cual y su forma sin tildes.
-- El servidor comprueba después que no se use ninguna letra más veces de las que hay.
drop function if exists public.anagram_candidates(text);
create or replace function public.anagram_candidates(p_letters text)
returns table (word text, folded text) language sql stable security definer set search_path = public as $$
  select d.word, public.fold_word(d.word)
  from public.dictionary_words d
  where char_length(d.word) between 3 and 7
    and public.fold_word(d.word) ~ ('^[' || regexp_replace(lower(p_letters), '[^a-zñ]', '', 'g') || ']+$')
$$;
revoke all on function public.anagram_candidates(text) from public, anon, authenticated;
grant execute on function public.anagram_candidates(text) to service_role;
