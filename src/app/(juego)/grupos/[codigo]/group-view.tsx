"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Empty, PageTitle, Skeleton, Tabs } from "@/components/ui";
import { useRpc } from "@/lib/hooks/use-rpc";
import { getSupabase } from "@/lib/supabase/client";
import { countryFlag } from "@/lib/countries";

type Row = { username: string; country: string | null; medals: number; words: number; streak: number; games_week: number };
type Info = { code: string; name: string; members: number; owner: string; is_member: boolean; is_owner: boolean; ranking: Row[] | null };
type Sort = "medals" | "streak" | "games_week";

export function GroupView({ code }: { code: string }) {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const info = useRpc<Info | null>("group_info", authLoading ? null : { p_code: code });
  const [sort, setSort] = useState<Sort>("medals");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const g = info.data;

  const rows = useMemo(() => {
    const r = [...(g?.ranking ?? [])];
    r.sort((a, b) => b[sort] - a[sort] || b.medals - a.medals || a.username.localeCompare(b.username));
    return r;
  }, [g, sort]);

  async function call(fn: string, args: Record<string, unknown>, after?: () => void) {
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().rpc(fn, args);
    setBusy(false);
    if (error) setError(error.message);
    else if (after) after();
    else info.reload();
  }

  async function share() {
    const url = `https://firstone.es/grupos/${code}`;
    const text = `Únete a mi grupo «${g?.name}» en FirstOne y compite conmigo con las palabras del español 👉`;
    try {
      if (navigator.share) await navigator.share({ title: "FirstOne", text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
      }
    } catch {
      /* cancelado */
    }
  }

  if (authLoading || (info.loading && !info.data)) return <div className="pt-24"><Skeleton /></div>;
  if (!g) return <Empty>No existe ningún grupo con el código {code}. <Link href="/grupos" className="underline">Ver mis grupos</Link></Empty>;

  return (
    <div className="max-w-3xl mx-auto">
      <PageTitle kicker={`Grupo · código ${g.code}`} title={g.name}>
        {g.members} {g.members === 1 ? "persona" : "personas"} · creado por @{g.owner}
      </PageTitle>

      {!g.is_member ? (
        <div className="card mt-8 p-6 text-center">
          <p className="text-lg">Te han invitado a «{g.name}».</p>
          <p className="mt-1 text-muted">Únete para ver la clasificación y competir en palabras, rachas y juegos.</p>
          {profile ? (
            <button
              disabled={busy}
              onClick={() => call("join_group", { p_code: code })}
              className="mt-4 rounded-full bg-lime text-bg font-bold px-7 py-3 disabled:opacity-50"
            >
              Unirme al grupo
            </button>
          ) : (
            <Link href={`/login?next=/grupos/${code}`} className="mt-4 inline-block rounded-full bg-lime text-bg font-bold px-7 py-3">
              Entrar para unirme
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={share} className="rounded-full bg-lime text-bg font-bold px-5 py-2.5 text-sm">
              {copied ? "¡Enlace copiado!" : "📤 Invitar (compartir enlace)"}
            </button>
            <span className="rounded-full border border-line px-4 py-2.5 text-sm">
              Código: <b className="font-mono tracking-widest">{g.code}</b>
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display font-bold text-xl">Clasificación</h2>
            <Tabs value={sort} onChange={setSort} options={[["medals", "🥇 Palabras"], ["streak", "🔥 Racha"], ["games_week", "🎲 Juegos"]]} />
          </div>
          <p className="mt-1 text-xs text-muted">
            {sort === "medals" ? "Palabras con medalla este año." : sort === "streak" ? "Días seguidos jugando." : "Juegos terminados en los últimos 7 días."}
          </p>
          <ol className="card mt-3 divide-y divide-line/60">
            {rows.map((r, i) => (
              <li key={r.username} className={`flex items-center gap-3 px-4 py-3 ${r.username === profile?.username ? "bg-lime/5" : ""}`}>
                <span className="w-8 text-center font-mono text-muted">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</span>
                <Link href={`/u/${r.username}`} className="flex-1 min-w-0 font-bold truncate hover:text-lime">
                  {countryFlag(r.country)} @{r.username}
                </Link>
                <span className="text-sm tabular-nums whitespace-nowrap">
                  <b className={sort === "medals" ? "text-gold" : ""}>{r.medals} 🥇</b>
                  <span className="text-muted"> · </span>
                  <b className={sort === "streak" ? "text-gold" : ""}>{r.streak} 🔥</b>
                  <span className="text-muted"> · </span>
                  <b className={sort === "games_week" ? "text-gold" : ""}>{r.games_week} 🎲</b>
                </span>
                {g.is_owner && r.username !== profile?.username && (
                  <button
                    onClick={() => window.confirm(`¿Quitar a @${r.username} del grupo?`) && call("remove_group_member", { p_code: code, p_username: r.username })}
                    className="text-xs text-danger hover:underline"
                    aria-label={`Quitar a @${r.username}`}
                  >
                    Quitar
                  </button>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <button
              disabled={busy}
              onClick={() => window.confirm(g.is_owner && g.members > 1 ? "¿Salir del grupo? Lo creaste tú: pasará a la persona más antigua." : "¿Salir del grupo?") && call("leave_group", { p_code: code }, () => router.push("/grupos"))}
              className="rounded-full border border-line px-4 py-2 text-muted hover:text-text"
            >
              Salir del grupo
            </button>
            {g.is_owner && (
              <button
                disabled={busy}
                onClick={() => window.confirm("¿Borrar el grupo para todos? No se puede deshacer.") && call("delete_group", { p_code: code }, () => router.push("/grupos"))}
                className="rounded-full border border-danger/50 px-4 py-2 text-danger"
              >
                Borrar grupo
              </button>
            )}
            <Link href="/grupos" className="rounded-full border border-line px-4 py-2 hover:border-lime/60">
              Mis grupos
            </Link>
          </div>
        </>
      )}
      {error && <p className="mt-3 text-danger text-sm">{error}</p>}
    </div>
  );
}
