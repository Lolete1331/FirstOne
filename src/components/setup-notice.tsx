import { isSupabaseConfigured } from "@/lib/env";

/** Aviso para desarrolladores si faltan las variables de entorno. */
export function SetupNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="mb-6 rounded-2xl border border-pink/40 bg-pink/10 p-4 text-sm">
      <b>Falta configurar Supabase.</b> Copia <code>.env.example</code> a <code>.env.local</code> y rellena las claves
      (ver README).
    </div>
  );
}
