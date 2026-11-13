truncate public.claims, public.word_counters, public.claim_attempts, public.profiles cascade;
delete from auth.users;
delete from realtime.messages;

-- Jugadores de demo
create temp table demo(name text, country text);
insert into demo values
  ('lexicomaniaca','ES'),('ElRayoMX','MX'),('che_palabras','AR'),('wordhunter','CO'),
  ('la_enie_es_mia','ES'),('PeruPalabra','PE'),('andina','CL'),('tico_veloz','CR'),('nocturno','UY'),('sinpais',null);
alter table demo add column id uuid default gen_random_uuid();
insert into auth.users (id, email, aud, role) select id, name || '@demo.dev', 'authenticated', 'authenticated' from demo;
insert into public.profiles (id, username, country) select id, name, country from demo;

-- Reclamaciones repartidas durante el año en curso (incluida una a los 0,4 s del reinicio)
do $$
declare
  users uuid[] := array(select id from public.profiles order by username);
  words text[] := array(select word from public.dictionary_words where length(word) between 4 and 9 order by md5(word) limit 400);
  y int := public.current_game_year();
  i int; w text; t timestamptz; n int;
begin
  perform public._claim_word_at(users[1], 'sol', null, public.year_start(y) + interval '0.412 seconds');
  perform public._claim_word_at(users[2], 'sol', null, public.year_start(y) + interval '0.977 seconds');
  perform public._claim_word_at(users[3], 'amor', null, public.year_start(y) + interval '1.3 seconds');
  for i in 1..array_length(words,1) loop
    w := words[i];
    t := public.year_start(y) + (random() * (now() - public.year_start(y) - interval '2 hours'));
    for n in 0..(case when i % 7 = 0 then 5 when i % 3 = 0 then 2 else 0 end) loop
      perform public._claim_word_at(users[1 + ((i * 7 + n * 3) % array_length(users,1))], w, null, t + n * interval '37 minutes');
    end loop;
  end loop;
  -- Unas cuantas recientes para el feed
  for i in 1..12 loop
    perform public._claim_word_at(users[1 + (i % array_length(users,1))], words[400 - i], null, now() - (i * interval '3 minutes'));
  end loop;
  -- Año anterior, para el historial
  perform public._claim_word_at(users[4], 'sol', null, public.year_start(y - 1) + interval '3 seconds');
  perform public._claim_word_at(users[5], 'amor', null, public.year_start(y - 1) + interval '9 seconds');
end $$;
delete from public.claim_attempts;
select count(*) claims, (select count(*) from public.profiles) players from public.claims;
