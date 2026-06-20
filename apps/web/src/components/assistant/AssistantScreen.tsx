"use client";

import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { PillChip } from "@/components/PillChip";
import { AssistantInputBar } from "@/components/AssistantInputBar";
import { askAssistant, apiPost } from "@/lib/api";
import { useMoodTheme } from "@/hooks/useMoodTheme";
import { isSignedIn } from "@/lib/auth";

const chips = [
  "Plan my day",
  "Capture idea",
  "Search memory",
  "Create task",
  "Summarize knowledge",
];

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AssistantScreen() {
  const { setMood } = useMoodTheme();
  const [signedIn, setSignedIn] = useState(isSignedIn());
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey, I am ready. Ask me about your tasks, Notion, or knowledge base.",
    },
  ]);

  async function send(message: string) {
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    try {
      const res = await askAssistant(message);
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer }]);
      if (res.mood) {
        setMood(message);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong while calling the assistant." },
      ]);
    }
  }

  function handleChip(label: string) {
    send(label);
  }

  async function handleGoogleLogin(credential?: string) {
    if (!credential) return;

    const res = await apiPost<{
      access_token: string;
      user: { id: string; email: string; name: string; picture?: string };
    }>("/auth/google", { credential });

    localStorage.setItem("second_brain_token", res.access_token);
    localStorage.setItem("second_brain_user", JSON.stringify(res.user));
    setSignedIn(true);
  }

  return (
    <AppShell>
      <section className="mb-8 text-center">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-950">
          Ready to organize your second brain?
        </h1>
        <p className="mt-3 text-sm text-sky-700">NVIDIA-powered assistant</p>
      </section>

      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
        {chips.map((label) => (
          <div key={label} onClick={() => handleChip(label)}>
            <PillChip label={label} />
          </div>
        ))}
      </div>

      {!signedIn && (
        <GlassCard className="mb-6 border border-sky-100">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-medium text-slate-900">Sign in to save your memory</p>
              <p className="mt-1 text-xs text-slate-500">
                Sign in with Google to save your tasks, memories, mood, and graph.
              </p>
            </div>
            <GoogleLogin
              onSuccess={(res) => handleGoogleLogin(res.credential)}
              onError={() => alert("Google login failed")}
            />
          </div>
        </GlassCard>
      )}

      <div className="space-y-4 pb-36 md:pb-8">
        {messages.map((msg, idx) => (
          <GlassCard
            key={idx}
            className={msg.role === "user" ? "ml-8 bg-sky-500/90 text-white" : "mr-8"}
          >
            <p className="text-sm leading-6">{msg.content}</p>
          </GlassCard>
        ))}
      </div>

      <AssistantInputBar onSend={send} placeholder="Ask, capture, or plan anything..." />
    </AppShell>
  );
}
