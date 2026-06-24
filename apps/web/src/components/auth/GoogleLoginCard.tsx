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
    localStorage.setItem("second_brain_onboarded", "true");

    window.location.href = "/home";
  }

  return (
    <div className="flex w-full justify-center rounded-[1.2rem] bg-white px-4 py-3 text-black shadow-2xl">
      <GoogleLogin
        onSuccess={(res) => handleGoogleLogin(res.credential)}
        onError={() => alert("Google login failed")}
        theme="outline"
        shape="pill"
        size="large"
        text="continue_with"
        width="310"
      />
    </div>
  );
}
