"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { NAV_ITEMS } from "./nav-items";
import { useAuth } from "./auth-provider";
import { CountdownChip } from "./countdown";
import { countryFlag } from "@/lib/countries";
import { useHydrated } from "@/lib/hooks/use-hydrated";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2 font-display font-black tracking-tight text-lg">
      <span className="grid place-items-center size-8 rounded-xl bg-lime text-bg text-sm group-hover:rotate-[-8deg] transition-transform">
        1
      </span>
      <span>
        First<span className="text-gradient">One</span>
      </span>
    </Link>
  );
}

/** Versión estática (mientras se resuelve la ruta actual). */
export function HeaderShell() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-bg/60 border-b border-line">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center">
        <Logo />
      </div>
    </header>
  );
}

export function Header() {
  const pathname = usePathname();
  const auth = useAuth();
  // La cabecera se hidrata dentro de un Suspense, cuando la sesión puede estar ya cargada:
  // hasta terminar la hidratación pintamos lo mismo que el servidor (el esqueleto).
  const hydrated = useHydrated();
  const loading = auth.loading || !hydrated;
  const { user, profile } = auth;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-bg/60 border-b border-line">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${active ? "text-bg" : "text-muted hover:text-text"}`}
              >
                {active && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-lime" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <CountdownChip />
          {loading ? (
            <span className="size-9 rounded-full bg-surface-2 animate-pulse" />
          ) : profile ? (
            <Link
              href={`/u/${profile.username}`}
              className="flex items-center gap-2 rounded-full bg-surface-2 border border-line pl-1 pr-3 py-1 hover:border-lime/60 transition-colors"
            >
              <span className="grid place-items-center size-7 rounded-full bg-gradient-to-br from-violet to-pink text-xs font-bold uppercase">
                {profile.username[0]}
              </span>
              <span className="text-sm font-medium max-w-24 truncate">
                {countryFlag(profile.country)} @{profile.username}
              </span>
            </Link>
          ) : user ? (
            <Link href="/onboarding" className="rounded-full bg-pink text-white text-sm font-bold px-4 py-2">
              Elige tu @
            </Link>
          ) : (
            <Link href="/login" className="rounded-full bg-text text-bg text-sm font-bold px-4 py-2 hover:bg-lime transition-colors">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
