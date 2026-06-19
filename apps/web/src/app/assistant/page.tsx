"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { PillChip } from "@/components/PillChip";
import { AssistantInputBar } from "@/components/AssistantInputBar";
import { askAssistant } from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AssistantPage() {
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
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong while calling the assistant." },
      ]);
    }
  }

  return (
    <AppShell title="AI Assistant">
      <section className="mb-8 text-center">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-950">
          What should we work on next?
        </h1>
        <p className="mt-3 text-sm text-sky-700">NVIDIA-powered assistant</p>
      </section>

      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
        <PillChip label="Create task" active />
        <PillChip label="Search memory" />
        <PillChip label="Plan today" />
        <PillChip label="Sync Notion" />
      </div>

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

      <AssistantInputBar onSend={send} />
    </AppShell>
  );
}
