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
          Connect Notion, Pinecone, NVIDIA, and later WhatsApp/OpenWA.
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
          <h2 className="text-xl font-semibold">WhatsApp / OpenWA</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Connect OpenWA locally and route WhatsApp messages into Second Brain.
          </p>

          <div className="mt-4 rounded-2xl bg-sky-50 p-4 text-xs text-slate-600">
            <p>Webhook URL:</p>
            <code className="break-all">http://host.docker.internal:8000/integrations/whatsapp/webhook</code>
          </div>

          <p className="mt-4 text-sm text-slate-600">
            Use this after OpenWA QR session is connected.
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
