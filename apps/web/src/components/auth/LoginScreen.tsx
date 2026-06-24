"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleLoginCard } from "@/components/auth/GoogleLoginCard";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { isSignedIn } from "@/lib/auth";

export function LoginScreen() {
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn()) router.replace("/home");
  }, [router]);

  return (
    <main className="sb-shell min-h-[100dvh] px-5 py-6">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col">
        <header className="flex items-center justify-between">
          <Link
            href="/onboarding"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl text-white"
          >
            ‹
          </Link>
          <BrandLogo size="sm" />
          <div className="h-11 w-11" />
        </header>

        <div className="flex flex-1 flex-col justify-center sb-fade-up">
          <div className="mx-auto mb-10 flex justify-center">
            <BrandLogo size="lg" />
          </div>

          <p className="text-center text-xs font-black uppercase tracking-[0.22em] text-cyan-200/80">
            Private memory starts here
          </p>
          <h1 className="mx-auto mt-4 max-w-sm text-center text-[3.35rem] font-semibold leading-[0.92] tracking-[-0.08em] text-white">
            Enter your Second Brain
          </h1>
          <p className="mx-auto mt-5 max-w-xs text-center text-[15px] leading-6 text-white/54">
            Sign in to save memory, sync Notion, manage tasks, and continue your personal AI workspace.
          </p>

          <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-2xl">
            <GoogleLoginCard />
            <p className="mt-4 text-center text-xs leading-5 text-white/38">
              Your memory, tasks, projects, and integrations stay private to your account.
            </p>
          </div>
        </div>

        <footer className="flex justify-center gap-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] text-xs text-white/36">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Security</span>
        </footer>
      </section>
    </main>
  );
}
