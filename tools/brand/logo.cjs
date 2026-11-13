const { chromium } = require("playwright");
const fs = require("fs");
const OUT = "/home/user/firstone/brand";
const CSS = "/_next/static/chunks/" + encodeURIComponent("[next]_internal_font_google_unbounded_89df19d5_module_css_1igg3k2-ikub5._.single.css").replace(/%2F/g, "/");

// ── Icono: squircle lima + "1" geométrico + corona de dueño ──
const icon = (id, s = 512) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9FF6E"/><stop offset="1" stop-color="#A6F000"/></linearGradient>
    <linearGradient id="${id}gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3C4"/><stop offset=".5" stop-color="#FFC83D"/><stop offset="1" stop-color="#E08A00"/></linearGradient>
  </defs>
  <rect x="24" y="24" width="464" height="464" rx="124" fill="url(#${id}bg)"/>
  <rect x="24" y="24" width="464" height="464" rx="124" fill="none" stroke="#07060B" stroke-opacity=".08" stroke-width="4"/>
  <!-- "1" -->
  <path d="M246 140 H346 V404 H258 V256 L182 294 L162 220 Z" fill="#07060B"/>
  <!-- corona -->
  <g transform="translate(316 44) rotate(18)">
    <path d="M0 74 L10 18 L42 50 L66 0 L90 50 L122 18 L132 74 Z" fill="url(#${id}gold)" stroke="#07060B" stroke-width="8" stroke-linejoin="round"/>
    <rect x="-2" y="74" width="136" height="22" rx="8" fill="url(#${id}gold)" stroke="#07060B" stroke-width="8"/>
  </g>
</svg>`;
fs.writeFileSync(`${OUT}/firstone-icono.svg`, icon("a").trim() + "\n");

const word = (dark) => `<span class="w" style="color:${dark ? "#F4F1FF" : "#07060B"}">First<span class="g${dark ? "" : " gl"}">One</span></span>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${CSS}">
<style>
  body{margin:0;background:transparent;font-family:Unbounded,system-ui,sans-serif}
  .art{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box}
  .w{font-weight:900;letter-spacing:-0.02em;line-height:1}
  .g{background:linear-gradient(92deg,#C6FF3D,#22E4FF 45%,#FF2E88);-webkit-background-clip:text;background-clip:text;color:transparent}
  .gl{background:linear-gradient(92deg,#5BB800,#0AA6C2 45%,#E0136B);-webkit-background-clip:text;background-clip:text}
  .tag{font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#9A93B5}
  #grid{display:flex;flex-direction:column;align-items:flex-start;gap:40px;padding:40px;width:max-content}
</style></head><body><div id="grid">
  <div id="h-dark" class="art" style="gap:44px;padding:40px 70px">${icon("b",260)}${word(true).replace('class="w"','class="w" style="font-size:150px;color:#F4F1FF"')}</div>
  <div id="h-light" class="art" style="gap:44px;padding:40px 70px">${icon("c",260)}${word(false).replace('class="w"','class="w" style="font-size:150px;color:#07060B"')}</div>
  <div id="stacked" class="art" style="flex-direction:column;gap:36px;padding:60px">${icon("d",360)}<span class="w" style="font-size:120px;color:#F4F1FF">First<span class="g">One</span></span></div>
  <div id="profile" class="art" style="width:1080px;height:1080px;background:radial-gradient(60% 60% at 50% 40%,#2A1F4A,#07060B 75%)">${icon("e",640)}</div>
  <div id="banner" class="art" style="width:2560px;height:1440px;flex-direction:column;gap:56px;background:radial-gradient(50% 60% at 15% 0%,rgba(139,92,246,.35),transparent 60%),radial-gradient(40% 50% at 100% 20%,rgba(255,46,136,.25),transparent 60%),#07060B">
    <div class="art" style="gap:50px">${icon("f",300)}<span class="w" style="font-size:190px;color:#F4F1FF">First<span class="g">One</span></span></div>
    <span class="tag" style="font-size:44px">Sé el primero en escribirla · firstone.es</span>
  </div>
</div></body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ deviceScaleFactor: 2 })).newPage();
  await p.route("http://localhost:3000/__logo", (r) => r.fulfill({ contentType: "text/html", body: html }));
  await p.goto("http://localhost:3000/__logo");
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(600);
  const ok = await p.evaluate(() => document.fonts.check('900 50px Unbounded'));
  console.log("fuente Unbounded cargada:", ok);
  const shot = async (sel, file, opts = {}) => { await p.locator(sel).screenshot({ path: `${OUT}/${file}`, omitBackground: true, ...opts }); console.log("✔", file); };
  await shot("#h-dark", "firstone-logo-horizontal-fondo-oscuro.png");
  await shot("#h-light", "firstone-logo-horizontal-fondo-claro.png");
  await shot("#stacked", "firstone-logo-vertical.png");
  // Iconos a tamaño exacto (dsf 1)
  const p1 = await (await b.newContext({ deviceScaleFactor: 1 })).newPage();
  await p1.route("http://localhost:3000/__logo", (r) => r.fulfill({ contentType: "text/html", body: html }));
  await p1.goto("http://localhost:3000/__logo"); await p1.evaluate(() => document.fonts.ready); await p1.waitForTimeout(400);
  await p1.setContent(`<body style="margin:0;background:transparent">${icon("z", 1024)}</body>`);
  await p1.locator("svg").screenshot({ path: `${OUT}/firstone-icono-1024.png`, omitBackground: true }); console.log("✔ firstone-icono-1024.png");
  await p1.goto("http://localhost:3000/__logo"); await p1.evaluate(() => document.fonts.ready); await p1.waitForTimeout(400);
  await p1.locator("#profile").screenshot({ path: `${OUT}/firstone-perfil-tiktok-youtube.png` }); console.log("✔ firstone-perfil-tiktok-youtube.png");
  await p1.locator("#banner").screenshot({ path: `${OUT}/firstone-banner-youtube.png` }); console.log("✔ firstone-banner-youtube.png");
  await b.close();
})().catch((e) => { console.error("FALLO", e.message); process.exit(1); });
