"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    label: "Home",
    href: "/home",
  },
  {
    label: "Brain",
    href: "/",
  },
];

export function MobileBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-8 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="rounded-full bg-white/75 p-2 shadow-2xl ring-1 ring-black/5 backdrop-blur-2xl dark:bg-zinc-900/80 dark:ring-white/10">
        <div className="grid grid-cols-2 gap-2">
          {tabs.map((tab) => {
            const active = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={
                  active
                    ? "rounded-full bg-black px-5 py-3 text-center text-sm font-semibold text-white transition-all duration-300 dark:bg-white dark:text-black"
                    : "rounded-full px-5 py-3 text-center text-sm font-semibold text-zinc-500 transition-all duration-300 active:scale-95 dark:text-zinc-400"
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
