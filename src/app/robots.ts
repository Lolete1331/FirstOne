import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // Todos los buscadores y asistentes de IA (Googlebot, Bingbot, GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot…)
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/auth/", "/onboarding"] },
    sitemap: "https://firstone.es/sitemap.xml",
    host: "https://firstone.es",
  };
}
