"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { useMoodTheme } from "@/hooks/useMoodTheme";
import { SecondBrainLogo } from "@/components/layout/SecondBrainLogo";

type UserInfo = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

type AppShellProps = {
  title?: string;
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { theme, mood, loading } = useMoodTheme();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("second_brain_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {}
    }
  }, []);

  function logout() {
    localStorage.removeItem("second_brain_token");
    localStorage.removeItem("second_brain_user");
    window.location.href = "/";
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.background} text-slate-900 transition-all duration-700`}>
      <main className="mx-auto min-h-screen w-full max-w-md px-4 py-5 md:max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <SecondBrainLogo />

          <div className="flex items-center gap-3">
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

            <Link
              href="/home"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 text-sm shadow-sm backdrop-blur"
            >
              ⌂
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                {user.picture ? (
                  <img src={user.picture} alt="" className="h-7 w-7 rounded-full" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-200 text-xs font-medium text-sky-700">
                    {user.name?.charAt(0) || "?"}
                  </div>
                )}
                <button onClick={logout} className="text-xs text-slate-500 hover:text-slate-700">
                  Log out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-slate-950 px-4 py-2 text-xs font-medium text-white shadow-sm"
              >
                Log in
              </Link>
            )}
          </div>
        </header>

        {children}

        <nav className="fixed bottom-4 left-1/2 z-40 flex w-[92%] max-w-md -translate-x-1/2 justify-around rounded-full bg-white/80 px-4 py-3 shadow-xl backdrop-blur-xl md:hidden">
          <Link href="/" className="flex flex-col items-center gap-0.5 text-xs text-slate-600">
            <span className="text-lg">💬</span>
            Chat
          </Link>
          <Link href="/capture" className="flex flex-col items-center gap-0.5 text-xs text-slate-600">
            <span className="text-lg">+</span>
            Capture
          </Link>
          <Link href="/memory" className="flex flex-col items-center gap-0.5 text-xs text-slate-600">
            <span className="text-lg">🧠</span>
            Memory
          </Link>
          <Link href="/home" className="flex flex-col items-center gap-0.5 text-xs text-slate-600">
            <span className="text-lg">⌂</span>
            Home
          </Link>
        </nav>
      </main>
    </div>
  );
}
