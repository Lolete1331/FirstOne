/** Variables de entorno públicas (disponibles en el navegador). */
const PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * URL de Supabase.
 * - Navegador: NEXT_PUBLIC_SUPABASE_URL; si está vacía, el mismo origen de la página
 *   (útil cuando un proxy sirve la app y la API de Supabase bajo el mismo dominio).
 * - Servidor: SUPABASE_URL (dirección interna, opcional) o la pública.
 */
export const SUPABASE_URL =
  typeof window === "undefined"
    ? process.env.SUPABASE_URL || PUBLIC_SUPABASE_URL
    : PUBLIC_SUPABASE_URL || window.location.origin;

export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
/** Muestra "Continuar con Google" solo cuando el proveedor está activado en Supabase. */
export const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

/** Nombre fijo de la cookie de sesión: igual en navegador y servidor aunque usen URLs distintas. */
export const AUTH_COOKIE_NAME = "sb-firstone-auth-token";
