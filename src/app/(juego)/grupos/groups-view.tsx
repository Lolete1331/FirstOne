"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { PageTitle, Skeleton } from "@/components/ui";
import { useRpc } from "@/lib/hooks/use-rpc";
import { getSupabase } from "@/lib/supabase/client";

type MyGroup = { code: string; name: string; members: number; is_owner: boolean };

export function GroupsView() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const groups = useRpc<MyGroup[]>("my_groups", profile ? {} : null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error } = await getSupabase().rpc("create_group", { p_name: name });
    setBusy(false);
    if (error) return setError(error.message);
    router.push(`/grupos/${(data as { code: string }).code}`);
  }
  function join(e: FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length === 6) router.push(`/grupos/${c}`);
    else setError("El código tiene 6 letras o números.");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageTitle kicker="Compite con los tuyos" title="Grupos" accent="👥">
        Crea un grupo para tu clase, tus amigos o tu familia, comparte el código y tendréis vuestra propia clasificación: palabras
        conquistadas, rachas y juegos de la semana.
      </PageTitle>

      {loading ? (
        <div className="mt-8"><Skeleton /></div>
      ) : !profile ? (
        <div className="card mt-8 p-6 text-center">
          <p>Para crear un grupo o unirte a uno necesitas una cuenta (es gratis).</p>
          <Link href="/login?next=/grupos" className="mt-4 inline-block rounded-full bg-lime text-bg font-bold px-6 py-3">
            Entrar o crear cuenta
          </Link>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="font-display font-bold text-xl">Mis grupos</h2>
            {groups.loading && !groups.data ? (
              <div className="mt-3"><Skeleton rows={2} /></div>
            ) : !groups.data?.length ? (
              <p className="mt-2 text-muted">Todavía no estás en ningún grupo. Crea uno o únete con un código.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {groups.data.map((g) => (
                  <li key={g.code}>
                    <Link href={`/grupos/${g.code}`} className="card flex items-center gap-3 p-4 hover:border-lime/60">
                      <span className="text-2xl">👥</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-display font-bold truncate">{g.name}</span>
                        <span className="block text-xs text-muted">
                          {g.members} {g.members === 1 ? "persona" : "personas"} · código <span className="font-mono">{g.code}</span>
                          {g.is_owner && " · lo creaste tú"}
                        </span>
                      </span>
                      <span className="text-muted">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <form onSubmit={create} className="card p-5">
              <h2 className="font-display font-bold text-lg">Crear un grupo</h2>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="Ej.: 2.º Bachillerato B"
                className="mt-3 w-full rounded-xl bg-surface-2 border border-line px-3 py-2.5 outline-none focus:border-lime/70"
              />
              <button disabled={busy || name.trim().length < 3} className="mt-3 w-full rounded-xl bg-lime text-bg font-bold py-2.5 disabled:opacity-40">
                Crear
              </button>
            </form>
            <form onSubmit={join} className="card p-5">
              <h2 className="font-display font-bold text-lg">Unirme con un código</h2>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={8}
                placeholder="Ej.: K7MPQ2"
                className="mt-3 w-full rounded-xl bg-surface-2 border border-line px-3 py-2.5 font-mono uppercase tracking-widest outline-none focus:border-lime/70"
              />
              <button disabled={code.trim().length < 6} className="mt-3 w-full rounded-xl border border-lime/60 text-lime font-bold py-2.5 disabled:opacity-40">
                Buscar grupo
              </button>
            </form>
          </div>
          {error && <p className="mt-3 text-danger text-sm">{error}</p>}
          <p className="mt-6 text-xs text-muted">
            En los grupos solo se ve el @usuario y el país de cada miembro (lo mismo que ya es público en el ranking). Para tener cuenta hay
            que tener 14 años o más.
          </p>
        </>
      )}
    </div>
  );
}
