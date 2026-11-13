const { chromium } = require("playwright");
const fs = require("fs");
const CSS = "/_next/static/chunks/" + encodeURIComponent("[next]_internal_font_google_unbounded_89df19d5_module_css_1igg3k2-ikub5._.single.css");
const icon = fs.readFileSync("/home/user/firstone/brand/firstone-icono.svg", "utf8").replace('width="512" height="512"', 'width="230" height="230"');
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${CSS}"><style>
body{margin:0;font-family:Unbounded,system-ui,sans-serif}
#og{width:1200px;height:630px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;padding:0 90px;gap:34px;color:#F4F1FF;
 background:radial-gradient(55% 70% at 0% 0%,rgba(139,92,246,.45),transparent 60%),radial-gradient(45% 60% at 100% 100%,rgba(255,46,136,.32),transparent 60%),radial-gradient(40% 50% at 100% 0%,rgba(34,228,255,.18),transparent 60%),#07060B}
.row{display:flex;align-items:center;gap:40px}.w{font-weight:900;font-size:118px;letter-spacing:-.02em;line-height:1}
.g{background:linear-gradient(92deg,#C6FF3D,#22E4FF 45%,#FF2E88);-webkit-background-clip:text;background-clip:text;color:transparent}
.t{font-weight:900;font-size:42px;line-height:1.2}.s{font-family:system-ui,sans-serif;font-size:28px;color:#B5AECD}
.u{display:inline-block;margin-top:6px;font-weight:900;font-size:30px;color:#07060B;background:#C6FF3D;padding:10px 22px;border-radius:999px}
</style></head><body><div id="og"><div class="row">${icon}<span class="w">First<span class="g">One</span></span></div>
<div class="t">Cada palabra del español tiene un solo dueño al año.<br>¿Cuál será la tuya? 🥇</div>
<div><span class="u">firstone.es</span></div></div></body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ deviceScaleFactor: 1 })).newPage();
  await p.route("http://localhost:3000/__og", (r) => r.fulfill({ contentType: "text/html", body: html }));
  await p.goto("http://localhost:3000/__og"); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  console.log("fuente:", await p.evaluate(() => document.fonts.check("900 40px Unbounded")));
  await p.locator("#og").screenshot({ path: "/home/user/firstone/src/app/opengraph-image.png" });
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
