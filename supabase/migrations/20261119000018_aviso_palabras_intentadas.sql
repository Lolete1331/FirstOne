-- «Tu palabra la han intentado quitar» (19-nov-2026).
-- Al volver a la web, el dueño de una palabra ve cuántas personas la han escrito después que él
-- desde su última visita. «Última visita» = la última vez que cerró el aviso (o los últimos 7 días).

create table public.word_alerts_seen (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  seen_at timestamptz not null default now()
);
alter table public.word_alerts_seen enable row level security;   -- solo con las funciones de abajo

create or replace function public.my_word_challengers()
returns jsonb language sql stable security definer set search_path = public as $$
  with me as (select auth.uid() as id),
  since as (
    select greatest(coalesce((select seen_at from public.word_alerts_seen where user_id = (select id from me)), now() - interval '7 days'),
                    now() - interval '30 days') as t
  ),
  hits as (
    select c2.word, c2.claimed_at, c2.user_id
    from public.claims c2
    where c2.claimed_at > (select t from since)
      and c2.position > 1
      and c2.user_id <> (select id from me)
      and exists (select 1 from public.claims c1
                  where c1.word = c2.word and c1.year = c2.year and c1.position = 1 and c1.user_id = (select id from me))
      and not exists (select 1 from public.hidden_words h where h.word = c2.word)
  ),
  per_word as (
    select h.word, count(*) as n, max(h.claimed_at) as last_at,
           (select p.username from hits x join public.profiles p on p.id = x.user_id
             where x.word = h.word order by x.claimed_at desc limit 1) as last_user
    from hits h group by h.word
  )
  select case when (select id from me) is null then null else jsonb_build_object(
    'since', (select t from since),
    'total', (select count(*) from hits),
    'people', (select count(distinct user_id) from hits),
    'words', coalesce((select jsonb_agg(jsonb_build_object('word', word, 'n', n, 'last_user', last_user) order by n desc, last_at desc)
                       from (select * from per_word order by n desc, last_at desc limit 5) w), '[]'::jsonb),
    'more_words', greatest((select count(*) from per_word) - 5, 0)
  ) end
$$;

create or replace function public.mark_word_challengers_seen()
returns void language sql security definer set search_path = public as $$
  insert into public.word_alerts_seen (user_id, seen_at) select auth.uid(), now() where auth.uid() is not null
  on conflict (user_id) do update set seen_at = excluded.seen_at
$$;

revoke all on function public.my_word_challengers(), public.mark_word_challengers_seen() from public, anon;
grant execute on function public.my_word_challengers(), public.mark_word_challengers_seen() to authenticated;
