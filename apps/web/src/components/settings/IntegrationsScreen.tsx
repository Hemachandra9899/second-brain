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
    <AppShell title="Integrations" eyebrow="Connect tools">
      {notionMessage ? <GlassCard className="mb-6"><p className="text-sm text-white/65">{notionMessage}</p></GlassCard> : null}
      <div className="grid gap-4">
        <NotionConnectorCard />
        <GlassCard><h2 className="text-xl font-black text-white">Pinecone</h2><p className="mt-2 text-sm leading-6 text-white/52">Stores semantic embeddings for tasks, notes, and Notion pages.</p></GlassCard>
        <GlassCard><h2 className="text-xl font-black text-white">NVIDIA</h2><p className="mt-2 text-sm leading-6 text-white/52">Powers chat, summarization, intent detection, and GraphRAG answers.</p></GlassCard>
        <GlassCard><h2 className="text-xl font-black text-white/65">WhatsApp / OpenWA</h2><p className="mt-2 text-sm leading-6 text-white/42">WhatsApp input channel — disabled in public demo.</p><p className="mt-2 text-xs text-white/35">Requires self-hosted OpenWA instance.</p></GlassCard>
      </div>
    </AppShell>
  );
}
