"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRpc } from "@/lib/hooks/use-rpc";
import { getSupabase } from "@/lib/supabase/client";
import { Empty, PageTitle, Skeleton } from "@/components/ui";
import { countryFlag } from "@/lib/countries";
import { currentGameYear, formatClaimDate, timeAgo } from "@/lib/time/year";
import { normalizeWord } from "@/lib/words/normalize";

type Overview = {
  claims_last_minute: number;
  claims_last_hour: number;
  claims_today: number;
  attempts_last_hour: number;
  users_total: number;
  users_today: number;
  users_banned: number;
  hidden_words: number;
  top_attempters: { id: string; username: string; attempts: number; banned: boolean }[];
};
type UserRow = {
  id: string;
  username: string;
  country: string | null;
  created_at: string;
  is_admin: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  medals: number;
  words: number;
};
type ClaimRow = { word: string; year: number; position: number; claimed_at: string; total: number };
type LogRow = { id: number; admin: string | null; action: string; target: string | null; details: Record<string, unknown> | null; created_at: string };

const ACTIONS: Record<string, string> = {
  ban: "⛔ bloqueó a",
  unban: "✅ desbloqueó a",
  void_claim: "🗑 anuló la reclamación de",
  hide_word: "🙈 ocultó",
  unhide_word: "👁 volvió a mostrar",
};

export function AdminView() {
  const { profile, loading } = useAuth();
  if (loading) return <div className="pt-24"><Skeleton /></div>;
  if (!profile?.is_admin) {
    return (
      <Empty>
        No tienes acceso a esta página. <Link href="/jugar" className="underline">Volver al juego</Link>
      </Empty>
    );
  }
  return <Panel myId={profile.id} />;
}

