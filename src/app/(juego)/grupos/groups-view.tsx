"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { PageTitle, Skeleton, Tabs } from "@/components/ui";
import { useRpc } from "@/lib/hooks/use-rpc";
import { getSupabase } from "@/lib/supabase/client";

type MyGroup = { code: string; name: string; members: number; is_owner: boolean; is_public: boolean; requests: number };
type Found = { id: string; name: string; members: number; points_week: number; status: "member" | "pending" | null };
type Ranked = { rank: number; id: string; name: string; members: number; points: number; is_member: boolean; code: string | null };
type MyRequest = { id: string; name: string; members: number };
type Section = "mine" | "search" | "ranking";

const people = (n: number) => `${n} ${Number(n) === 1 ? "persona" : "personas"}`;

export function GroupsView() {
  const { profile, loading } = useAuth();
  const [section, setSection] = useState<Section>("mine");

  return (
    <div className="max-w-2xl mx-auto">
      <PageTitle kicker="Compite con los tuyos" title="Grupos" accent="👥">
        Crea un grupo para tu clase, tus amigos o tu familia, o busca uno y pide entrar. Cada grupo tiene su propia clasificación,
        y los grupos compiten entre sí.
      </PageTitle>

      <div className="mt-6 overflow-x-auto">
        <Tabs value={section} onChange={setSection} options={[["mine", "Mis grupos"], ["search", "🔎 Buscar"], ["ranking", "🏆 Mejores grupos"]]} />
      </div>

      {section === "search" ? (
        <SearchGroups signedIn={Boolean(profile)} />
      ) : section === "ranking" ? (
        <GroupRanking />
      ) : loading ? (
        <div className="mt-8"><Skeleton /></div>
      ) : !profile ? (
        <div className="card mt-8 p-6 text-center">
          <p>Para crear un grupo o unirte a uno necesitas una cuenta (es gratis).</p>
          <Link href="/login?next=/grupos" className="mt-4 inline-block rounded-full bg-lime text-bg font-bold px-6 py-3">
            Entrar o crear cuenta
          </Link>
        </div>
      ) : (
        <MyGroups />
      )}

      <p className="mt-8 text-xs text-muted">
        En los grupos solo se ve el @usuario y el país de cada miembro (lo mismo que ya es público en el ranking). Los grupos
        visibles salen en el buscador y en la clasificación de grupos con su nombre y cuántas personas son. Para tener cuenta hay
        que tener 14 años o más.
      </p>
    </div>
  );
}

