import type { MetadataRoute } from "next";
import { getAdminSupabase } from "@/lib/supabase/admin";

const BASE = "https://firstone.es";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: [string, MetadataRoute.Sitemap[number]["changeFrequency"], number][] = [
    ["", "weekly", 1],
    ["/jugar", "daily", 1],
    ["/que-es", "monthly", 0.9],
    ["/juegos", "daily", 0.9],
    ["/grupos", "monthly", 0.6],
    ["/palabra-oculta", "daily", 0.9],
    ["/juegos/que-significa", "daily", 0.8],
    ["/juegos/sopa-de-letras", "daily", 0.8],
    ["/juegos/sopa-de-letras/anteriores", "daily", 0.4],
    ["/juegos/existe", "daily", 0.7],
    ["/juegos/anagramas", "daily", 0.7],
    ["/juegos/refranes", "daily", 0.7],
    ["/juegos/intrusa", "daily", 0.7],
    ["/juegos/b-o-v", "daily", 0.7],
    ["/juegos/ahorcado", "daily", 0.7],
    ["/juegos/que-significa/anteriores", "daily", 0.4],
    ["/palabra-oculta/anteriores", "daily", 0.5],
    ["/lectura", "weekly", 0.9],
    ["/lectura/tipos", "monthly", 0.8],
    ["/lectura/listas", "monthly", 0.7],
    ["/lectura/silabas", "monthly", 0.7],
    ["/lectura/sonidos", "monthly", 0.7],
    ["/lectura/letras", "monthly", 0.7],
    ["/lectura/ortografia", "monthly", 0.7],
    ["/lectura/dictado", "monthly", 0.7],
    ["/live", "always", 0.7],
    ["/rankings", "hourly", 0.7],
    ["/history", "daily", 0.6],
    ["/stats", "hourly", 0.6],
    ["/privacidad", "yearly", 0.2],
    ["/aviso-legal", "yearly", 0.2],
    ["/cookies", "yearly", 0.2],
  ];
  const fixed: MetadataRoute.Sitemap = pages.map(([path, changeFrequency, priority]) => ({ url: `${BASE}${path}`, changeFrequency, priority }));
  // Una página por cada palabra que ya tiene dueño (las más recientes primero).
  let words: MetadataRoute.Sitemap = [];
  try {
    const db = getAdminSupabase();
    const [{ data }, { data: hidden }] = await Promise.all([
      db.from("claims").select("word, claimed_at").eq("position", 1).order("claimed_at", { ascending: false }).limit(5000),
      db.from("hidden_words").select("word"),
    ]);
    const skip = new Set((hidden ?? []).map((h) => h.word));
    words = (data ?? []).filter((r) => !skip.has(r.word)).map((r) => ({ url: `${BASE}/palabra/${encodeURIComponent(r.word)}`, lastModified: r.claimed_at, changeFrequency: "weekly", priority: 0.5 }));
  } catch {
    /* sin base de datos (desarrollo): solo las páginas fijas */
  }
  return [...fixed, ...words];
}
