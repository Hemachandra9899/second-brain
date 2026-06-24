"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
import { getStoredUser, isSignedIn, logout } from "@/lib/auth";

type AppShellProps = {
  title?: string;
  children: ReactNode;
};

export function AppShell({ title, children }: AppShellProps) {
  const user = getStoredUser();
  const signedIn = isSignedIn();

  return (
    <main className="sb-shell min-h-[100dvh] text-white">
      <div className="mx-auto min-h-[100dvh] w-full max-w-md px-5 pb-28 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-3 active:scale-95">
            <BrandLogo size="sm" />
            <div className="leading-none">
              <p className="text-[13px] font-black tracking-[-0.03em] text-white">Second Brain</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.32em] text-cyan-200/60">{title || "Personal AI"}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              aria-label="Open AI"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-lg text-white shadow-lg shadow-black/30 active:scale-95"
            >
              ✦
            </Link>

            {signedIn ? (
              <button
                onClick={logout}
                className="flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-2.5 text-xs font-bold text-white/80 active:scale-95"
              >
                {user?.picture ? <img src={user.picture} alt="" className="h-7 w-7 rounded-full object-cover" /> : null}
                <span>Out</span>
              </button>
            ) : (
              <Link href="/login" className="rounded-2xl bg-white px-4 py-3 text-xs font-black text-black active:scale-95">
                Sign in
              </Link>
            )}
          </div>
        </header>

        {children}
      </div>

      <MobileBottomBar />
    </main>
  );
}
