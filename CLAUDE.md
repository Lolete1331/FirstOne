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
Páginas legales (`/privacidad`, `/aviso-legal`, `/cookies`): el responsable y el email de contacto se leen de
`LEGAL_OWNER_NAME` y `LEGAL_CONTACT_EMAIL` en Vercel (no van en el repositorio). Contador de visitas: Vercel Web Analytics (sin cookies).

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

## Estructura de la web

- `/` portada con dos opciones · `/jugar` el juego (grupo de rutas `src/app/(juego)/` con su cabecera y menú).
- `/lectura` sección para niños con dislexia (`src/app/lectura/`, componentes en `src/components/lectura/`,
  datos en `src/lib/lectura/`): diseño tranquilo propio, ajustes de fondo/letra/tamaño/espaciado guardados en
  localStorage, voz con speechSynthesis, estrellas solo en el dispositivo. **Sin cuentas ni datos de menores.**
  Las listas de palabras se separan en sílabas a mano y un test comprueba que existen en el diccionario.

- `/diploma/[palabra]/[año]` diploma imprimible (A4 apaisado, estilo clásico) para el dueño de una palabra;
  el botón solo lo ve el dueño (resultado de la medalla e historial). Nombre opcional, no se guarda.

## Reglas del producto (no romperlas)

- Nunca vender ventaja: pagar no puede dar prioridad ni palabras.
- Un dueño por palabra y año lo garantiza Postgres (índice único parcial); las posiciones las asigna `claim_word()`.
- Las definiciones salen de Wikcionario (CC BY-SA 4.0, citar siempre) y se cachean en `word_definitions`.
  No copiar contenido del diccionario de la RAE; solo enlazar a dle.rae.es.
- No afirmar relación con la RAE.
- Sección de dislexia: lenguaje prudente (no diagnosticar, recomendar profesionales), sin cronómetros ni
  presión, sin recoger datos de niños.
- Antes de algo que borre datos de jugadores o sea difícil de deshacer, preguntar al dueño.

## Estado actual (13-nov-2026)

En producción y probado: juego con medalla y posiciones (#619…), feed en vivo, ranking por jugador
y país, historial con todos los que llegaron después, estadísticas («Estadísticas», antes «Stats»),
perfiles por años, panel `/admin` (el dueño es el único admin), login con Google, botón
«📖 Significado» (Wikcionario + enlace a la RAE), **diploma imprimible**, la pantalla de la medalla
dice ««palabra» es de @usuario» (para compartir capturas), portada con dos opciones, sección de
dislexia `/lectura`, SEO (sitemap, robots, Open Graph, `/que-es` con FAQ, `llms.txt`), app
instalable (manifest), logo y kit de marca en `brand/`.

Marketing: TikTok **@firstone.es**. Vídeos hechos con `tools/video/` (anuncio de 22 s y tutorial
completo de ~2 min con subtítulos quemados). Una lingüista de prestigio apoya el proyecto y lo va a
difundir; sus sugerencias (diploma, quitar el anglicismo «Stats», mostrar el @usuario) ya están
hechas. Pidió además un aire **«más de diccionario»** (menos festivo) y propuso llamar «Así estamos»
a las estadísticas (pendiente de decidir).

## Prioridades (en este orden)

1. **Login por email para todos**: conectar SMTP propio (Resend, gratis 3.000/mes) en Supabase y,
   con él, la plantilla de correo con código (`supabase/templates/magic_link.html`; el proyecto
   usa códigos de 8 dígitos → se dejó en 6 con la Management API; la UI acepta 6-8). Ahora solo
   funciona Google para el público. Necesita que el dueño cree la cuenta de Resend.
2. **Turnstile** (anti-bots): crear clave en Cloudflare y poner `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y
   `TURNSTILE_SECRET_KEY` en Vercel (el código ya está preparado en `src/lib/human.ts`).
3. ~~Páginas legales~~ hechas (14-nov-2026); falta poner `LEGAL_CONTACT_EMAIL` en Vercel.
4. Vigilar límites del plan gratuito de Supabase (≈200 conexiones realtime simultáneas).
5. **Aspecto «de diccionario»** (papel, tipografía clásica), quizá como «modo clásico» primero.
   El diploma (Cormorant/EB Garamond, crema y dorado) es la referencia de estilo.
6. **Imagen para compartir** ««palabra» es de @usuario 🥇» (WhatsApp/Instagram/X).
7. Palabra del día · 8. Página pública por palabra (`/palabra/…`) para SEO · rachas.

## Trucos aprendidos (sandbox)

- El contenedor se reinicia a menudo: hay que volver a arrancar `dockerd`, el contenedor
  `supabase_kong_firstone` (sirve las plantillas de correo con un bucle `nc`), `tools/dev/kong-sustituto.cjs`
  y `npm run dev` (con `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`).
- Copia local: `npx supabase start -x kong,studio,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor,postgres-meta`
  (con el sustituto de Kong ya escuchando en :54321), `.env.local` con `NEXT_PUBLIC_SUPABASE_URL=` vacío y
  `SUPABASE_URL=http://127.0.0.1:54321`; la app completa se ve en `http://localhost:8080`.
- Next 16 conserva copias **ocultas** de páginas visitadas: en Playwright usa `getByRole` o
  `visible=true`, no `getByText` a secas. Al volver de otra página, el estado (p. ej. la medalla abierta) se conserva.
- Playwright: escribe letras como «ñ» con `pressSequentially`, no con `press`.
- Wikcionario limita (429) desde la IP del sandbox: por eso las definiciones se cachean en `word_definitions`.
- Los tokens de Supabase y Vercel caducan hacia el **10-dic-2026**.
