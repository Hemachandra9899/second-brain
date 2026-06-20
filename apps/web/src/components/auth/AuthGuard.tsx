"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isSignedIn } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace("/login");
    }
  }, [router]);

  return <>{children}</>;
}
