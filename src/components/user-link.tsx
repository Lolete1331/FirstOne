import Link from "next/link";
import { countryFlag } from "@/lib/countries";

/** Enlace a un perfil. Si la cuenta se borró, el historial la muestra como "cuenta eliminada". */
export function UserLink({
  username,
  country,
  className = "",
}: {
  username: string | null;
  country?: string | null;
  className?: string;
}) {
  if (!username) return <span className={`italic text-muted ${className}`}>cuenta eliminada</span>;
  return (
    <Link href={`/u/${username}`} className={`hover:text-lime transition-colors ${className}`}>
      {countryFlag(country)} @{username}
    </Link>
  );
}
