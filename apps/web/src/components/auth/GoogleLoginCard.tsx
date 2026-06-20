"use client";

import { GoogleLogin } from "@react-oauth/google";
import { apiPost } from "@/lib/api";

export function GoogleLoginCard() {
  async function handleGoogleLogin(credential?: string) {
    if (!credential) return;

    const res = await apiPost<{
      access_token: string;
      user: {
        id: string;
        email: string;
        name: string;
        picture?: string;
      };
    }>("/auth/google", { credential });

    localStorage.setItem("second_brain_token", res.access_token);
    localStorage.setItem("second_brain_user", JSON.stringify(res.user));

    window.location.href = "/";
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] bg-white/80 p-8 shadow-xl backdrop-blur">
      <h1 className="text-4xl font-semibold tracking-tight">Second Brain</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Continue with Google to keep your tasks, knowledge, mood, and memory private to you.
      </p>

      <div className="mt-8">
        <GoogleLogin
          onSuccess={(res) => handleGoogleLogin(res.credential)}
          onError={() => alert("Google login failed")}
        />
      </div>
    </div>
  );
}
