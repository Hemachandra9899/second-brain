"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { bootstrapNotion } from "@/lib/api";

export default function IntegrationsPage() {
  const [message, setMessage] = useState("");

  async function setupNotion() {
    const res: any = await bootstrapNotion();
    setMessage(res.message || "Notion checked.");
  }

  return (
    <AppShell title="Integrations">
      <section className="mb-8">
        <h1 className="text-5xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-3 text-sm text-slate-600">
          Connect Notion, Pinecone, and NVIDIA for your Second Brain.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <h2 className="text-xl font-semibold">Notion</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sync tasks to your Notion database and pull scheduled tasks back into Second Brain.
          </p>
          <button
            onClick={setupNotion}
            className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
          >
            Check Notion setup
          </button>
        </GlassCard>

        <GlassCard>
          <h2 className="text-xl font-semibold">Pinecone</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Stores semantic embeddings for tasks, notes, Notion pages, and future WhatsApp messages.
          </p>
        </GlassCard>

        <GlassCard>
          <h2 className="text-xl font-semibold">NVIDIA</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Powers chat, summarization, intent detection, and GraphRAG answers.
          </p>
        </GlassCard>

        <GlassCard>
          <h2 className="text-xl font-semibold text-slate-400">WhatsApp / OpenWA</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            WhatsApp input channel — disabled in public demo.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Requires self-hosted OpenWA instance.
          </p>
        </GlassCard>
      </div>

      {message ? (
        <GlassCard className="mt-6">
          <p className="text-sm text-slate-700">{message}</p>
        </GlassCard>
      ) : null}
    </AppShell>
  );
}
