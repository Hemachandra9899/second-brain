"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleLoginCard } from "@/components/auth/GoogleLoginCard";
import { isSignedIn } from "@/lib/auth";

export function LoginScreen() {
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn()) {
      router.replace("/assistant");
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-100 to-blue-200 px-6 py-12">
      <GoogleLoginCard />
    </main>
  );
}
