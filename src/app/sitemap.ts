import type { MetadataRoute } from "next";

const BASE = "https://firstone.es";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, MetadataRoute.Sitemap[number]["changeFrequency"], number][] = [
    ["", "daily", 1],
    ["/que-es", "monthly", 0.9],
    ["/live", "always", 0.7],
    ["/rankings", "hourly", 0.7],
    ["/history", "daily", 0.6],
    ["/stats", "hourly", 0.6],
  ];
  return pages.map(([path, changeFrequency, priority]) => ({ url: `${BASE}${path}`, changeFrequency, priority }));
}
