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
    if (isSignedIn()) {
      router.replace("/");
    }
  }, [router]);

  return (
    <main className="sb-shell flex min-h-[100dvh] items-center justify-center px-5 py-8">
      <Link
        href="/"
        className="fixed left-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white"
      >
        ×
      </Link>

      <section className="w-full max-w-md text-center sb-fade-up">
        <div className="mx-auto flex justify-center">
          <BrandLogo size="lg" />
        </div>

        <h1 className="mt-8 text-5xl font-semibold tracking-[-0.06em] text-white">
          Second Brain
        </h1>

        <p className="mx-auto mt-4 max-w-xs text-base leading-7 sb-muted">
          Sign in to access your local brain, projects, tasks, memory, and daily brief.
        </p>

        <div className="mt-14 space-y-4">
          <GoogleLoginCard />

          <button
            disabled
            className="flex w-full items-center justify-center gap-3 rounded-full bg-white/10 px-5 py-4 text-base font-semibold text-white/70"
          >
            ✉ Sign in with Email
          </button>

          <button
            disabled
            className="w-full rounded-full px-5 py-4 text-base font-semibold text-white/35"
          >
            Single sign-on (SSO)
          </button>
        </div>

        <div className="mt-28 flex justify-between px-6 text-sm text-white/42">
          <span>Privacy policy</span>
          <span>Terms of service</span>
        </div>
      </section>
    </main>
  );
}