function Panel({ myId }: { myId: string }) {
  const overview = useRpc<Overview>("admin_overview", {}, { refreshMs: 10_000 });
  const log = useRpc<LogRow[]>("admin_recent_log", { p_limit: 30 });
  const bump = () => {
    log.reload();
    overview.reload();
  };
  const o = overview.data;

  return (
    <div>
      <PageTitle kicker="Solo administradores" title="Panel" accent="admin">
        Todas las acciones quedan registradas. Los permisos los comprueba la base de datos.
      </PageTitle>

      {/* Métricas */}
      <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Reclamaciones/min", o?.claims_last_minute, "text-lime"],
          ["Última hora", o?.claims_last_hour, ""],
          ["Hoy", o?.claims_today, ""],
          ["Intentos última hora", o?.attempts_last_hour, "text-muted"],
          ["Usuarios", o?.users_total, "text-cyan"],
          ["Nuevos hoy", o?.users_today, ""],
          ["Bloqueados", o?.users_banned, "text-danger"],
          ["Palabras ocultas", o?.hidden_words, "text-pink"],
        ].map(([label, n, cls]) => (
          <div key={label as string} className="card p-4">
            <p className={`font-display font-black text-2xl sm:text-3xl tabular-nums ${cls}`}>
              {n === undefined ? "—" : Number(n).toLocaleString("es")}
            </p>
            <p className="text-xs text-muted">{label as string}</p>
          </div>
        ))}
      </section>

      {o && o.top_attempters.length > 0 && (
        <section className="card mt-4 p-4">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted">Más intentos en 10 min (¿bots?)</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {o.top_attempters.map((t) => (
              <li key={t.id} className={`rounded-full border px-3 py-1 text-sm ${t.banned ? "border-danger/50 text-danger" : "border-line"}`}>
                @{t.username} · <b className="font-mono">{t.attempts}</b>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Users myId={myId} onChange={bump} />
        <div className="space-y-6">
          <HiddenWords onChange={bump} />
          <section className="card p-4">
            <h2 className="font-display font-bold text-lg">Registro</h2>
            {log.loading && !log.data ? (
              <Skeleton rows={3} />
            ) : !log.data?.length ? (
              <p className="mt-2 text-sm text-muted">Sin acciones todavía.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {log.data.map((l) => (
                  <li key={l.id} className="flex gap-2">
                    <span className="text-muted font-mono text-xs w-16 shrink-0 pt-0.5">{timeAgo(l.created_at)}</span>
                    <span>
                      <b>@{l.admin ?? "?"}</b> {ACTIONS[l.action] ?? l.action} <b>{l.target}</b>
                      {typeof l.details?.reason === "string" && l.details.reason && (
                        <span className="text-muted"> — {l.details.reason}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Users({ myId, onChange }: { myId: string; onChange: () => void }) {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const users = useRpc<UserRow[]>("admin_search_users", { p_query: query, p_limit: 30 });
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="card p-4">
      <h2 className="font-display font-bold text-lg">Usuarios</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(q.trim().replace(/^@/, ""));
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar @usuario…"
          className="flex-1 min-w-0 rounded-xl bg-surface-2 border border-line px-3 py-2 outline-none focus:border-lime/70"
        />
        <button className="rounded-xl bg-lime text-bg font-bold px-4">Buscar</button>
      </form>
      {users.loading && !users.data ? (
        <div className="mt-3"><Skeleton rows={4} /></div>
      ) : !users.data?.length ? (
        <p className="mt-3 text-sm text-muted">No hay usuarios.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line/60">
          {users.data.map((u) => (
            <UserItem
              key={u.id}
              u={u}
              isMe={u.id === myId}
              open={open === u.id}
              onToggle={() => setOpen(open === u.id ? null : u.id)}
              onChange={() => {
                users.reload();
                onChange();
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function UserItem({ u, isMe, open, onToggle, onChange }: { u: UserRow; isMe: boolean; open: boolean; onToggle: () => void; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setBan(banned: boolean) {
    const reason = banned ? window.prompt(`¿Motivo del bloqueo de @${u.username}?`, "Uso de bots") : null;
    if (banned && reason === null) return;
    setBusy(true);
    const { error } = await getSupabase().rpc("admin_set_ban", { p_user_id: u.id, p_banned: banned, p_reason: reason });
    setBusy(false);
    if (error) setError(error.message);
    else onChange();
  }

  return (
    <li className="py-2.5">
      <div className="flex items-center gap-2">
        <button onClick={onToggle} className="flex-1 min-w-0 text-left">
          <p className="font-display font-bold truncate">
            {countryFlag(u.country)} @{u.username}
            {u.is_admin && <span className="ml-2 text-[10px] uppercase text-pink">admin</span>}
            {u.banned_at && <span className="ml-2 text-[10px] uppercase text-danger">bloqueado</span>}
          </p>
          <p className="text-xs text-muted">
            {u.medals} 🥇 · {u.words} palabras · desde {formatClaimDate(u.created_at, { withYear: true }).split(" a las")[0]}
            {u.ban_reason && ` · motivo: ${u.ban_reason}`}
          </p>
        </button>
        {!isMe &&
          (u.banned_at ? (
            <button disabled={busy} onClick={() => setBan(false)} className="rounded-full border border-lime/50 text-lime text-xs px-3 py-1.5">
              Desbloquear
            </button>
          ) : (
            <button disabled={busy} onClick={() => setBan(true)} className="rounded-full border border-danger/50 text-danger text-xs px-3 py-1.5">
              Bloquear
            </button>
          ))}
      </div>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
      {open && <UserClaims u={u} onChange={onChange} />}
    </li>
  );
}

function UserClaims({ u, onChange }: { u: UserRow; onChange: () => void }) {
  const claims = useRpc<ClaimRow[]>("user_claims", { p_username: u.username, p_limit: 200 });

  async function voidClaim(c: ClaimRow) {
    const msg =
      c.position === 1
        ? `¿Anular "${c.word}" (${c.year}) de @${u.username}? Perderá la medalla y la heredará quien llegó segundo.`
        : `¿Anular "${c.word}" (${c.year}) de @${u.username}? Los que llegaron después suben un puesto.`;
    if (!window.confirm(msg)) return;
    const { error } = await getSupabase().rpc("admin_void_claim", { p_word: c.word, p_year: c.year, p_user_id: u.id });
    if (error) window.alert(error.message);
    claims.reload();
    onChange();
  }

  if (claims.loading && !claims.data) return <div className="mt-2"><Skeleton rows={2} /></div>;
  if (!claims.data?.length) return <p className="mt-2 text-xs text-muted">Sin reclamaciones.</p>;
  return (
    <ul className="mt-2 max-h-72 overflow-y-auto rounded-xl bg-surface-2/50 p-2 text-sm">
      {claims.data.map((c) => (
        <li key={`${c.word}-${c.year}`} className="flex items-center gap-2 py-1">
          <span className="w-12 text-xs font-mono text-muted">{c.position === 1 ? "🥇" : `#${c.position}`}</span>
          <span className="font-display font-bold truncate">{c.word}</span>
          <span className="text-xs text-muted">{c.year}</span>
          <button onClick={() => voidClaim(c)} className="ml-auto text-xs text-danger hover:underline">
            Anular
          </button>
        </li>
      ))}
    </ul>
  );
}

function HiddenWords({ onChange }: { onChange: () => void }) {
  const [word, setWord] = useState("");
  const [error, setError] = useState<string | null>(null);
  const year = currentGameYear();
  const hidden = useRpc<{ word: string }[]>("admin_hidden_words", {});

  async function toggle(w: string, hide: boolean, e?: FormEvent) {
    e?.preventDefault();
    const clean = normalizeWord(w);
    if (!clean) return;
    const { error } = await getSupabase().rpc("admin_hide_word", { p_word: clean, p_hidden: hide });
    setError(error ? (error.message.includes("foreign key") ? "Esa palabra no está en el diccionario." : error.message) : null);
    if (!error) setWord("");
    hidden.reload();
    onChange();
  }

  return (
    <section className="card p-4">
      <h2 className="font-display font-bold text-lg">Palabras ocultas</h2>
      <p className="text-xs text-muted">No salen en el feed ni en el buscador de {year}. Siguen en el historial de sus dueños.</p>
      <form onSubmit={(e) => toggle(word, true, e)} className="mt-3 flex gap-2">
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="palabra ofensiva"
          className="flex-1 min-w-0 rounded-xl bg-surface-2 border border-line px-3 py-2 outline-none focus:border-pink/70"
        />
        <button className="rounded-xl bg-pink text-white font-bold px-4">Ocultar</button>
      </form>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
      <ul className="mt-3 flex flex-wrap gap-2">
        {hidden.data?.map((h) => (
          <li key={h.word} className="rounded-full border border-pink/40 px-3 py-1 text-sm flex items-center gap-2">
            {h.word}
            <button onClick={() => toggle(h.word, false)} aria-label={`Mostrar ${h.word}`} className="text-muted hover:text-text">
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
