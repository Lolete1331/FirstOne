import Link from "next/link";
import { LEGAL } from "@/lib/legal";

/** Envoltorio sobrio y legible para las páginas legales. */
export function LegalPage({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <article className="legal max-w-2xl mx-auto pt-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{kicker}</p>
      <h1 className="mt-2 font-display font-black text-3xl sm:text-4xl tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">Última actualización: {LEGAL.updated}</p>
      <div className="mt-8">{children}</div>
      <nav className="mt-12 pt-6 border-t border-line flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        <Link href="/privacidad" className="hover:text-lime">Privacidad</Link>
        <Link href="/aviso-legal" className="hover:text-lime">Aviso legal</Link>
        <Link href="/cookies" className="hover:text-lime">Cookies</Link>
      </nav>
    </article>
  );
}

/** El email de contacto como enlace (o un aviso si aún no está configurado). */
export function ContactEmail() {
  if (!LEGAL.contactEmail) return <span>nuestro TikTok @firstone.es</span>;
  return (
    <a href={`mailto:${LEGAL.contactEmail}`} className="text-lime underline underline-offset-2">
      {LEGAL.contactEmail}
    </a>
  );
}
