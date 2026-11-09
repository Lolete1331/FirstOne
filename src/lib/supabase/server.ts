import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";

/** Cliente de Supabase ligado a las cookies de la petición (route handlers). */
export async function getServerSupabase() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: { name: AUTH_COOKIE_NAME },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Llamado desde un contexto de solo lectura: el proxy refresca la sesión.
        }
      },
    },
  });
}
