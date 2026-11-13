// Graba el vídeo vertical de TikTok con la app real (copia local) y textos superpuestos.
const { chromium } = require("playwright");
const fs = require("fs");
const OUT = __dirname + "/frames";
const BASE = "http://localhost:8080";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);

const OVERLAY_CSS = `
  nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }
  main section.text-center { visibility: hidden; }
  #tt-cap { position: fixed; left: 16px; right: 16px; top: 110px; z-index: 99999; text-align: center;
    font-family: var(--font-unbounded), system-ui, sans-serif; font-weight: 900; font-size: 25px; line-height: 1.25;
    color: #fff; pointer-events: none; transition: opacity .25s, transform .25s; }
  #tt-cap span { background: rgba(7,6,11,.88); box-decoration-break: clone; -webkit-box-decoration-break: clone;
    padding: 4px 10px; border-radius: 10px; box-shadow: 0 0 0 2px rgba(198,255,61,.0); }
  #tt-cap.hide { opacity: 0; transform: translateY(-10px); }
  #tt-cap.bottom { top: auto; bottom: 120px; }
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
async function typeWord(page, word, delay) {
  for (const ch of word) { mark("key"); await page.locator("#word").press(ch); await sleep(delay); }
}

async function caption(page, html, opts = {}) {
  if (html) mark("caption");
  await page.evaluate(({ html, bottom }) => {
    let el = document.getElementById("tt-cap");
    if (!el) { el = document.createElement("div"); el.id = "tt-cap"; document.body.appendChild(el); }
    el.className = "hide" + (bottom ? " bottom" : "");
    setTimeout(() => { el.innerHTML = html ? `<span>${html}</span>` : ""; el.className = (html ? "" : "hide") + (bottom ? " bottom" : ""); }, 150);
  }, { html, bottom: !!opts.bottom });
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 432, height: 768 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  });
  const page = await ctx.newPage();
  await page.addInitScript((css) => {
    document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s); });
  }, OVERLAY_CSS);

  // ── Login (no se graba) ──
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
  await page.goto(BASE + "/");
  await page.locator("#word").waitFor();
  await sleep(2500); // fuentes, feed y cuenta atrás cargados
  await page.locator("#word").blur();

  // ── Grabación por CDP screencast (frames reales a 1080x1920) ──
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    const i = frames.length;
    fs.writeFileSync(`${OUT}/f${String(i).padStart(5, "0")}.jpg`, Buffer.from(data, "base64"));
    frames.push(metadata.timestamp);
    await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
  // "Latido" para que haya frames aunque no cambie nada
  const tick = setInterval(() => page.evaluate(() => { document.body.dataset.t = Date.now(); const d = document.getElementById("tt-tick") || Object.assign(document.body.appendChild(document.createElement("div")), { id: "tt-tick" }); d.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:.01;background:#" + (Date.now() % 2 ? "000" : "111"); }).catch(() => {}), 33);

  // 0–3.5 s: gancho
  await caption(page, "Cada palabra del español solo puede tener <b style='color:#c6ff3d'>UN</b> dueño al año 👑");
  await sleep(3500);

  // 3.5–7.5 s: escribe "mariposa"
  await caption(page, "Voy a por <span style='color:#22e4ff'>“mariposa”</span>… ¿estará libre? 🤞");
  await page.locator("#word").focus();
  await typeWord(page, "mariposa", 190);
  await sleep(1300);

  // 7.5–12 s: ¡medalla!
  await caption(page, "");
  mark("tap1");
  await page.getByRole("button", { name: "¡Es mía!" }).tap();
  await page.getByText("¡Eres el primero!").waitFor();
  mark("win");
  await sleep(500);
  await caption(page, "¡¡SOY EL PRIMERO DEL MUNDO!! 🥇", { bottom: true });
  await sleep(3800);

  // 12–15.5 s: a por "amor"
  mark("close");
  await page.getByRole("button", { name: "Toca para seguir jugando" }).tap();
  await caption(page, "Ahora a por <span style='color:#ff2e88'>“amor”</span> ❤️");
  await page.locator("#word").focus();
  await typeWord(page, "amor", 200);
  await sleep(1000);

  // 15.5–20 s: llegué tarde
  await caption(page, "");
  mark("tap2");
  await page.getByRole("button", { name: "¡Es mía!" }).tap();
  await page.getByText("Llegaste tarde").waitFor();
  mark("late");
  await sleep(400);
  await caption(page, "Alguien me la quitó en el PRIMER segundo del año 💀", { bottom: true });
  await sleep(4000);

  // 20–24 s: cierre
  await caption(page, "");
  await page.evaluate(() => {
    const d = document.createElement("div"); d.id = "tt-end";
    d.innerHTML = `<div class="logo"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 512 512">   <defs>     <linearGradient id="ebg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9FF6E"/><stop offset="1" stop-color="#A6F000"/></linearGradient>     <linearGradient id="egold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3C4"/><stop offset=".5" stop-color="#FFC83D"/><stop offset="1" stop-color="#E08A00"/></linearGradient>   </defs>   <rect x="24" y="24" width="464" height="464" rx="124" fill="url(#ebg)"/>   <rect x="24" y="24" width="464" height="464" rx="124" fill="none" stroke="#07060B" stroke-opacity=".08" stroke-width="4"/>   <!-- "1" -->   <path d="M246 140 H346 V404 H258 V256 L182 294 L162 220 Z" fill="#07060B"/>   <!-- corona -->   <g transform="translate(316 44) rotate(18)">     <path d="M0 74 L10 18 L42 50 L66 0 L90 50 L122 18 L132 74 Z" fill="url(#egold)" stroke="#07060B" stroke-width="8" stroke-linejoin="round"/>     <rect x="-2" y="74" width="136" height="22" rx="8" fill="url(#egold)" stroke="#07060B" stroke-width="8"/>   </g> </svg> <span>First<span class="grad">One</span></span></div>
      <div class="big">95.000 palabras.<br>Un solo dueño cada una.</div>
      <div class="sub">El 1 de enero a las 00:00 todo se reinicia</div>
      <div class="big grad">¿Cuál será la tuya?</div>
      <div class="url" style="font-size:17px;padding:12px 18px;white-space:nowrap">first-one-kappa-five.vercel.app</div><div class="sub">Juega gratis · enlace en el perfil</div>`;
    document.body.appendChild(d); requestAnimationFrame(() => d.classList.add("show"));
  });
  mark("end");
  await sleep(4200);

  clearInterval(tick);
  await cdp.send("Page.stopScreencast");
  await sleep(300);
  fs.writeFileSync(`${OUT}/times.json`, JSON.stringify(frames));
  fs.writeFileSync(`${OUT}/events.json`, JSON.stringify(events.map(([n, t]) => [n, +(t - frames[0]).toFixed(3)])));
  console.log("frames:", frames.length, "duración:", (frames.at(-1) - frames[0]).toFixed(1), "s");
  await browser.close();
})().catch((e) => { console.error("FALLO", e.message); process.exit(1); });
