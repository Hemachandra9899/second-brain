"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useMoodTheme } from "@/hooks/useMoodTheme";

type AppShellProps = {
  title?: string;
  children: ReactNode;
};

export function AppShell({ title = "Second Brain", children }: AppShellProps) {
  const { theme, mood, loading } = useMoodTheme();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.background} text-slate-900 transition-all duration-700`}>
      <main className="mx-auto min-h-screen w-full max-w-md px-4 py-5 md:max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-2xl font-semibold tracking-tight">
              {title}
            </Link>
            {!loading && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-xs shadow-sm capitalize">
                <span className={`inline-block h-2 w-2 rounded-full ${
                  mood === "happy" || mood === "calm" ? "bg-emerald-400" :
                  mood === "sad" || mood === "lonely" ? "bg-cyan-400" :
                  mood === "anxious" || mood === "stressed" ? "bg-violet-400" :
                  mood === "angry" || mood === "frustrated" ? "bg-sky-400" :
                  "bg-slate-400"
                }`} />
                {mood}
              </span>
            )}
          </div>

          <nav className="hidden gap-3 md:flex">
            <Link href="/tasks" className="rounded-full bg-white/60 px-4 py-2 text-sm shadow-sm backdrop-blur">
              Tasks
            </Link>
            <Link href="/assistant" className="rounded-full bg-white/60 px-4 py-2 text-sm shadow-sm backdrop-blur">
              Assistant
            </Link>
            <Link href="/knowledge" className="rounded-full bg-white/60 px-4 py-2 text-sm shadow-sm backdrop-blur">
              Knowledge
            </Link>
            <Link href="/calendar" className="rounded-full bg-white/60 px-4 py-2 text-sm shadow-sm backdrop-blur">
              Calendar
            </Link>
            <Link href="/mood" className="rounded-full bg-white/60 px-4 py-2 text-sm shadow-sm backdrop-blur">
              Mood
            </Link>
          </nav>
        </header>

        {children}

        <nav className="fixed bottom-4 left-1/2 z-40 flex w-[92%] max-w-md -translate-x-1/2 justify-around rounded-full bg-white/80 px-4 py-3 shadow-xl backdrop-blur-xl md:hidden">
          <Link href="/tasks" className="text-sm">Tasks</Link>
          <Link href="/assistant" className="text-sm">AI</Link>
          <Link href="/knowledge" className="text-sm">KB</Link>
          <Link href="/calendar" className="text-sm">Calendar</Link>
          <Link href="/mood" className="text-sm">Mood</Link>
        </nav>
      </main>
    </div>
  );
}
