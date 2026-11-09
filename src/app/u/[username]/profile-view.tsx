"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useRpc } from "@/lib/hooks/use-rpc";
import { useAuth } from "@/components/auth-provider";
import { Empty, Skeleton, Tabs } from "@/components/ui";
import { Medal } from "@/components/medal";
import { countryFlag, countryName } from "@/lib/countries";
import { formatClaimDate } from "@/lib/time/year";

type ProfileRow = {
  username: string;
  country: string | null;
  created_at: string;
  medals_total: number;
  words_total: number;
  medals_this_year: number;
};
type ClaimRow = { word: string; year: number; position: number; claimed_at: string; total: number };

export function ProfileView({ username }: { username: string }) {
  const { profile: me, signOut } = useAuth();
  const profile = useRpc<ProfileRow[]>("user_profile", { p_username: username });
  const claims = useRpc<ClaimRow[]>("user_claims", { p_username: username, p_limit: 1000 });
  const [filter, setFilter] = useState<"all" | "medals">("all");
  const p = profile.data?.[0];
  const isMe = me && p && me.username.toLowerCase() === p.username.toLowerCase();

  const byYear = useMemo(() => {
    const groups = new Map<number, ClaimRow[]>();
    for (const c of claims.data ?? []) {
      if (filter === "medals" && c.position !== 1) continue;
      groups.set(c.year, [...(groups.get(c.year) ?? []), c]);
    }
    return [...groups.entries()].sort(([a], [b]) => b - a);
  }, [claims.data, filter]);

  if (profile.loading && !profile.data) return <div className="pt-24"><Skeleton /></div>;
  if (!p) return <Empty>No existe ningún jugador llamado @{username}.</Empty>;

  return (
    <div className="pt-8">
      <div className="card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-violet/30 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="grid place-items-center size-20 rounded-3xl bg-gradient-to-br from-violet via-pink to-gold font-display font-black text-4xl uppercase">
            {p.username[0]}
          </span>
          <div className="min-w-0">
            <h1 className="font-display font-black text-3xl sm:text-4xl truncate">@{p.username}</h1>
            <p className="text-muted">
              {p.country ? `${countryFlag(p.country)} ${countryName(p.country)} · ` : ""}
              jugando desde {formatClaimDate(p.created_at, { withYear: true }).split(" a las")[0]}
            </p>
          </div>
          {isMe && (
            <div className="ml-auto flex gap-2">
              <Link href="/onboarding" className="rounded-full border border-line px-4 py-2 text-sm hover:border-lime/60">
                Editar
              </Link>
              <button onClick={signOut} className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:text-text">
                Salir
              </button>
            </div>
          )}
        </div>
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            ["Medallas este año", p.medals_this_year, "text-gold"],
            ["Medallas totales", p.medals_total, ""],
            ["Palabras escritas", p.words_total, "text-cyan"],
          ].map(([label, n, cls]) => (
            <div key={label as string} className="rounded-2xl bg-surface-2/70 p-3 sm:p-4">
              <p className={`font-display font-black text-2xl sm:text-4xl tabular-nums ${cls}`}>{(n as number).toLocaleString("es")}</p>
              <p className="text-[11px] sm:text-xs text-muted">{label as string}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="font-display font-bold text-xl">Sus palabras</h2>
        <Tabs value={filter} onChange={setFilter} options={[["all", "Todas"], ["medals", "Solo 🥇"]]} />
      </div>

      {claims.loading && !claims.data ? (
        <div className="mt-4"><Skeleton /></div>
      ) : byYear.length === 0 ? (
        <Empty>{isMe ? "Aún no has reclamado ninguna palabra. ¡Ve a por la primera!" : "Todavía no ha reclamado palabras."}</Empty>
      ) : (
        byYear.map(([year, rows]) => {
          const medals = rows.filter((r) => r.position === 1).length;
          return (
            <section key={year} className="mt-6">
              <div className="flex items-baseline gap-3 mb-3">
                <h3 className="font-display font-black text-3xl text-muted/60">{year}</h3>
                <span className="text-sm text-muted">
                  {medals} 🥇 · {rows.length} palabras
                </span>
              </div>
              <ul className="flex flex-wrap gap-2">
                {rows.map((c, i) => (
                  <motion.li key={c.word} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.015, 0.5) }}>
                    <Link
                      href={`/history?word=${encodeURIComponent(c.word)}`}
                      title={`${formatClaimDate(c.claimed_at)} · ${c.total} ${c.total === 1 ? "persona" : "personas"}`}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-display font-bold transition-colors ${
                        c.position === 1
                          ? "border-gold/50 bg-gold/10 text-gold hover:bg-gold/20"
                          : "border-line bg-surface-2/60 text-text/80 hover:border-cyan/50"
                      }`}
                    >
                      {c.position === 1 ? <span>🥇</span> : <span className="font-mono text-[11px] text-muted">#{c.position}</span>}
                      {c.word}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </section>
          );
        })
      )}
      {p.medals_total > 0 && filter === "medals" && (
        <div className="mt-10 flex justify-center opacity-70">
          <Medal size={64} label={String(p.medals_total)} />
        </div>
      )}
    </div>
  );
}
