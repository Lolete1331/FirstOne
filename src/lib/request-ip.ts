/** IP del cliente detrás de Vercel / proxies. Devuelve null si no es una IP válida. */
export function getClientIp(headers: Headers): string | null {
  const raw =
    headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for")?.split(",")[0];
  const ip = raw?.trim();
  if (!ip) return null;
  const v4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const v6 = /^[0-9a-f:]+$/i;
  return v4.test(ip) || (v6.test(ip) && ip.includes(":")) ? ip : null;
}
