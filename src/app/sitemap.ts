import type { MetadataRoute } from "next";

const BASE = "https://firstone.es";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, MetadataRoute.Sitemap[number]["changeFrequency"], number][] = [
    ["", "weekly", 1],
    ["/jugar", "daily", 1],
    ["/que-es", "monthly", 0.9],
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
  return pages.map(([path, changeFrequency, priority]) => ({ url: `${BASE}${path}`, changeFrequency, priority }));
}
