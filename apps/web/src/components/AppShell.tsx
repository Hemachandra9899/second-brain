"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
import { getStoredUser, isSignedIn, logout, type StoredUser } from "@/lib/auth";

type AppShellProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
};

export function AppShell({ title, eyebrow = "Second Brain", children }: AppShellProps) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setSignedIn(isSignedIn());
  }, []);

  return (
    <main className="sb-netflix-shell min-h-[100dvh] text-white">
      <div className="mx-auto min-h-[100dvh] w-full max-w-md px-5 pb-32 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <header className="mb-10 flex items-center justify-between">
          <Link href="/home" aria-label="Home">
            <BrandLogo size="sm" />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/9 text-lg text-white backdrop-blur-xl"
              aria-label="Open AI"
            >
              ✦
            </Link>

            {signedIn && user?.picture ? (
              <button onClick={logout} className="h-11 w-11 overflow-hidden rounded-full border border-white/10" aria-label="Log out">
                <img src={user.picture} alt={user.name || "Profile"} className="h-full w-full object-cover" />
              </button>
            ) : signedIn ? (
              <button onClick={logout} className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-200 text-sm font-black text-black" aria-label="Log out">
                {(user?.name || "U").charAt(0)}
              </button>
            ) : (
              <Link href="/login" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black">
                Sign in
              </Link>
            )}
          </div>
        </header>

        {title ? (
          <section className="mb-7 sb-fade-up">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-cyan-200/75">{eyebrow}</p>
            <h1 className="mt-4 text-[3.4rem] font-black leading-[0.92] tracking-[-0.085em] text-white">
              {title}
            </h1>
          </section>
        ) : null}

        {children}
      </div>

      <MobileBottomBar />
    </main>
  );
}
