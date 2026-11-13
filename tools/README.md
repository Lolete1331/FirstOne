# Herramientas de apoyo (no forman parte de la web)

Scripts usados para probar en local, publicar cambios en la base de datos y crear vídeos/imágenes.
Suponen que el repositorio está en `/home/user/firstone` y que la copia local de Supabase está arrancada.

| Carpeta | Script | Para qué |
|---|---|---|
| `dev/` | `kong-sustituto.cjs` | Sustituye a Kong (la pasarela de Supabase local, cuya imagen no se descarga en el sandbox). Escucha en `:54321` (API) y en `:8080` (app + API en el mismo origen, para la vista previa). Arrancar con `PUB_KEY=… SEC_KEY=… node tools/dev/kong-sustituto.cjs`, usando las claves `PUBLISHABLE_KEY` y `SECRET_KEY` que muestra `npx supabase status -o env` (son claves de la copia local, no de producción). |
| `dev/` | `datos-demo.sql` | Jugadores y palabras de demo para la copia local (`psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f …`). **Borra los datos locales.** Nunca en producción. |
| `deploy/` | `migraciones-produccion.py` | Aplica las migraciones pendientes de `supabase/migrations` a producción vía la Management API (usa el token del entorno). |
| `video/` | `anuncio-grabar.cjs` + `anuncio-musica.py` | Vídeo corto (22 s) de la medalla y el «#4729». |
| `video/` | `tutorial-grabar.cjs` + `tutorial-musica.py` + `subtitulos.py` | Vídeo tutorial completo (juego, significado, diploma y dislexia). Graba sin textos, compone música original sincronizada y genera subtítulos ASS (Inter, franja negra) que se queman con ffmpeg (`subtitles=subs.ass`). |
| `brand/` | `logo.cjs`, `imagen-compartir.cjs` | Generan el kit de marca (`brand/`) y la imagen Open Graph (`src/app/opengraph-image.png`). |

Flujo del vídeo tutorial (desde una carpeta del scratchpad, con la app local en :8080):
1. Restablecer datos de demo (ver el bloque SQL al principio de cada grabación en el historial de cambios) y `node tutorial-grabar.cjs` → `frames/` (+ `events.json`, `captions.json`).
2. `python3 -I tutorial-musica.py` → `tour2-soundtrack.wav`.
3. `python3 -I subtitulos.py` → `subs.ass`.
4. ffmpeg: concat de fotogramas con sus tiempos + zoompan/drawbox en los eventos + `subtitles=subs.ass` + audio → MP4 1080×1920.
