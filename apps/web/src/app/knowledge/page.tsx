"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { askKnowledge } from "@/lib/api";

export default function KnowledgePage() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);

    try {
      const res = await askKnowledge(query);
      setAnswer(res.answer);
      setSources(res.sources || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Knowledge">
      <section className="mb-8">
        <h1 className="text-5xl font-semibold tracking-tight">Knowledge Base</h1>
        <p className="mt-3 text-sm text-slate-600">
          Search tasks, Notion items, notes, and memory using Pinecone + GraphRAG.
        </p>
      </section>

      <GlassCard className="mb-6">
        <form onSubmit={submit} className="space-y-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask: What should I work on today?"
            className="min-h-28 w-full rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm outline-none"
          />

          <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
            {loading ? "Thinking..." : "Ask knowledge base →"}
          </button>
        </form>
      </GlassCard>

      {answer ? (
        <GlassCard className="mb-6">
          <h2 className="mb-3 text-xl font-semibold">Answer</h2>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{answer}</p>
        </GlassCard>
      ) : null}

      {sources.length ? (
        <section className="grid gap-4 md:grid-cols-2">
          {sources.map((source, idx) => (
            <GlassCard key={idx}>
              <p className="text-xs uppercase tracking-wide text-sky-600">
                {source.source_type}
              </p>
              <h3 className="mt-2 font-semibold">{source.title}</h3>
              <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">
                {source.text}
              </p>
            </GlassCard>
          ))}
        </section>
      ) : null}
    </AppShell>
  );
}
