"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    label: "Insights",
    href: "/home",
  },
  {
    label: "Ask AI",
    href: "/",
  },
  {
    label: "Overview",
    href: "/overview",
  },
];

export function MobileBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="rounded-full bg-white/80 p-2 shadow-2xl ring-1 ring-black/5 backdrop-blur-2xl dark:bg-zinc-900/80 dark:ring-white/10">
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const active =
              pathname === tab.href ||
              (tab.href !== "/" && pathname.startsWith(tab.href));

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={
                  active
                    ? "rounded-full bg-slate-950 px-3 py-3 text-center text-sm font-semibold text-white transition-all duration-200 dark:bg-white dark:text-slate-950"
                    : "rounded-full px-3 py-3 text-center text-sm font-semibold text-slate-400 transition-all duration-200 active:scale-95 dark:text-zinc-500"
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
