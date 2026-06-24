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
    <main className="sb-shell flex min-h-[100dvh] items-center justify-center px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[86dvh] w-full max-w-md flex-col">
        <header className="flex items-center justify-between">
          <Link href="/onboarding" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-2xl text-white">
            ‹
          </Link>
          <BrandLogo size="sm" />
          <Link href="/home" className="text-sm font-bold text-white/50">Preview</Link>
        </header>

        <div className="flex flex-1 flex-col justify-center sb-fade-up">
          <BrandLogo size="lg" wordmark />

          <h1 className="mt-12 text-[3.35rem] font-black leading-[0.92] tracking-[-0.085em] text-white">
            Enter your Second Brain
          </h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-white/58">
            Save private memories, sync Notion, create tasks, and ask your personal AI workspace.
          </p>

          <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/7 p-4 backdrop-blur-2xl">
            <GoogleLoginCard />
            <p className="mt-4 px-3 text-center text-xs leading-5 text-white/42">
              Google sign-in protects your memory, tasks, and Notion workspace.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