function MyGroups() {
  const router = useRouter();
  const groups = useRpc<MyGroup[]>("my_groups", {});
  const requests = useRpc<MyRequest[]>("my_join_requests", {});
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error } = await getSupabase().rpc("create_group", { p_name: name, p_public: isPublic });
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
  async function cancel(id: string) {
    await getSupabase().rpc("cancel_join_request", { p_group_id: id });
    requests.reload();
  }

  return (
    <>
      <section className="mt-6">
        {groups.loading && !groups.data ? (
          <Skeleton rows={2} />
        ) : !groups.data?.length ? (
          <p className="text-muted">Todavía no estás en ningún grupo. Crea uno, únete con un código o busca uno y pide entrar.</p>
        ) : (
          <ul className="space-y-2">
            {groups.data.map((g) => (
              <li key={g.code}>
                <Link href={`/grupos/${g.code}`} className="card flex items-center gap-3 p-4 hover:border-lime/60">
                  <span className="text-2xl">👥</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-display font-bold truncate">{g.name}</span>
                    <span className="block text-xs text-muted">
                      {people(g.members)} · código <span className="font-mono">{g.code}</span>
                      {g.is_owner && " · lo creaste tú"}
                      {!g.is_public && " · privado"}
                    </span>
                  </span>
                  {Number(g.requests) > 0 && (
                    <span className="rounded-full bg-gold/20 text-gold text-xs font-bold px-2.5 py-1 whitespace-nowrap">
                      {g.requests} {Number(g.requests) === 1 ? "solicitud" : "solicitudes"}
                    </span>
                  )}
                  <span className="text-muted">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!!requests.data?.length && (
        <section className="mt-6">
          <h2 className="font-display font-bold text-lg">Esperando respuesta</h2>
          <ul className="mt-2 space-y-2">
            {requests.data.map((r) => (
              <li key={r.id} className="card flex items-center gap-3 p-3 text-sm">
                <span className="flex-1 min-w-0 truncate">
                  ⏳ <b>{r.name}</b> <span className="text-muted">· {people(r.members)}</span>
                </span>
                <button onClick={() => cancel(r.id)} className="text-xs text-muted hover:text-text underline">
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

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
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="mt-1 accent-lime" />
            <span>
              Visible: que salga en el buscador y en la clasificación de grupos{" "}
              <span className="text-muted">(para entrar tendrán que pedírtelo)</span>
            </span>
          </label>
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
    </>
  );
}

function SearchGroups({ signedIn }: { signedIn: boolean }) {
  const { profile } = useAuth();
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setQuery(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text]);
  const results = useRpc<Found[]>("search_groups", query.length >= 2 ? { p_query: query } : null);

  async function ask(g: Found) {
    setBusyId(g.id);
    setError(null);
    const { error } = await getSupabase().rpc(g.status === "pending" ? "cancel_join_request" : "request_join_group", { p_group_id: g.id });
    setBusyId(null);
    if (error) setError(error.message);
    results.reload();
  }
  async function adminDelete(g: Found) {
    if (!window.confirm(`(Admin) ¿Borrar el grupo «${g.name}» para todos? No se puede deshacer.`)) return;
    const { error } = await getSupabase().rpc("admin_delete_group", { p_group_id: g.id });
    if (error) setError(error.message);
    results.reload();
  }

  return (
    <section className="mt-6">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Busca por nombre: «Salesianos», «2.º B», «familia»…"
        aria-label="Buscar grupos por nombre"
        className="w-full rounded-xl bg-surface-2 border border-line px-4 py-3 outline-none focus:border-lime/70"
      />
      {query.length < 2 ? (
        <p className="mt-3 text-sm text-muted">Escribe al menos 2 letras. Solo salen los grupos que su creador ha marcado como visibles.</p>
      ) : results.loading && !results.data ? (
        <div className="mt-4"><Skeleton rows={2} /></div>
      ) : !results.data?.length ? (
        <p className="mt-3 text-muted">No hay grupos visibles con ese nombre. ¿Por qué no creas uno?</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {results.data.map((g) => (
            <li key={g.id} className="card flex flex-wrap items-center gap-3 p-4">
              <span className="text-2xl">👥</span>
              <span className="flex-1 min-w-[12rem]">
                <span className="block font-display font-bold break-words">{g.name}</span>
                <span className="block text-xs text-muted">
                  {people(g.members)} · {g.points_week} puntos esta semana
                </span>
              </span>
              {g.status === "member" ? (
                <span className="text-sm text-lime font-bold">Ya estás dentro</span>
              ) : !signedIn ? (
                <Link href="/login?next=/grupos" className="rounded-full bg-lime text-bg font-bold px-4 py-2 text-sm">
                  Entrar para pedirlo
                </Link>
              ) : (
                <button
                  disabled={busyId === g.id}
                  onClick={() => ask(g)}
                  className={`rounded-full px-4 py-2 text-sm font-bold disabled:opacity-50 ${
                    g.status === "pending" ? "border border-line text-muted" : "bg-lime text-bg"
                  }`}
                >
                  {g.status === "pending" ? "⏳ Pedido · cancelar" : "Pedir entrar"}
                </button>
              )}
              {profile?.is_admin && (
                <button onClick={() => adminDelete(g)} className="text-xs text-danger hover:underline">
                  Borrar (admin)
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-3 text-danger text-sm">{error}</p>}
      <p className="mt-4 text-xs text-muted">Quien creó el grupo verá tu @usuario y decidirá si te deja entrar.</p>
    </section>
  );
}

function GroupRanking() {
  const [period, setPeriod] = useState<"week" | "year">("week");
  const ranking = useRpc<Ranked[]>("group_ranking", { p_period: period, p_limit: 50 });

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display font-bold text-xl">Clasificación de grupos</h2>
        <Tabs value={period} onChange={setPeriod} options={[["week", "Esta semana"], ["year", "Este año"]]} />
      </div>
      <p className="mt-1 text-xs text-muted">
        {period === "week"
          ? "Puntos de los últimos 7 días: cada juego terminado, cada palabra oculta acertada y cada medalla conseguida por sus miembros suma 1."
          : "Medallas conseguidas este año por todos sus miembros."}{" "}
        Solo grupos visibles de 2 personas o más.
      </p>
      {ranking.loading && !ranking.data ? (
        <div className="mt-4"><Skeleton /></div>
      ) : !ranking.data?.length ? (
        <p className="mt-4 text-muted">Todavía no hay grupos en la clasificación. ¡El vuestro puede ser el primero!</p>
      ) : (
        <ol className="card mt-3 divide-y divide-line/60">
          {ranking.data.map((g) => {
            const pos = Number(g.rank);
            const inner = (
              <>
                <span className="w-8 text-center font-mono text-muted">{pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold truncate">{g.name}</span>
                  <span className="block text-xs text-muted">{people(g.members)}{g.is_member && " · es tu grupo"}</span>
                </span>
                <b className="tabular-nums text-gold whitespace-nowrap">
                  {g.points} {period === "week" ? "pts" : "🥇"}
                </b>
              </>
            );
            return (
              <li key={g.id} className={g.is_member ? "bg-lime/5" : ""}>
                {g.code ? (
                  <Link href={`/grupos/${g.code}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2/60">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">{inner}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
