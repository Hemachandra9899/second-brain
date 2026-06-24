"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Home", href: "/home", icon: "⌂", matches: ["/home"] },
  { label: "AI", href: "/", icon: "✦", matches: ["/"] },
  {
    label: "Features",
    href: "/features",
    icon: "▦",
    matches: [
      "/features",
      "/capture",
      "/memory",
      "/tasks",
      "/settings",
      "/projects",
      "/knowledge",
      "/writing",
      "/mood",
      "/imports",
    ],
  },
];

export function MobileBottomBar() {
  const pathname = usePathname();

  function isActive(tab: (typeof tabs)[number]) {
    if (tab.href === "/") return pathname === "/";
    return tab.matches.some((match) => pathname === match || pathname.startsWith(`${match}/`));
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="sb-bottom-blur rounded-[2rem] border border-white/10 p-1.5 shadow-[0_18px_70px_rgba(0,0,0,0.55)]">
        <div className="grid grid-cols-3 gap-1.5">
          {tabs.map((tab) => {
            const active = isActive(tab);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={
                  active
                    ? "flex flex-col items-center justify-center rounded-[1.55rem] bg-white px-4 py-3 text-black shadow-xl transition-all duration-300"
                    : "flex flex-col items-center justify-center rounded-[1.55rem] px-4 py-3 text-white/48 transition-all duration-300 active:scale-95"
                }
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                <span className="mt-1 text-[11px] font-bold">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
