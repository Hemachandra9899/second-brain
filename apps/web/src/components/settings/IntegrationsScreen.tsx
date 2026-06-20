"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { NotionConnectorCard } from "@/components/settings/NotionConnectorCard";

export function IntegrationsScreen() {
  const [notionMessage, setNotionMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notionStatus = params.get("notion");
    if (notionStatus === "connected") {
      setNotionMessage("Notion connected successfully!");
    } else if (notionStatus === "error") {
      setNotionMessage("Failed to connect Notion. Please try again.");
    } else if (notionStatus === "invalid_state") {
      setNotionMessage("Connection expired. Please try again.");
    } else if (notionStatus === "token_error") {
      setNotionMessage(
        "Could not exchange token with Notion. Please try again."
      );
    }

    if (notionStatus) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);

  return (
    <AppShell title="Integrations">
      <section className="mb-8">
        <h1 className="text-5xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-3 text-sm text-slate-600">
          Connect your tools to Second Brain.
        </p>
      </section>

      {notionMessage ? (
        <GlassCard className="mb-6">
          <p className="text-sm text-slate-700">{notionMessage}</p>
        </GlassCard>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <NotionConnectorCard />

        <GlassCard>
          <h2 className="text-xl font-semibold">Pinecone</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Stores semantic embeddings for tasks, notes, and Notion pages.
          </p>
        </GlassCard>

        <GlassCard>
          <h2 className="text-xl font-semibold">NVIDIA</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Powers chat, summarization, intent detection, and GraphRAG answers.
          </p>
        </GlassCard>

        <GlassCard>
          <h2 className="text-xl font-semibold text-slate-400">
            WhatsApp / OpenWA
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            WhatsApp input channel — disabled in public demo.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Requires self-hosted OpenWA instance.
          </p>
        </GlassCard>
      </div>
    </AppShell>
  );
}
