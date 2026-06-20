"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Home", href: "/home", icon: "⌂" },
  { label: "Brain", href: "/memory", icon: "◌" },
  { label: "Write", href: "/writing", icon: "✎" },
  { label: "Tasks", href: "/tasks", icon: "□" },
];

export function MobileBottomBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="flex items-center justify-between rounded-full bg-blue-600 px-3 py-3 shadow-2xl shadow-blue-600/30">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex h-12 min-w-12 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-blue-600"
                  : "flex h-12 min-w-12 items-center justify-center rounded-full px-4 text-sm font-semibold text-white/80"
              }
            >
              <span className="mr-1 text-lg">{item.icon}</span>
              {active ? item.label : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
