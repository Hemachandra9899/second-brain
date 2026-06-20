"use client";

import Link from "next/link";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";

const recentItems = [
  {
    title: "Todo from Notion",
    subtitle: "2 checklist items created",
    quality: "Synced",
    time: "Just now",
    href: "/tasks",
  },
  {
    title: "Pricing test notes",
    subtitle: "Saved as writing block",
    quality: "Memory",
    time: "1 hour ago",
    href: "/memory",
  },
  {
    title: "Goals cleanup",
    subtitle: "Extracted project context",
    quality: "Graph",
    time: "2 hours ago",
    href: "/projects",
  },
];

export function HomeMobile() {
  return (
    <main className="min-h-[100dvh] bg-[#f7f7f7] text-slate-950">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-32 pt-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-[4.2rem] font-black leading-none tracking-[-0.08em]">
              History
            </h1>

            <div className="mt-5 flex items-center gap-5 text-2xl tracking-[-0.06em]">
              <button className="font-medium text-slate-950">
                Recent items <span className="rounded-full bg-slate-200 px-2 text-sm">12</span>
              </button>
              <button className="font-medium text-slate-400">
                Saved <span className="rounded-full bg-slate-200 px-2 text-sm">8</span>
              </button>
            </div>
          </div>

          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm"
          >
            ✦
          </Link>
        </header>

        <section className="mt-8 space-y-5">
          {recentItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex min-h-[8.5rem] items-center gap-4 rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 active:scale-[0.99]"
            >
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-sky-100 to-white text-3xl">
                ◌
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-semibold leading-[0.95] tracking-[-0.06em] text-slate-950">
                  {item.title}
                </h2>

                <p className="mt-3 line-clamp-1 text-sm text-slate-500">
                  {item.subtitle}
                </p>

                <div className="mt-5 flex items-center gap-3 text-xs text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span>{item.quality}</span>
                  <span>·</span>
                  <span>{item.time}</span>
                </div>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-2xl text-blue-600">
                ›
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] bg-slate-950 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">
            Quick capture
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
            Write anything. I&apos;ll clean it.
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Capture messy thoughts, todos, goals, or notes. Second Brain will turn them into memory, tasks, and Notion pages.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/writing"
              className="rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950"
            >
              New writing
            </Link>

            <Link
              href="/"
              className="rounded-full bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Ask AI
            </Link>
          </div>
        </section>
      </div>

      <MobileBottomBar />
    </main>
  );
}
