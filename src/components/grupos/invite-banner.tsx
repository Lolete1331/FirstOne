"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRpc } from "@/lib/hooks/use-rpc";
import { getSupabase } from "@/lib/supabase/client";

type Invite = { code: string; name: string; members: number; invited_by: string };

/** Aviso arriba de la web cuando alguien te ha invitado a un grupo. */
export function GroupInviteBanner() {
  const { profile } = useAuth();
  const router = useRouter();
  const invites = useRpc<Invite[]>("my_group_invites", profile ? {} : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inv = invites.data?.[0];
  if (!profile || !inv) return null;

  async function answer(accept: boolean) {
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().rpc("answer_group_invite", { p_code: inv!.code, p_accept: accept });
    setBusy(false);
    if (error) return setError(error.message);
    if (accept) router.push(`/grupos/${inv!.code}`);
    invites.reload();
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-3">
      <div role="status" className="card flex flex-wrap items-center gap-3 p-3 sm:p-4 border-gold/60">
        <span className="text-2xl" aria-hidden>👥</span>
        <p className="flex-1 min-w-[12rem] text-sm">
          <b>@{inv.invited_by}</b> te invita a su grupo <b>«{inv.name}»</b>{" "}
          <span className="text-muted">
            ({inv.members} {Number(inv.members) === 1 ? "persona" : "personas"})
          </span>
          {invites.data!.length > 1 && <span className="text-muted"> · y {invites.data!.length - 1} invitación más</span>}
        </p>
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => answer(true)} className="rounded-full bg-lime text-bg font-bold px-4 py-2 text-sm disabled:opacity-50">
            Unirme
          </button>
          <button disabled={busy} onClick={() => answer(false)} className="rounded-full border border-line px-4 py-2 text-sm text-muted hover:text-text disabled:opacity-50">
            No, gracias
          </button>
        </div>
        {error && <p className="w-full text-danger text-xs">{error}</p>}
      </div>
    </div>
  );
}
