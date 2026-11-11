# FirstOne — contexto para Claude

Juego web en producción en **https://firstone.es**: cada palabra del español solo puede tener
un dueño al año (la primera persona del mundo que la escribe). Reinicio el 1 de enero 00:00 UTC.
Los dueños del proyecto no son programadores: explícales los cambios en español, sin tecnicismos.

Lee también `AGENTS.md` (Next.js 16 tiene cambios importantes) y `README.md` (arquitectura y despliegue).

## Infraestructura (todo a nombre del dueño)

| Pieza | Dónde | Notas |
|---|---|---|
| Código | GitHub `Lolete1331/FirstOne` (público) | Rama `main`. **No subir datos personales ni claves.** |
| Web | Vercel, proyecto `first-one` | Cada push a `main` se despliega solo en producción. |
| Base de datos y login | Supabase, proyecto ref `dbeqvvsyjidzxponycmh` (región eu-west-3) | Plan gratuito. Login: Google + email (enlace/código). |
| Dominio | IONOS: `firstone.es` | DNS: A `@` → 216.198.79.1 y 64.29.17.1 · CNAME `www` → Vercel. No tocar MX/TXT (correo). |
| Login con Google | Google Cloud, cliente OAuth "FirstOne Web" | Orígenes: firstone.es, www.firstone.es, first-one-kappa-five.vercel.app |

Variables de entorno en Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`, `HUMAN_COOKIE_SECRET`, `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`.
Turnstile (anti-bots) aún **no** está configurado.

## Acceso desde las sesiones de Claude

El entorno cloud **"FirstOne"** permite `api.supabase.com`, `api.vercel.com` y `es.wiktionary.org`,
con tokens guardados como secretos de red (el proxy los inyecta; nunca pedirlos por el chat).
Los tokens de Supabase y Vercel **caducan** (~30 días desde el 10-nov-2026): si una llamada
devuelve 401, pide uno nuevo con `request_credential` explicando al usuario cómo crearlo
(Supabase: supabase.com/dashboard/account/tokens · Vercel: vercel.com/account/settings/tokens).

- **Migraciones en producción**: no hay conexión directa a Postgres. Se aplican por HTTPS con la
  Management API: `POST https://api.supabase.com/v1/projects/dbeqvvsyjidzxponycmh/database/query`
  con `{"query": "<sql>"}`, y se registran en `supabase_migrations.schema_migrations (version, name)`.
- **Desplegar**: basta con `git push origin main`. Estado: API de Vercel
  `GET /v6/deployments?teamId=team_PsuN00HeZ1ZXr2XdLGtXCxSB&limit=1&target=production`.
- **Hacer admin a alguien**: `select public.make_admin('usuario');` (vía la Management API).
- El sandbox no puede abrir firstone.es ni *.vercel.app: verifica con las API o pide al usuario que pruebe.

## Desarrollo y pruebas

- `npm test` (unitarios) · `npm run test:db` (Postgres desechable con las migraciones reales) · `npm run lint` · `npm run build`.
- Supabase local (`npx supabase start`) necesita Docker. En el sandbox la imagen de Kong no se
  descarga: se arranca con `-x kong,...` y un proxy propio en el puerto 54321.
- Para que el servidor de Next salga a internet desde el sandbox (p. ej. Wikcionario):
  `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npm run dev`.
- Guarda capturas y ficheros temporales en el scratchpad, nunca en el repositorio.

## Reglas del producto (no romperlas)

- Nunca vender ventaja: pagar no puede dar prioridad ni palabras.
- Un dueño por palabra y año lo garantiza Postgres (índice único parcial); las posiciones las asigna `claim_word()`.
- Las definiciones salen de Wikcionario (CC BY-SA 4.0, citar siempre) y se cachean en `word_definitions`.
  No copiar contenido del diccionario de la RAE; solo enlazar a dle.rae.es.
- No afirmar relación con la RAE.
- Antes de algo que borre datos de jugadores o sea difícil de deshacer, preguntar al dueño.

## Ideas pendientes

Tarjeta para compartir "soy el dueño de…", palabra del día, rachas, páginas públicas por palabra
para SEO, servidor de correo propio (Resend) para que el login por email funcione para todos,
Turnstile, páginas legales (privacidad, aviso legal, cookies).
