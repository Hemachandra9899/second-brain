"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Home", href: "/home" },
  { label: "Insights", href: "/insights" },
  { label: "Memory", href: "/memory" },
];

export function MobileBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md bg-white/80 px-6 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] pt-3 backdrop-blur-xl">
      <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white px-2 py-2 shadow-lg">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/home" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                active
                  ? "rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition"
                  : "rounded-full px-5 py-3 text-sm font-semibold text-slate-400 transition active:scale-95"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
