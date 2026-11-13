// Sustituto mínimo de Kong para Supabase local (solo para pruebas en este contenedor).
const http = require("http");
const httpProxy = require("http-proxy");
const { execSync } = require("child_process");
const jwt = require("jsonwebtoken");

const SECRET = "super-secret-jwt-token-with-at-least-32-characters-long";
const exp = Math.floor(Date.now() / 1000) + 10 * 365 * 86400;
const ANON = jwt.sign({ iss: "supabase-demo", role: "anon", exp }, SECRET);
const SERVICE = jwt.sign({ iss: "supabase-demo", role: "service_role", exp }, SECRET);
const PUB = process.env.PUB_KEY, SEC = process.env.SEC_KEY;

const ipCache = {};
function ip(name) {
  if (!ipCache[name]) {
    try {
      ipCache[name] = execSync(`docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${name}`).toString().trim();
    } catch { return null; }
  }
  return ipCache[name];
}
const routes = [
  ["/auth/v1", "supabase_auth_firstone", 9999, ""],
  ["/rest-admin/v1", "supabase_rest_firstone", 3001, ""],
  ["/rest/v1", "supabase_rest_firstone", 3000, ""],
  ["/realtime/v1/api", "supabase_realtime_firstone", 4000, "/api"],
  ["/realtime/v1", "supabase_realtime_firstone", 4000, "/socket"],
];
const toJwt = (k) => (k === PUB ? ANON : k === SEC ? SERVICE : k);
function rewrite(req) {
  const u = new URL(req.url, "http://x");
  const r = routes.find(([p]) => u.pathname === p || u.pathname.startsWith(p + "/"));
  if (!r) return null;
  const host = ip(r[1]);
  if (!host) return null;
  const apikey = req.headers.apikey || u.searchParams.get("apikey");
  if (apikey) {
    const j = toJwt(apikey);
    if (u.searchParams.get("apikey")) u.searchParams.set("apikey", j);
    req.headers.apikey = j;
    const auth = req.headers.authorization;
    if (!auth || auth === `Bearer ${apikey}`) req.headers.authorization = `Bearer ${j}`;
  }
  req.url = r[3] + u.pathname.slice(r[0].length) + u.search.replace(/apikey=[^&]*/, (m) => `apikey=${encodeURIComponent(u.searchParams.get("apikey") ?? "")}`);
  req.url = r[3] + u.pathname.slice(r[0].length) + (u.searchParams.toString() ? "?" + u.searchParams : "");
  if (r[1].includes("realtime")) req.headers.host = "realtime-dev.supabase_realtime_firstone:4000";
  return `http://${host}:${r[2]}`;
}
const proxy = httpProxy.createProxyServer({ ws: true, xfwd: true });
proxy.on("error", (e, req, res) => { Object.keys(ipCache).forEach((k) => delete ipCache[k]); try { res.writeHead?.(502); res.end?.("bad gateway"); } catch {} });
const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "access-control-allow-origin": req.headers.origin || "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-allow-credentials": "true" });
    return res.end();
  }
  const target = rewrite(req);
  if (!target) { res.writeHead(404); return res.end("no route"); }
  proxy.web(req, res, { target });
});
proxy.on("proxyRes", (pr, req) => { pr.headers["access-control-allow-origin"] = req.headers.origin || "*"; pr.headers["access-control-allow-credentials"] = "true"; });
server.on("upgrade", (req, socket, head) => { const t = rewrite(req); if (!t) return socket.destroy(); proxy.ws(req, socket, head, { target: t }); });
server.listen(54321, "0.0.0.0", () => console.log("gateway on :54321"));
process.on("uncaughtException", (e) => console.error("ignored:", e.code || e.message));
server.on("upgrade", (req, socket) => socket.on("error", () => {}));
proxy.on("proxyReqWs", (pr, req, socket) => socket.on("error", () => {}));

// Puerto único para la vista previa: app (Next) + API de Supabase bajo el mismo origen.
const APP_PORT = 8080;
const front = http.createServer((req, res) => {
  const target = rewrite(req);
  if (target) return proxy.web(req, res, { target });
  proxy.web(req, res, { target: "http://127.0.0.1:3000" });
});
front.on("upgrade", (req, socket, head) => {
  socket.on("error", () => {});
  const t = rewrite(req);
  proxy.ws(req, socket, head, { target: t || "http://127.0.0.1:3000" });
});
front.listen(APP_PORT, "0.0.0.0", () => console.log("front on :" + APP_PORT));
