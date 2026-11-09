"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth-provider";
import { countryFlag, countryOptions } from "@/lib/countries";
import { useHydrated } from "@/lib/hooks/use-hydrated";

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export function OnboardingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, profile, loading, refreshProfile } = useAuth();
  const editing = !!profile;
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [check, setCheck] = useState<{ name: string; available: boolean } | null>(null);
  const [syncedId, setSyncedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Los nombres de países salen de Intl y difieren entre Node y el navegador:
  // la lista se genera solo en el cliente para evitar desajustes de hidratación.
  const hydrated = useHydrated();
  const options = useMemo(() => (hydrated ? countryOptions() : { featured: [], rest: [] }), [hydrated]);
  const locked = editing && profile.username_changes >= 1;

  // Rellena el formulario con el perfil existente (patrón "ajustar estado al cambiar props").
  if (profile && syncedId !== profile.id) {
    setSyncedId(profile.id);
    setUsername(profile.username);
    setCountry(profile.country ?? "");
  }

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/onboarding");
  }, [loading, user, router]);

  const unchanged = username.toLowerCase() === profile?.username.toLowerCase();
  useEffect(() => {
    if (!USERNAME_RE.test(username) || unchanged) return;
    const t = setTimeout(async () => {
      const { data } = await getSupabase().rpc("username_available", { p_username: username });
      setCheck({ name: username, available: data === true });
    }, 300);
    return () => clearTimeout(t);
  }, [username, unchanged]);
  const available = !unchanged && check?.name === username ? check.available : null;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    const row = { username, country: country || null };
    const { error } = editing
      ? await getSupabase().from("profiles").update(row).eq("id", user.id)
      : await getSupabase().from("profiles").insert({ id: user.id, ...row });
    setSaving(false);
    if (error) {
      setError(
        error.message.includes("username_locked")
          ? "Ya cambiaste tu @usuario una vez."
          : error.code === "23505"
            ? "Ese @usuario ya está cogido."
            : "No se ha podido guardar. Revisa los datos.",
      );
      return;
    }
    await refreshProfile();
    router.push(params.get("next") ?? `/u/${username}`);
  }

  const valid = USERNAME_RE.test(username);

  return (
    <form onSubmit={save} className="mt-8 space-y-5">
      <div>
        <label htmlFor="username" className="text-sm text-muted">
          @usuario
        </label>
        <div className="mt-1 flex items-center rounded-2xl bg-surface-2 border border-line focus-within:border-lime/70 transition-colors">
          <span className="pl-4 text-muted font-display">@</span>
          <input
            id="username"
            value={username}
            disabled={locked}
            onChange={(e) => setUsername(e.target.value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 20))}
            placeholder="tu_nombre"
            autoComplete="off"
            autoCapitalize="none"
            className="flex-1 bg-transparent px-2 py-3.5 outline-none font-display disabled:opacity-60"
          />
          <span className="pr-4 text-sm">
            {available === true && <span className="text-lime">✓ libre</span>}
            {available === false && <span className="text-danger">✗ cogido</span>}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          {locked ? "Ya usaste tu único cambio de @usuario." : "3-20 caracteres: letras, números y _"}
        </p>
      </div>
      <div>
        <label htmlFor="country" className="text-sm text-muted">
          País (opcional, para el ranking por países)
        </label>
        <select
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="mt-1 w-full rounded-2xl bg-surface-2 border border-line px-4 py-3.5 outline-none focus:border-lime/70"
        >
          <option value="">🌐 Prefiero no decirlo</option>
          <optgroup label="Hispanohablantes">
            {options.featured.map((c) => (
              <option key={c.code} value={c.code}>
                {countryFlag(c.code)} {c.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Resto del mundo">
            {options.rest.map((c) => (
              <option key={c.code} value={c.code}>
                {countryFlag(c.code)} {c.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      {error && <p className="text-danger text-sm">{error}</p>}
      <button
        disabled={!valid || saving || available === false}
        className="w-full rounded-2xl bg-lime text-bg font-display font-black text-lg py-4 disabled:opacity-40 glow-lime"
      >
        {saving ? "Guardando…" : editing ? "Guardar cambios" : "¡A jugar!"}
      </button>
    </form>
  );
}
