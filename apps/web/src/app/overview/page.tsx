import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
import Link from "next/link";

export default function OverviewPage() {
  return (
    <main className="min-h-[100dvh] bg-[#f7f7f7] text-slate-950 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-32 pt-12">
        <header>
          <h1 className="text-[4rem] font-black leading-none tracking-[-0.09em]">
            Overview
          </h1>

          <p className="mt-5 text-base leading-7 text-slate-500 dark:text-zinc-400">
            Your Second Brain health, connected sources, writing blocks, tasks,
            and memory activity.
          </p>
        </header>

        <section className="mt-8 grid gap-4">
          <Link
            href="/writing"
            className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-white/10"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
              Writing
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
              Clean messy thoughts
            </h2>
          </Link>

          <Link
            href="/tasks"
            className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-white/10"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
              Tasks
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
              Track and sync todos
            </h2>
          </Link>

          <Link
            href="/settings/integrations"
            className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-white/10"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
              Sources
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
              Connect Notion
            </h2>
          </Link>
        </section>
      </div>

      <MobileBottomBar />
    </main>
  );
}
