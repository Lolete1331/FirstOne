import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

/** Enlaces a las páginas legales (y, si se pasa el email, a «Sugerencias») para los pies de página. */
export function LegalLinks({ className = "", email }: { className?: string; email?: string | null }) {
  return (
    <span className={`flex flex-wrap justify-center gap-x-5 gap-y-1 ${className}`}>
      {email && (
        <a href={`mailto:${email}?subject=Sugerencia%20para%20FirstOne`} className="hover:underline">
          Sugerencias
        </a>
      )}
      <Link href="/privacidad" className="hover:underline">Privacidad</Link>
      <Link href="/aviso-legal" className="hover:underline">Aviso legal</Link>
      <Link href="/cookies" className="hover:underline">Cookies</Link>
      <ThemeToggle variant="link" />
    </span>
  );
}
