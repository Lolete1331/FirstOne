# FirstOne

**Cada palabra del español tiene un único dueño al año: el primero en escribirla.**

FirstOne es una competición global y anual. Cualquier persona puede reclamar palabras del
diccionario siendo la primera del mundo en escribirlas. Quien llega primero se lleva la
medalla 🥇 y la palabra es suya todo el año. Todos los que la escriben después quedan
apuntados con su posición (#2, #3… #4.729). El **1 de enero a las 00:00 UTC** empieza una
carrera nueva, y el historial de cada año se conserva para siempre.

- **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Realtime) · Motion (Framer Motion) · Cloudflare Turnstile
- **Pantallas:** Jugar · En vivo · Ranking (jugadores y países) · Historial · Estadísticas · Perfil

<p align="center">
  <img src="docs/screenshots/03-eres-el-primero.png" width="220" alt="¡Eres el primero!">
  <img src="docs/screenshots/05-ya-tiene-dueno.png" width="220" alt="Ya tiene dueño: posición #3">
  <img src="docs/screenshots/08-historial-sol.png" width="220" alt="Historial de una palabra">
</p>

---

## Cómo funciona por dentro

### Reglas garantizadas por la base de datos

Toda la lógica crítica vive en Postgres, dentro de **una sola transacción**: la función
`claim_word()` en `supabase/migrations/…_claim_word.sql`.

| Regla | Cómo se garantiza |
|---|---|
| Un solo dueño por palabra y año | Índice único parcial `claims (word, year) WHERE position = 1` |
| Cada persona, una vez por palabra y año | `UNIQUE (word, year, user_id)` |
| Posiciones en orden de llegada, sin huecos | Fila de `word_counters` como cerrojo: `INSERT … ON CONFLICT DO UPDATE SET claim_count = claim_count + 1` |
| Hora exacta | `claimed_at timestamptz` (microsegundos), tomada con `clock_timestamp()` justo al obtener el turno, así hora y posición siempre van en el mismo orden |
| Reinicio anual sin borrar nada | `year` es una columna **generada** a partir de `claimed_at` en UTC. "Año actual" es solo un filtro |
| Solo palabras del diccionario | Clave foránea a `dictionary_words` + validación dentro de la transacción |
| Límite anti-abuso | 10 intentos/min por usuario y 30/min por IP (`claim_attempts`), en la misma transacción |
| Nadie escribe directamente | RLS sin políticas de escritura en `claims`. `claim_word()` solo la puede ejecutar `service_role` |

**Flujo de una reclamación:** navegador → `POST /api/claim` (comprueba el JWT de Supabase y
la cookie anti-bots) → `claim_word(user_id, palabra, ip)` con la clave secreta → un trigger
emite la reclamación por **Supabase Realtime Broadcast** (canal público `live-feed`) → el feed
en vivo de todo el mundo se actualiza.

**Protección contra bots:** pedir un captcha en cada palabra frenaría la carrera. Por eso
Turnstile se verifica una sola vez y el servidor emite una cookie firmada con HMAC, ligada
al usuario y válida 30 minutos (`src/lib/human.ts`).

### El diccionario

La RAE no ofrece una API pública, así que `supabase/data/dictionary.tsv` (95.352 palabras)
se genera con `npm run dict:build` a partir de:

