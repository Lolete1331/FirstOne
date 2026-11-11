"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { useRpc } from "@/lib/hooks/use-rpc";
import { Empty, PageTitle, Skeleton, Tabs, YearSelect } from "@/components/ui";
import { MedalBadge } from "@/components/medal";
import { countryFlag, countryName } from "@/lib/countries";
import { currentGameYear } from "@/lib/time/year";

type UserRow = { rank: number; username: string; country: string | null; medals: number; words: number };
type CountryRow = { rank: number; country: string; medals: number; words: number; players: number };

const podium = ["from-[#FFF3C4] via-gold to-[#C77800] text-[#5A3700]", "from-white via-[#C9CED6] to-[#7D8590] text-[#2A2F36]", "from-[#FFD2A8] via-[#D9894A] to-[#8A4A1C] text-[#3A1C06]"];

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3)
    return (
      <span className={`grid place-items-center size-9 rounded-full bg-gradient-to-br font-display font-black text-sm ${podium[rank - 1]}`}>
        {rank}
      </span>
    );
  return <span className="grid place-items-center size-9 font-mono text-sm text-muted">{rank}</span>;
}

export function RankingsView() {
  const [tab, setTab] = useState<"users" | "countries">("users");
  const [year, setYear] = useState(currentGameYear());
  const users = useRpc<UserRow[]>("top_users", tab === "users" ? { p_year: year, p_limit: 100 } : null, { refreshMs: 30_000 });
  const countries = useRpc<CountryRow[]>("top_countries", tab === "countries" ? { p_year: year, p_limit: 100 } : null, {
    refreshMs: 30_000,
  });

  return (
    <div>
      <PageTitle kicker={`Temporada ${year}`} title="Ranking" accent="mundial">
        Ordenado por medallas 🥇 (palabras de las que eres dueño); a igualdad, por palabras escritas.
      </PageTitle>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Tabs value={tab} onChange={setTab} options={[["users", "Jugadores"], ["countries", "Países"]]} />
        <YearSelect value={year} onChange={setYear} />
      </div>

      <div className="card mt-5 p-2 sm:p-4">
        {tab === "users" ? (
          users.loading && !users.data ? (
            <Skeleton />
          ) : !users.data?.length ? (
            <Empty>Nadie ha reclamado palabras en {year}. ¡El primer puesto está libre!</Empty>
          ) : (
            <ol>
              {users.data.map((u, i) => (
                <motion.li
                  key={u.username}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.6) }}
                  className={`flex items-center gap-3 px-2 py-2.5 border-b border-line/60 ${u.rank === 1 ? "bg-gold/5 rounded-xl" : ""}`}
                >
                  <RankBadge rank={u.rank} />
                  <Link href={`/u/${u.username}`} className="font-display font-bold truncate hover:text-lime">
                    {countryFlag(u.country)} @{u.username}
                  </Link>
                  <span className="ml-auto flex items-center gap-4 shrink-0">
                    <span className="flex items-center gap-1.5 font-mono font-bold text-lg">
                      <MedalBadge /> {u.medals.toLocaleString("es")}
                    </span>
                    <span className="hidden sm:block w-24 text-right text-sm text-muted">{u.words.toLocaleString("es")} escritas</span>
                  </span>
                </motion.li>
              ))}
            </ol>
          )
        ) : countries.loading && !countries.data ? (
          <Skeleton />
        ) : !countries.data?.length ? (
          <Empty>Todavía no hay países en el ranking de {year}.</Empty>
        ) : (
          <ol>
            {countries.data.map((c, i) => {
              const max = countries.data![0].medals || 1;
              return (
                <motion.li
                  key={c.country}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.6) }}
                  className="relative flex items-center gap-3 px-2 py-3 border-b border-line/60"
                >
                  <RankBadge rank={c.rank} />
                  <span className="text-2xl">{countryFlag(c.country)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold truncate">{countryName(c.country)}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-lime to-cyan"
                        initial={{ width: 0 }}
                        animate={{ width: `${(c.medals / max) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.1 + i * 0.03 }}
                      />
                    </div>
                  </div>
                  <span className="text-right shrink-0">
                    <span className="flex items-center gap-1.5 justify-end font-mono font-bold text-lg">
                      <MedalBadge /> {c.medals.toLocaleString("es")}
                    </span>
                    <span className="text-xs text-muted">{c.players.toLocaleString("es")} jugadores</span>
                  </span>
                </motion.li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
