"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Home", href: "/home", icon: "⌂" },
  { label: "Chat", href: "/", icon: "✦" },
  { label: "Memory", href: "/memory", icon: "◫" },
  { label: "Tasks", href: "/tasks", icon: "✓" },
  { label: "Profile", href: "/settings/integrations", icon: "◉" },
];

export function MobileBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-4 pb-[calc(env(safe-area-inset-bottom)+0.8rem)]">
      <div className="sb-glass rounded-[1.7rem] p-1.5">
        <div className="grid grid-cols-5 gap-1">
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
                    ? "rounded-[1.2rem] bg-white px-2 py-2.5 text-center text-[11px] font-bold text-black transition-all duration-300"
                    : "rounded-[1.2rem] px-2 py-2.5 text-center text-[11px] font-semibold text-white/45 transition-all duration-300 active:scale-95"
                }
              >
                <span className="block text-base leading-none">{tab.icon}</span>
                <span className="mt-1 block truncate">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
