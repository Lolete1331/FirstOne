// Vídeo-tutorial de FirstOne: recorre todas las pantallas con textos explicativos.
const { chromium } = require("playwright");
const { execSync } = require("child_process");
const fs = require("fs");
const OUT = __dirname + "/frames";
const BASE = "http://localhost:8080";
const DB = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const EMOJI_WORD = {"🏠": "casa", "🪑": "mesa", "🌙": "luna", "🦆": "pato", "🐱": "gato", "✋": "mano", "👄": "boca", "🍲": "sopa", "🌹": "rosa", "☕": "taza", "🍍": "piña", "🦜": "loro", "🐸": "rana", "🐒": "mono", "🐄": "vaca", "🦭": "foca", "🏍️": "moto", "🛏️": "cama", "🍄": "seta", "🐶": "perro", "🧒": "niño", "🚿": "ducha", "🛁": "baño", "🕯️": "vela", "☝️": "dedo"};
const RIGHTS = new Set(["huevo", "hormiga", "helado", "hoja", "jirafa", "girasol", "llave", "lluvia", "yogur", "vela", "nube", "uva", "ballena", "caballo", "volcán", "bicicleta", "zapato", "cebolla", "queso", "guitarra", "pingüino", "cereza", "zanahoria", "almohada"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);
const OVERLAY_CSS = `
  nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }
  main section.text-center { visibility: hidden; }
  #tt-cap { position: fixed; left: 14px; right: 14px; top: 104px; z-index: 99999; text-align: center;
    font-family: var(--font-grotesk), system-ui, sans-serif; font-weight: 700; font-size: 28px; line-height: 1.28;
    letter-spacing: 0.005em; color: #fff; pointer-events: none; transition: opacity .25s, transform .25s; }
  #tt-cap > span { display: inline-block; max-width: 100%; background: #0b0a12; padding: 12px 18px 13px; border-radius: 18px;
    border: 3px solid #c6ff3d; box-shadow: 0 8px 28px rgba(0,0,0,.55); }
  #tt-cap b { color: #fff; font-weight: 800; }
  #tt-cap.hide { opacity: 0; transform: translateY(-10px); }
  #tt-cap.bottom { top: auto; bottom: 88px; }
  #tt-cap small { display:block; font-size:17px; font-weight:800; letter-spacing:.14em; color:#c6ff3d; margin-bottom:6px; }
  #tt-end { position: fixed; inset: 0; z-index: 100000; background: #07060b; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 22px; text-align: center; padding: 24px; opacity: 0; transition: opacity .5s;
    font-family: var(--font-unbounded), system-ui, sans-serif; color: #f4f1ff; }
  #tt-end.show { opacity: 1; }
  #tt-end .logo { display:flex; align-items:center; gap:12px; font-weight:900; font-size:42px; }
  #tt-end .one { display:grid; place-items:center; width:58px; height:58px; border-radius:16px; background:#c6ff3d; color:#07060b; font-size:30px; }
  #tt-end .grad { background: linear-gradient(92deg,#c6ff3d,#22e4ff 45%,#ff2e88); -webkit-background-clip:text; background-clip:text; color:transparent; }
  #tt-end .big { font-weight:900; font-size:30px; line-height:1.2; }
  #tt-end .sub { font-family: var(--font-grotesk), sans-serif; color:#9a93b5; font-size:18px; }
  #tt-end .url { font-weight:900; font-size:34px; color:#07060b; background:#c6ff3d; padding:10px 22px; border-radius:999px; box-shadow:0 0 40px rgba(198,255,61,.5); }
`;
const events = [];
const mark = (name) => events.push([name, Date.now() / 1000]);
const captions = [];
/** Solo apunta el texto y el momento: los subtítulos se añaden después con ffmpeg (nítidos). */
async function caption(page, html, pos = "top") {
  if (html) mark("caption");
  captions.push([html, pos, Date.now() / 1000]);
}
const step = (n, title, text) => `<small>${n}</small>${title}${text ? "<br>" + text : ""}`;
async function typeWord(page, sel, word, delay = 150) { for (const ch of word) { mark("key"); await page.locator(sel).pressSequentially(ch); await sleep(delay); } }
async function tap(page, locator) { mark("tap"); await locator.tap(); }
async function nav(page, label) { mark("nav"); await page.locator("nav.md\\:hidden").getByRole("link", { name: label }).tap(); await sleep(900); }
const scrollTo = (page, y) => page.evaluate((y) => window.scrollTo({ top: y, behavior: "smooth" }), y);
function liveClaim(user, word) {
  try { execSync(`psql ${DB} -qAtc "select public._claim_word_at((select id from profiles where username='${user}'), '${word}', null, now())"`); } catch {}
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 432, height: 768 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" });
  const page = await ctx.newPage();
  await page.addInitScript((css) => { document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); }); }, OVERLAY_CSS);

  // Login (no se graba)
  const email = `demo${Date.now()}@demo.dev`;
  await page.goto(BASE + "/login");
  await page.fill('input[type="email"]', email);
  await page.getByRole("button", { name: /código/ }).click();
  await page.getByLabel("Código del correo").waitFor();
  let code;
  for (let i = 0; i < 30 && !code; i++) {
    const l = await (await fetch("http://127.0.0.1:54324/api/v1/messages")).json();
    const m = l.messages.find((x) => x.To[0].Address === email);
    if (m) { const f = await (await fetch(`http://127.0.0.1:54324/api/v1/message/${m.ID}`)).json(); code = f.Text.match(/\b(\d{6,8})\b/)?.[1]; }
    await sleep(400);
  }
  await page.getByLabel("Código del correo").fill(code);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/onboarding/);
  await page.fill("#username", "palabrista");
  await page.getByText("✓ libre").waitFor();
  await page.selectOption("#country", "ES");
  await page.getByRole("button", { name: "¡A jugar!" }).click();
  await page.waitForURL((u) => !u.pathname.includes("onboarding"));
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.goto(BASE + "/"); await page.getByRole("heading", { name: /Qué te apetece hoy/ }).waitFor(); await sleep(2500);

  // Grabación
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    fs.writeFileSync(`${OUT}/f${String(frames.length).padStart(5, "0")}.jpg`, Buffer.from(data, "base64"));
    frames.push(metadata.timestamp);
    await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
  const tick = setInterval(() => page.evaluate(() => { const d = document.getElementById("tt-tick") || Object.assign(document.body.appendChild(document.createElement("div")), { id: "tt-tick" }); d.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01;background:#" + (Date.now() % 2 ? "000" : "111"); }).catch(() => {}), 33);

  // ══ INTRO: portada con dos opciones ══
  await caption(page, "<span style='color:#c6ff3d'>FirstOne</span> ahora tiene<br><b>DOS partes</b> 👇", "bottom");
  await sleep(3000);
  await caption(page, "🥇 Un juego para adueñarte de palabras…<br>📚 …y una zona para niños con <b>dislexia</b>", "bottom");
  await sleep(3400);

  // ══ PARTE 1 · EL JUEGO ══
  await caption(page, "");
  mark("nav"); await page.getByRole("link", { name: /Adueñarte de palabras/ }).tap();
  await page.locator("#word").waitFor(); await sleep(700); await page.locator("#word").blur();
  await caption(page, step("PARTE 1 · EL JUEGO", "Escribe una palabra…", "¿está <span style='color:#c6ff3d'>LIBRE</span>? ✦"));
  await page.locator("#word").focus();
  await typeWord(page, "#word", "girasol", 150);
  await sleep(1000);
  await caption(page, "");
  await tap(page, page.getByRole("button", { name: "¡Es mía!" }));
  await page.getByText("¡Eres el primero!").waitFor(); mark("win");
  await sleep(400);
  await caption(page, "Si eres el <span style='color:#ffc83d'>PRIMERO del mundo</span>,<br>es tuya todo el año 🥇", "bottom");
  await sleep(2800);
  await caption(page, "<span style='color:#22e4ff'>NUEVO</span> 📖 Mira qué significa<br>cada palabra", "bottom");
  await sleep(900);
  await tap(page, page.getByRole("dialog").getByRole("button", { name: "Ver el significado de girasol" }));
  await page.getByRole("dialog", { name: "Significado de girasol" }).getByText("asteráceas", { exact: false }).waitFor();
  await sleep(2800);
  await caption(page, "");
  await tap(page, page.getByRole("dialog", { name: "Significado de girasol" }).getByRole("button", { name: "Cerrar" }));
  await sleep(400);

  // NUEVO · Diploma
  await caption(page, "<span style='color:#ffc83d'>NUEVO</span> 🖨️ Si eres el primero…<br>¡imprime tu <b>diploma</b>!", "bottom");
  await sleep(1600);
  await caption(page, "");
  mark("nav"); await page.getByRole("dialog").getByRole("link", { name: /Diploma/ }).tap();
  await page.getByLabel("Diploma de la palabra girasol").waitFor(); await sleep(900); mark("ok");
  await caption(page, "Con tu nombre, la palabra,<br>su significado y la hora exacta 📜", "bottom");
  await page.locator('input[placeholder^="opcional"]').tap();
  await typeWord(page, 'input[placeholder^="opcional"]', "Lucía García", 110);
  await page.locator('input[placeholder^="opcional"]').blur();
  await sleep(2400);
  await caption(page, "Imprímelo o guárdalo en <b>PDF</b>…<br>¡o regálaselo a alguien! 🎁", "bottom");
  await sleep(2800);
  await caption(page, "");
  mark("nav"); await page.getByRole("link", { name: "← Volver" }).tap();
  await page.locator("#word").waitFor(); await sleep(600);
  const seguir = page.getByRole("button", { name: "Toca para seguir jugando" });
  if (await seguir.isVisible().catch(() => false)) { await tap(page, seguir); await sleep(400); }

  await page.locator("#word").focus();
  await typeWord(page, "#word", "luna", 150);
  await page.locator("text=👑 de >> visible=true").first().waitFor();
  await caption(page, "¿Ya tiene dueño? Te dice <b>de quién es</b><br>y <b>cuántos</b> la han escrito 👑");
  await sleep(2400);
  await caption(page, "");
  await tap(page, page.getByRole("button", { name: "¡Es mía!" }));
  await page.getByText("Llegaste tarde").waitFor(); mark("joined");
  await sleep(300);
  await caption(page, "Si llegas tarde, te quedas con <b>tu número</b>:<br>¡eres el <span style='color:#22e4ff'>#619</span>! 🔢", "bottom");
  await sleep(3000);
  await caption(page, "");
  await tap(page, page.getByRole("button", { name: "Toca para seguir jugando" }));
  await sleep(300); await page.locator("#word").blur();

  await nav(page, "En vivo");
  await caption(page, step("EN VIVO", "Las palabras de todo el mundo,", "al instante ⚡"), "bottom");
  await sleep(900); mark("live"); liveClaim("ElRayoMX", "volcán");
  await sleep(1200); mark("live"); liveClaim("andina", "cometa");
  await sleep(1500);
  await caption(page, "");
  await nav(page, "Ranking");
  await caption(page, step("RANKING", "Medallas por jugador", "y por país 🏆🌍"), "bottom");
  await sleep(2600);
  await caption(page, "");
  await nav(page, "Historial");
  await page.getByPlaceholder("Busca una palabra…").tap();
  await typeWord(page, 'input[placeholder="Busca una palabra…"]', "sol", 130);
  await tap(page, page.getByRole("button", { name: "Ver", exact: true }));
  await page.getByText(/Ver los \d+ que la escribieron/).first().waitFor();
  await page.locator('input[placeholder="Busca una palabra…"]').blur();
  await caption(page, step("HISTORIAL", "El dueño de cada palabra cada año…", "¡y todos los que llegaron después! 📜"), "bottom");
  await sleep(3000);
  await caption(page, "");
  await nav(page, "Estadísticas");
  await caption(page, step("ESTADÍSTICAS", "% del diccionario conquistado", "y la palabra más rápida ⚡"), "bottom");
  await sleep(2600);

  // ══ PARTE 2 · LECTURA (DISLEXIA) ══
  await caption(page, "");
  mark("nav"); await page.locator("header a[href='/']").first().tap();
  await page.getByRole("heading", { name: /Qué te apetece hoy/ }).waitFor(); await sleep(500);
  await caption(page, step("PARTE 2 · NUEVO", "Leer y escribir mejor 📚", "para niños y niñas con dislexia"), "bottom");
  await sleep(2600);
  await caption(page, "");
  mark("nav"); await page.getByRole("link", { name: /Leer y escribir mejor/ }).tap();
  await page.getByRole("heading", { name: /¡Hola!/ }).waitFor(); await sleep(500);
  await caption(page, "Actividades para practicar<br><b>con calma</b>: sin prisas ni cronómetro 🐢", "bottom");
  await sleep(3000);

  // Ajustes de lectura
  await caption(page, "");
  await tap(page, page.getByRole("button", { name: /Ajustes/ }));
  await page.getByRole("dialog", { name: "Ajustes de lectura" }).waitFor();
  await caption(page, step("🎨 AJUSTES", "Cada niño elige fondo,", "letra y tamaño"), "top");
  await sleep(2000);
  const dlg = page.getByRole("dialog", { name: "Ajustes de lectura" });
  await tap(page, dlg.getByRole("button", { name: "Azul suave" })); await sleep(900);
  await tap(page, dlg.getByRole("button", { name: "Amarillo suave" })); await sleep(900);
  await tap(page, dlg.getByRole("button", { name: "OpenDyslexic" })); await sleep(1100);
  await caption(page, "Más <b>espacio</b> entre letras:<br>no se salta ninguna 🔤", "top");
  await page.evaluate(() => document.querySelector('[aria-label="Ajustes de lectura"] > div')?.scrollTo({ top: 520, behavior: "smooth" }));
  await sleep(700);
  await tap(page, dlg.getByRole("button", { name: "Muy amplio" })); await sleep(2000);
  await caption(page, "Recomendado:<br><b>fondo crema</b> y letra grande ✔️", "top");
  await tap(page, dlg.getByRole("button", { name: "Volver a los ajustes recomendados" })); await sleep(2200);
  await caption(page, "");
  await tap(page, dlg.getByRole("button", { name: "Listo" }));
  await sleep(500);

  // Sílabas
  mark("nav"); await page.getByRole("link", { name: /Cuenta las sílabas/ }).tap();
  await page.getByRole("button", { name: /Nivel 1/ }).waitFor();
  await caption(page, step("👏 SÍLABAS · FONOLÓGICA", "Escucha y cuenta las sílabas", ""), "top");
  await sleep(1500);
  await tap(page, page.getByRole("button", { name: /Nivel 1/ }));
  await sleep(1400);
  await tap(page, page.getByRole("button", { name: "2 sílabas", exact: true })); mark("ok");
  await sleep(2800);

  // Letras b d p q
  await caption(page, "");
  mark("nav"); await page.locator("header a[href='/lectura']").tap(); await page.getByRole("heading", { name: /¡Hola!/ }).waitFor();
  mark("nav"); await page.getByRole("link", { name: /b · d · p · q/ }).tap();
  await page.getByRole("button", { name: "b y d" }).waitFor();
  await tap(page, page.getByRole("button", { name: "b y d" }));
  await caption(page, step("🔍 b·d·p·q · SUPERFICIAL", "Encuentra las letras iguales", ""), "top");
  await sleep(1200);
  { const target = (await page.locator(".lx-card span.font-bold").first().innerText()).trim();
    const cells = page.locator(".lx-choice"); const cnt = await cells.count();
    for (let k = 0; k < cnt; k++) { if ((await cells.nth(k).innerText()).trim() === target) { await tap(page, cells.nth(k)); await sleep(450); } }
    mark("ok"); }
  await sleep(2000);

  // Ortografía
  await caption(page, "");
  mark("nav"); await page.locator("header a[href='/lectura']").tap(); await page.getByRole("heading", { name: /¡Hola!/ }).waitFor();
  mark("nav"); await page.getByRole("link", { name: /Cómo se escribe/ }).tap();
  await tap(page, page.getByRole("button", { name: "Empezar" }));
  await caption(page, step("✍️ ORTOGRAFÍA", "¿Con h o sin h? ¿b o v? 💡", ""), "top");
  await sleep(1600);
  { const opts = page.locator(".lx-choice"); const n = await opts.count();
    for (let k = 0; k < n; k++) { if (RIGHTS.has((await opts.nth(k).innerText()).trim())) { await tap(page, opts.nth(k)); break; } }
    mark("ok"); }
  await sleep(3000);

  // Dictado
  await caption(page, "");
  mark("nav"); await page.locator("header a[href='/lectura']").tap(); await page.getByRole("heading", { name: /¡Hola!/ }).waitFor();
  mark("nav"); await page.getByRole("link", { name: /Escribe lo que oyes/ }).tap();
  await tap(page, page.getByRole("button", { name: /Nivel 1/ }));
  await caption(page, step("🎧 DICTADO", "Lo bien escrito sale en <span style='color:#7cd992'>verde</span> ✅", ""), "top");
  await sleep(1000);
  { const emoji = (await page.locator(".lx-card .text-\\[3\\.2em\\]").first().innerText()).trim();
    const word = EMOJI_WORD[emoji] || "casa";
    const wrong = word.slice(0, -2) + "xa";
    await page.locator("#dictado").tap(); await typeWord(page, "#dictado", wrong, 140);
    await tap(page, page.getByRole("button", { name: "Comprobar" })); await sleep(2400);
    await page.locator("#dictado").fill(""); await typeWord(page, "#dictado", word, 140);
    await tap(page, page.getByRole("button", { name: "Comprobar" })); mark("ok"); }
  await sleep(2600);

  // Listas
  await caption(page, "");
  mark("nav"); await page.locator("header a[href='/lectura']").tap(); await page.getByRole("heading", { name: /¡Hola!/ }).waitFor();
  mark("nav"); await page.getByRole("link", { name: /Leer y escuchar/ }).tap();
  await tap(page, page.getByRole("tab", { name: /Nivel 3/ }));
  await tap(page, page.getByRole("button", { name: "Una a una" }));
  await caption(page, step("📖 LISTAS POR NIVELES", "<span style='color:#8cc8f0'>sí</span><span style='color:#f2a27a'>la</span><span style='color:#8cc8f0'>bas</span> de colores 🌈", ""), "top");
  await sleep(2200);
  await tap(page, page.getByRole("button", { name: /La he leído/ })); mark("ok");
  await sleep(2200);

  // Guía para familias
  await caption(page, "");
  mark("nav"); await page.locator("header a[href='/lectura']").tap(); await page.getByRole("heading", { name: /¡Hola!/ }).waitFor();
  mark("nav"); await page.getByRole("link", { name: /Para familias y docentes/ }).tap();
  await page.getByRole("heading", { name: /Dislexia fonológica/ }).waitFor();
  await caption(page, step("👨‍👩‍👧 FAMILIAS", "Qué es la dislexia, sus tipos", "y qué actividad ayuda en cada caso"), "bottom");
  await sleep(1500);
  await page.evaluate(() => { const el = document.getElementById("fonologica"); el && window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" }); });
  await sleep(2600);
  await caption(page, "🔒 Sin cuentas ni datos de los niños<br>No sustituye a un profesional 💛", "bottom");
  await page.evaluate(() => { const el = document.getElementById("superficial"); el && window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" }); });
  await sleep(3200);

  // Cierre
  await caption(page, "");
  await page.evaluate(() => {
    const d = document.createElement("div"); d.id = "tt-end";
    d.innerHTML = `<div class="logo"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 512 512">   <defs>     <linearGradient id="ebg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9FF6E"/><stop offset="1" stop-color="#A6F000"/></linearGradient>     <linearGradient id="egold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3C4"/><stop offset=".5" stop-color="#FFC83D"/><stop offset="1" stop-color="#E08A00"/></linearGradient>   </defs>   <rect x="24" y="24" width="464" height="464" rx="124" fill="url(#ebg)"/>   <rect x="24" y="24" width="464" height="464" rx="124" fill="none" stroke="#07060B" stroke-opacity=".08" stroke-width="4"/>   <!-- "1" -->   <path d="M246 140 H346 V404 H258 V256 L182 294 L162 220 Z" fill="#07060B"/>   <!-- corona -->   <g transform="translate(316 44) rotate(18)">     <path d="M0 74 L10 18 L42 50 L66 0 L90 50 L122 18 L132 74 Z" fill="url(#egold)" stroke="#07060B" stroke-width="8" stroke-linejoin="round"/>     <rect x="-2" y="74" width="136" height="22" rx="8" fill="url(#egold)" stroke="#07060B" stroke-width="8"/>   </g> </svg> <span>First<span class="grad">One</span></span></div>
      <div class="big">Juega y aprende<br>con las palabras</div>
      
      <div class="big grad">¿Cuál será tu palabra?</div>
      <div class="url">firstone.es</div><div class="sub">Juega gratis · TikTok @firstone.es</div>`;
    document.body.appendChild(d); requestAnimationFrame(() => d.classList.add("show"));
  });
  mark("end");
  await sleep(4200);

  clearInterval(tick);
  await cdp.send("Page.stopScreencast"); await sleep(300);
  fs.writeFileSync(`${OUT}/times.json`, JSON.stringify(frames));
  fs.writeFileSync(`${OUT}/events.json`, JSON.stringify(events.map(([n, t]) => [n, +(t - frames[0]).toFixed(3)])));
  fs.writeFileSync(`${OUT}/captions.json`, JSON.stringify(captions.map(([h, p, t]) => [h, p, +(t - frames[0]).toFixed(3)])));
  console.log("frames:", frames.length, "duración:", (frames.at(-1) - frames[0]).toFixed(1), "s");
  await browser.close();
})().catch((e) => { console.error("FALLO", e.message); process.exit(1); });
