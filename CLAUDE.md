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
- **Límite personal de palabras/minuto** (general: 10): tabla `user_claim_limits (user_id, per_minute)`.
  @carolina tiene 20 (decisión del dueño, 15-nov-2026). Quitarlo: `delete from user_claim_limits where user_id = …`.
- El sandbox no puede abrir firstone.es ni *.vercel.app: verifica con las API o pide al usuario que pruebe.

## Desarrollo y pruebas

- `npm test` (unitarios) · `npm run test:db` (Postgres desechable con las migraciones reales) · `npm run lint` · `npm run build`.
- Supabase local (`npx supabase start`) necesita Docker. En el sandbox la imagen de Kong no se
  descarga: se arranca con `-x kong,...` y un proxy propio en el puerto 54321.
- Para que el servidor de Next salga a internet desde el sandbox (p. ej. Wikcionario):
  `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npm run dev`.
- Guarda capturas y ficheros temporales en el scratchpad, nunca en el repositorio.

## Estructura de la web

- `/` portada (juego, lectura y juegos de palabras) · `/jugar` el juego (grupo de rutas `src/app/(juego)/` con su cabecera y menú).
- `/lectura` sección para niños con dislexia (`src/app/lectura/`, componentes en `src/components/lectura/`,
  datos en `src/lib/lectura/`): diseño tranquilo propio, ajustes de fondo/letra/tamaño/espaciado guardados en
  localStorage, voz con speechSynthesis, estrellas solo en el dispositivo. **Sin cuentas ni datos de menores.**
  Las listas de palabras se separan en sílabas a mano y un test comprueba que existen en el diccionario.

- `/palabra-oculta` «La palabra oculta» (adivinar la palabra del día, 4-8 letras, 6 intentos, pista = definición
  que gasta un intento). Enlazada desde la portada y `/jugar` (15-nov-2026). La palabra la calcula el servidor
  (`src/lib/oculta/secret.ts`, orden secreto con `HUMAN_COOKIE_SECRET`; lista en `src/lib/oculta/words.ts`), nunca
  se envía antes de acabar. Con cuenta, intentos en `hidden_word_plays` y aciertos en `hidden_word_solves`
  (clasificación «los primeros en encontrarla»); sin cuenta, progreso en localStorage.
  Palabras anteriores en `/palabra-oculta/anteriores` (se juegan con `?dia=AAAA-MM-DD`); la clasificación de cada
  día solo cuenta los aciertos de ese mismo día UTC (`hidden_word_on_time`). No usar el nombre «Wordle».
- `/juegos` apartado «Juegos de palabras» (en el menú): La palabra oculta, `/juegos/que-significa` (5 palabras curiosas
  al día, lista en `src/lib/juegos/significa-palabras.ts`, definiciones de Wikcionario vía `lookupDefinition`, API
  `/api/significa`) y `/juegos/sopa-de-letras` (tema diario de `src/lib/juegos/sopa-temas.ts`, generada en el navegador
  a partir de la fecha). Ambos sin cuenta; progreso en localStorage. Cambian a las 00:00 UTC.
  Más juegos (15-nov): `/juegos/existe` (palabras inventadas en `existe-data.ts`), `/juegos/refranes`, `/juegos/intrusa`
  (temas de la sopa con familias), `/juegos/b-o-v` (ortografía, `ortografia-data.ts`) — los cuatro con el componente
  `src/components/juegos/daily-quiz.tsx` y `src/lib/juegos/quiz-games.ts` —, `/juegos/anagramas` (API `/api/anagramas`,
  función SQL `anagram_candidates`) y `/juegos/ahorcado`. Tests de datos en `tests/unit/quiz-games.test.ts`.
  **Contenido para más de un año** (desde el 16-nov): listas generadas con `tools/juegos/generar-datos.py`
  (diccionario + frecuencias de `wordfreq`, filtro de palabras malsonantes). Los juegos del 15-nov usan las listas
  «v1» (`existe-v1.ts`, `ortografia-v1.ts`, primeros 40 temas, primeros 115 refranes) para no cambiar a mitad de día.
  Sopa: 62 temas (`words` + `more`, 8 palabras al día). Refranes: 223 (se repiten cada ~45 días, rebarajados),
  con dos finales falsos creíbles escritos a mano para cada uno en `refranes-falsos.ts` (mismo orden).
  Días anteriores en `/juegos/<juego>/anteriores` y `?dia=AAAA-MM-DD` (componente `src/components/juegos/day-archive.tsx`).
