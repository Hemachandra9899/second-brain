"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Home", href: "/home", icon: "⌂", match: ["/home"] },
  { label: "AI", href: "/", icon: "✦", match: ["/"] },
  {
    label: "Features",
    href: "/features",
    icon: "▦",
    match: [
      "/features",
      "/capture",
      "/memory",
      "/tasks",
      "/settings",
      "/projects",
      "/knowledge",
      "/mood",
      "/writing",
      "/imports",
    ],
  },
];

function isActive(pathname: string, tab: (typeof tabs)[number]) {
  if (tab.href === "/") return pathname === "/";
  return tab.match.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function MobileBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[80] mx-auto w-full max-w-md border-t border-white/10 bg-[#090b0f]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-22px_60px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                active
                  ? "flex h-14 items-center justify-center gap-2 rounded-2xl bg-white text-sm font-extrabold text-black transition duration-300 active:scale-95"
                  : "flex h-14 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white/50 transition duration-300 active:scale-95 hover:bg-white/10 hover:text-white"
              }
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
