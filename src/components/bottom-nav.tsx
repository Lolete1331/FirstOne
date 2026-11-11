"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { NAV_ITEMS } from "./nav-items";

/** Navegación inferior tipo app (solo móvil). */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-bg/80 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} className="relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] min-[360px]:text-[11px] font-medium whitespace-nowrap tracking-tight">
                {active && (
                  <motion.span layoutId="bottom-pill" className="absolute top-0 h-0.5 w-10 rounded-full bg-lime shadow-[0_0_12px_var(--lime)]" />
                )}
                <span className={`text-lg leading-none ${active ? "text-lime" : "text-muted"}`}>{item.icon}</span>
                <span className={active ? "text-text" : "text-muted"}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