- `/palabra/[palabra]` página pública de cada palabra (dueño del año, años anteriores, significado en caché, botón
  «Compartir»), con imagen para redes generada al vuelo (`opengraph-image.tsx`, fuentes en `assets/fonts/`). Datos con
  `getWordInfo` (`src/lib/words/word-page.ts`, caché de minutos). Las palabras ocultas no tienen página. En el sitemap,
  las 5.000 palabras con dueño más recientes. Botón «Compartir» también en la medalla y enlace desde el historial.
- Rachas, insignias y grupos (16-nov): los juegos guardan el resultado en la cuenta (`record_game_result`, tabla
  `game_results`; `src/lib/juegos/record.ts`). Racha = días UTC seguidos con actividad (palabras, juegos o palabra
  oculta), `user_streak`. Insignias: datos en `user_badges`, nombres y umbrales en `src/lib/juegos/badges.ts`; se ven en
  el perfil (`profile-extras.tsx`) con `user_game_stats`. Grupos: `/grupos` y `/grupos/[código]` (6 caracteres),
  tablas `groups`/`group_members`, funciones `create_group`, `join_group`, `leave_group`, `remove_group_member`,
  `delete_group`, `my_groups`, `group_info` (la clasificación solo la ven los miembros). Tests en `tests/db/social.test.ts`.
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

Madrina: **Lola Pons** (aceptó el 16-nov-2026 que se la mencione como madrina y que se enlace su columna de El País
«¿Quiénes son ustedes?», 14-nov-2026). Datos en `src/lib/press/index.ts`; franja `PressBand` en la portada y en /jugar,
apartados «Nuestra madrina» y «Han hablado de nosotros» en /que-es, nota especial en /palabra/suscriptor.

Marketing: TikTok **@firstone.es**. Vídeos hechos con `tools/video/` (anuncio de 22 s y tutorial
completo de ~2 min con subtítulos quemados). Una lingüista de prestigio apoya el proyecto y lo va a
difundir; sus sugerencias (diploma, quitar el anglicismo «Stats», mostrar el @usuario) ya están
hechas. Pidió además un aire **«más de diccionario»** (menos festivo) y propuso llamar «Así estamos»
a las estadísticas (pendiente de decidir).

## Prioridades (en este orden)

1. ~~Login por email~~ conectado (15-nov): Supabase envía por SMTP de Resend (`smtp.resend.com`, remitente
   `hola@firstone.es`, dominio verificado en IONOS con registros `resend._domainkey` y `send`). Plantilla en español
   (`supabase/templates/magic_link.html`, aplicada a magic link y confirmación vía Management API), código de 6 cifras,
   límite 60 correos/hora. Plan gratuito de Resend: 100 correos/día y 3.000/mes.
2. **Turnstile** (anti-bots): crear clave en Cloudflare y poner `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y
   `TURNSTILE_SECRET_KEY` en Vercel (el código ya está preparado en `src/lib/human.ts`).
3. ~~Páginas legales~~ hechas (14-nov-2026); contacto público del proyecto en `LEGAL_CONTACT_EMAIL` (Vercel), también para sugerencias (pie y FAQ).
4. Vigilar límites: tarea programada diaria «Vigilar límites de FirstOne» (21:13 hora de Madrid, sesión nueva, solo
   lectura) que avisa al móvil si BD ≥70 %, correos ≥70/día, pico ≥300 palabras/min, ≥500 cuentas/día, despliegue
   en error o tokens caducados. Además, «Resumen diario de FirstOne» (22:03 Madrid, aviso al móvil siempre): cuentas
   nuevas y quiénes, palabras, partidas, grupos, jugador más activo. Supabase gratis: ≈200 conexiones realtime, 500 MB, 50.000 MAU.
5. ~~Aspecto «de diccionario»~~ hecho (16-nov): estilo clásico POR DEFECTO (`<html data-theme="clasico">`, colores y
   letras en `globals.css` bajo `[data-theme="clasico"]`), con botón 🎨 en la cabecera, la portada y los pies para
   cambiar al moderno (`src/components/theme-toggle.tsx`, se guarda en localStorage `fo-theme`). La sección de lectura
   (`.lx-root`) conserva sus letras para dislexia.
6. ~~Imagen para compartir~~ hecha (15-nov): `/palabra/…` con tarjeta para redes.
7. Palabra del día · ~~8. Página pública por palabra~~ hecha · ~~rachas~~ hechas (con insignias y grupos).

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
