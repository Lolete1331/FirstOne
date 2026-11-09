#!/usr/bin/env bash
# Levanta un Postgres desechable, aplica las migraciones y ejecuta los tests de BD.
#   npm run test:db
# Requiere los binarios de PostgreSQL (initdb, pg_ctl) en el PATH o en /usr/lib/postgresql/*/bin.
# Alternativa: ejecutar contra `supabase start` →
#   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npx vitest run tests/db
set -euo pipefail
cd "$(dirname "$0")/.."

PGBIN="$(dirname "$(command -v pg_ctl 2>/dev/null || ls -d /usr/lib/postgresql/*/bin/pg_ctl | sort -V | tail -1)")"
PORT="${TEST_PG_PORT:-54329}"
DATA="$(mktemp -d)"
RUN=()
if [ "$(id -u)" = "0" ]; then  # Postgres no arranca como root
  chown postgres "$DATA"; RUN=(runuser -u postgres --)
fi

cleanup() { "${RUN[@]}" "$PGBIN/pg_ctl" -D "$DATA/pg" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT

# Locale "C" a propósito: comprueba que la normalización no depende del locale.
"${RUN[@]}" "$PGBIN/initdb" -D "$DATA/pg" -E UTF8 --locale=C -U postgres -A trust >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$DATA/pg" -o "-p $PORT -k $DATA -c listen_addresses=127.0.0.1" -l "$DATA/log" -w start >/dev/null

export DATABASE_URL="postgresql://postgres@127.0.0.1:$PORT/postgres"
PSQL=("$PGBIN/psql" "$DATABASE_URL" -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f tests/db/supabase-shim.sql
for f in supabase/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
echo "✔ migraciones aplicadas"
npx tsx scripts/load-dictionary.ts
npx vitest run tests/db "$@"
