"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Home", href: "/home" },
  { label: "Brain", href: "/" },
];

export function MobileBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-6 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="rounded-full border border-white/10 bg-[#151515]/90 p-1.5 shadow-2xl backdrop-blur-2xl">
        <div className="grid grid-cols-2 gap-1.5">
          {tabs.map((tab) => {
            const active = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={
                  active
                    ? "rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-black transition-all duration-300"
                    : "rounded-full px-5 py-3 text-center text-sm font-semibold text-white/45 transition-all duration-300 active:scale-95"
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
