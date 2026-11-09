-- Simula lo mínimo de Supabase para testear las migraciones en un Postgres "pelado".
-- NO se aplica en Supabase (allí ya existen auth, realtime y los roles).
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create schema realtime;
create table realtime.sent_messages (
  id bigint generated always as identity, payload jsonb, event text, topic text, private boolean
);
create function realtime.send(payload jsonb, event text, topic text, private boolean default true)
returns void language sql as $$
  insert into realtime.sent_messages (payload, event, topic, private) values (payload, event, topic, private)
$$;

-- Privilegios por defecto como en Supabase: todo lo nuevo en public es accesible
-- para anon/authenticated (por eso las migraciones hacen REVOKE explícitos).
grant usage on schema public, auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
