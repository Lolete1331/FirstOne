import Link from "next/link";

/** Enlaces a las páginas legales para los pies de página. */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <span className={`flex flex-wrap justify-center gap-x-5 gap-y-1 ${className}`}>
      <Link href="/privacidad" className="hover:underline">Privacidad</Link>
      <Link href="/aviso-legal" className="hover:underline">Aviso legal</Link>
      <Link href="/cookies" className="hover:underline">Cookies</Link>
    </span>
  );
}
