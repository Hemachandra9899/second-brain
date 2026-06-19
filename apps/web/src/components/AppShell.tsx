import Link from "next/link";
import { ReactNode } from "react";

type AppShellProps = {
  title?: string;
  children: ReactNode;
};

export function AppShell({ title = "Second Brain", children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-100 to-blue-200 text-slate-900">
      <main className="mx-auto min-h-screen w-full max-w-md px-4 py-5 md:max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            {title}
          </Link>

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
          </nav>
        </header>

        {children}

        <nav className="fixed bottom-4 left-1/2 z-40 flex w-[92%] max-w-md -translate-x-1/2 justify-around rounded-full bg-white/80 px-4 py-3 shadow-xl backdrop-blur-xl md:hidden">
          <Link href="/tasks" className="text-sm">Tasks</Link>
          <Link href="/assistant" className="text-sm">AI</Link>
          <Link href="/knowledge" className="text-sm">KB</Link>
          <Link href="/calendar" className="text-sm">Calendar</Link>
        </nav>
      </main>
    </div>
  );
}
