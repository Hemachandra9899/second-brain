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
    if (notionStatus === "connected") setNotionMessage("Notion connected successfully!");
    else if (notionStatus === "error") setNotionMessage("Failed to connect Notion. Please try again.");
    else if (notionStatus === "invalid_state") setNotionMessage("Connection expired. Please try again.");
    else if (notionStatus === "token_error") setNotionMessage("Could not exchange token with Notion. Please try again.");
    if (notionStatus) window.history.replaceState({}, "", window.location.pathname);
  }, []);

  return (
    <AppShell title="Notion">
      <section className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.34em] text-cyan-200/70">Sync</p>
        <h1 className="mt-3 text-[2.2rem] font-black leading-[0.96] tracking-[-0.07em] text-white">Integrations</h1>
        <p className="mt-4 text-sm leading-6 text-white/50">Connect your tools to Second Brain.</p>
      </section>

      {notionMessage ? <GlassCard className="mb-5"><p className="text-sm text-white/60">{notionMessage}</p></GlassCard> : null}

      <div className="space-y-3">
        <NotionConnectorCard />
        <GlassCard><h2 className="text-xl font-black">Pinecone</h2><p className="mt-2 text-sm leading-6 text-white/50">Stores semantic embeddings for tasks, notes, and Notion pages.</p></GlassCard>
        <GlassCard><h2 className="text-xl font-black">NVIDIA</h2><p className="mt-2 text-sm leading-6 text-white/50">Powers chat, summarization, intent detection, and GraphRAG answers.</p></GlassCard>
        <GlassCard><h2 className="text-xl font-black text-white/60">WhatsApp / OpenWA</h2><p className="mt-2 text-sm leading-6 text-white/40">WhatsApp input channel — disabled in public demo.</p></GlassCard>
      </div>
    </AppShell>
  );
}