1. **Lemario general del español** ([olea/lemarios](https://github.com/olea/lemarios), dominio
   público, extraído del DRAE). Solo entran lemas en minúscula formados por letras. Quedan
   fuera locuciones latinas, afijos ("-able"), siglas y nombres propios.
2. **Femeninos.** El lemario solo trae la forma masculina ("abogado" por "abogado, da"). El
   femenino singular se genera solo cuando el diccionario Hunspell es_ES (RLA-ES, paquete
   `dictionary-es`) marca la palabra con su regla de género, o cuando el femenino existe
   como entrada propia ("jefa", "presidenta"). Así se evitan falsos femeninos como
   "canto" → "canta". Resultado: 8.553 femeninos.

Valen lemas **en singular, en masculino o femenino**: *abogado* y *abogada* sí, *abogados*
no. Se respetan tildes, diéresis y ñ: "año" y "ano" son palabras distintas.

La normalización (NFC → trim → minúsculas) existe en TypeScript (`src/lib/words/normalize.ts`)
y en SQL (`normalize_word()`), y un test comprueba que ambas dan el mismo resultado. La
validación está aislada tras la interfaz `WordValidator` (`src/lib/words/validator.ts`). Para
cambiar de fuente basta con regenerar el `.tsv` o implementar otro validador.

---

## Ejecutar en local

Requisitos: **Node 20+** y **Docker** (para Supabase local).

```bash
npm install
```

Arranca Supabase local. Aplica las migraciones de `supabase/migrations` automáticamente:

```bash
npx supabase start
```

Copia las variables de entorno y rellénalas con lo que muestra `npx supabase status`
(`Publishable key` y `Secret key`):

```bash
cp .env.example .env.local
```

Carga el diccionario, que tarda unos segundos:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run dict:load
```

Lanza la app:

```bash
npm run dev
```

Abre <http://localhost:3000>. Para entrar, escribe tu email y luego el código de 6 dígitos
(o pulsa el enlace). Los correos de inicio de sesión llegan al
buzón de pruebas de Supabase: <http://127.0.0.1:54324> (Mailpit).

> **Login con Google en local (opcional):** crea credenciales OAuth en Google Cloud con la
> URI de redirección `http://127.0.0.1:54321/auth/v1/callback`, pon `enabled = true` en
> `[auth.external.google]` de `supabase/config.toml` y exporta
> `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` y `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`
> antes de `supabase start`.

### Tests

```bash
npm test
```

Ejecuta los tests unitarios: normalización y validación, el año UTC y la cuenta atrás,
la cookie anti-bots y la IP.

```bash
npm run test:db
```

Ejecuta los tests de base de datos contra un Postgres desechable con las migraciones reales:
unicidad, 30 envíos simultáneos, cambio de año, límites, RLS y feed.

`test:db` necesita los binarios de PostgreSQL (`initdb`, `pg_ctl`). También puedes lanzarlos
contra el Supabase local:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npx vitest run tests/db
```

Lo que cubren los tests de BD (`tests/db/claims.test.ts`):

- **Validación:** tildes, ñ (incluida la ñ escrita como n + virgulilla combinante), femeninos, plurales rechazados.
- **Unicidad por año:** el primero gana y los siguientes reciben #2, #3… Repetir no avanza el contador. 30 envíos **simultáneos** dan exactamente un ganador y las posiciones 1..30 sin huecos. Un `INSERT` directo con un segundo dueño lo rechaza la restricción UNIQUE.
- **Cambio de año:** `2030-12-31T23:59:59.999Z` cuenta para 2030 y `2031-01-01T00:00:00.000Z` reinicia la carrera. Medianoche en Madrid sigue siendo el año anterior en UTC. El historial conserva ambos años.
- **Anti-abuso y permisos:** límites por usuario e IP, ningún cliente puede llamar a `claim_word` ni escribir en `claims`, y el `@usuario` solo se puede cambiar una vez.

---

## Desplegar (Vercel + Supabase)

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Aplica las migraciones:

   ```bash
   npx supabase login
   ```

   ```bash
   npx supabase link --project-ref <tu-project-ref>
   ```

   ```bash
   npx supabase db push
   ```

3. Carga el diccionario. Usa la cadena de conexión de *Connect → Session pooler*:

   ```bash
   DATABASE_URL="postgresql://postgres.<ref>:<password>@<host>:5432/postgres" npm run dict:load
   ```

4. **Auth → URL Configuration:**
   - *Site URL* = `https://tu-dominio.com`
   - *Redirect URLs* = `https://tu-dominio.com/auth/callback`
5. **Auth → Email Templates → Magic Link:** pega el contenido de
   `supabase/templates/magic_link.html`. Así el correo incluye el **código de 6 dígitos**
   (`{{ .Token }}`) además del enlace, y se puede entrar escribiendo el código.
6. **Auth → Providers:** activa *Email* (enlace mágico) y *Google* (Client ID y Secret de
   Google Cloud, con la URI de redirección que indica Supabase).
7. Copia de *Project Settings → API Keys* la **Publishable key** y la **Secret key**.

### 2. Cloudflare Turnstile

En el panel de Cloudflare → Turnstile, crea un widget para tu dominio, en modo *Managed*.
Necesitarás la *Site key* y la *Secret key*.

### 3. Vercel

1. Importa el repositorio en [vercel.com](https://vercel.com). Detecta Next.js solo.
2. Añade las variables de entorno:

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
   | `SUPABASE_SECRET_KEY` | Secret key (**solo servidor**) |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Site key de Turnstile |
   | `TURNSTILE_SECRET_KEY` | Secret key de Turnstile |
   | `HUMAN_COOKIE_SECRET` | Cadena aleatoria larga (`openssl rand -base64 32`) |

3. Despliega.

---

## Leer y escribir mejor (dislexia)

Sección en **`/lectura`**, separada del juego desde la portada. Está pensada para niños y niñas de 6 a 12 años
con dislexia, sin cuentas ni datos personales.

- **Ajustes de lectura:** fondo (crema por defecto y otros tonos suaves), tipo de letra (Lexend, Atkinson
  Hyperlegible, OpenDyslexic, Verdana), tamaño, espaciado y velocidad de la voz. Se guardan en el dispositivo.
- **Actividades:** contar sílabas, sonidos iniciales, b·d·p·q, ortografía (h, b/v, g/j, ll/y…), dictado con voz,
  y listas de palabras por niveles (separadas en sílabas de colores).
- **Guía para familias:** tipos de dislexia (fonológica, superficial, mixta) y qué actividad ayuda en cada caso.
- No sustituye a un logopeda o psicopedagogo.

## Administración

Panel en **`/admin`**, solo visible para cuentas con permiso de admin. Desde ahí puedes:

- Ver métricas en vivo: reclamaciones por minuto, por hora y del día, usuarios nuevos y quién hace más intentos (posibles bots).
- **Bloquear y desbloquear** usuarios. Un usuario bloqueado no puede reclamar palabras.
- **Anular reclamaciones.** Los que llegaron después suben un puesto, y si era la #1, la #2 hereda la medalla.
- **Ocultar palabras ofensivas** del feed y del buscador.
- Revisar el **registro** de todas las acciones de admin.

Los permisos los comprueba Postgres en cada función de admin (`assert_admin()`), no solo la
interfaz. Nadie puede darse permisos de admin desde la app.

**Hacerte admin:** regístrate en la app, elige tu @usuario y ejecuta una sola vez en el
*SQL Editor* de Supabase:

```sql
select public.make_admin('tu_usuario');
```

Para quitar el permiso: `select public.make_admin('tu_usuario', false);`

## Estructura

```
supabase/
  migrations/      0001 diccionario · 0002 perfiles y reclamaciones · 0003 claim_word()
                   0004 feed en tiempo real · 0005 consultas (rankings, historial, stats) · 0006 ayudas de UI
                   0007 administración (admins, bloqueos, anular reclamaciones, palabras ocultas)
  data/dictionary.tsv
scripts/           build-dictionary.ts · load-dictionary.ts · test-db.sh
src/
  proxy.ts         refresca la sesión de Supabase (antes "middleware")
  app/
    page.tsx       Jugar: campo gigante, cuenta atrás, mini feed
    live/ rankings/ history/ stats/ u/[username]/ login/ onboarding/
    api/claim/     POST: sesión + anti-bots → claim_word()
    api/verify-human/  Turnstile → cookie firmada
    auth/callback/ auth/signout/
  components/      claim-box (letras animadas, pista en vivo, resultado), medal, countdown, feed-list…
  lib/
    words/         normalize.ts · validator.ts   ← módulo de validación aislado
    time/year.ts   año UTC, cuenta atrás, formatos
    supabase/      clientes de navegador, servidor y admin
tests/
  unit/            Vitest
  db/              Vitest + Postgres real (con una capa que simula auth/realtime de Supabase)
```

## Ajustes rápidos

- **Límites por minuto:** función `claim_limits()` (migración 0003).
- **Duración de la cookie anti-bots:** `HUMAN_TTL_SECONDS` en `src/lib/human.ts`.
- **Criterio del ranking:** `top_users()` / `top_countries()` (migración 0005). Ahora ordena por medallas y luego por palabras escritas.
