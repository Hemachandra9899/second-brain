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
    localStorage.setItem("sb_onboarding_done", "1");

    window.location.href = "/home";
  }

  return (
    <div className="flex w-full justify-center rounded-[1.25rem] bg-white px-5 py-3.5 text-black shadow-[0_18px_60px_rgba(255,255,255,0.1)]">
      <GoogleLogin
        onSuccess={(res) => handleGoogleLogin(res.credential)}
        onError={() => alert("Google login failed")}
        theme="filled_black"
        shape="pill"
        size="large"
        text="continue_with"
        width="310"
      />
    </div>
  );
}
