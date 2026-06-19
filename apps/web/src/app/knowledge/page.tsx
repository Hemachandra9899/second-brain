"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import {
  askKnowledge,
  createKnowledgeItem,
  deleteKnowledgeItem,
  getKnowledgeItems,
  KnowledgeItem,
} from "@/lib/api";

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<any[]>([]);
  const [graphContext, setGraphContext] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadItems() {
    const data = await getKnowledgeItems();
    setItems(data);
  }

  useEffect(() => {
    loadItems().catch(console.error);
  }, []);

  async function saveKnowledge(e: FormEvent) {
    e.preventDefault();

    if (!title.trim() || !rawText.trim()) return;

    await createKnowledgeItem({
      title,
      raw_text: rawText,
      source_type: "note",
    });

    setTitle("");
    setRawText("");
    await loadItems();
  }

  async function removeItem(id: string) {
    await deleteKnowledgeItem(id);
    await loadItems();
  }

  async function ask(e: FormEvent) {
    e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);

    try {
      const res = await askKnowledge(query);
      setAnswer(res.answer);
      setSources(res.sources || []);
      setGraphContext(res.graph_context || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Knowledge">
      <section className="mb-8">
        <h1 className="text-5xl font-semibold tracking-tight">Knowledge Base</h1>
        <p className="mt-3 text-sm text-slate-600">
          Save notes, links, and raw text. Search them with Pinecone + GraphRAG.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <GlassCard>
          <h2 className="mb-4 text-xl font-semibold">Save knowledge</h2>

          <form onSubmit={saveKnowledge} className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm outline-none"
            />

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste note, idea, link summary, meeting notes..."
              className="min-h-40 w-full rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm outline-none"
            />

            <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
              Save and index →
            </button>
          </form>
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 text-xl font-semibold">Ask your memory</h2>

          <form onSubmit={ask} className="space-y-3">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask: What do I know about Notion sync?"
              className="min-h-40 w-full rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm outline-none"
            />

            <button className="w-full rounded-full bg-sky-500 px-5 py-3 text-sm font-medium text-white">
              {loading ? "Thinking..." : "Ask GraphRAG →"}
            </button>
          </form>
        </GlassCard>
      </div>

      {answer ? (
        <GlassCard className="mt-6">
          <h2 className="mb-3 text-xl font-semibold">Answer</h2>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{answer}</p>
        </GlassCard>
      ) : null}

      {graphContext.length ? (
        <GlassCard className="mt-6">
          <h2 className="mb-3 text-xl font-semibold">Graph context</h2>
          <div className="space-y-2">
            {graphContext.map((rel, idx) => (
              <p key={idx} className="text-sm text-slate-600">
                {rel.from} <span className="text-sky-600">--{rel.type}--</span> {rel.to}
              </p>
            ))}
          </div>
        </GlassCard>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <GlassCard key={item.id}>
            <p className="text-xs uppercase tracking-wide text-sky-600">
              {item.source_type}
            </p>
            <h3 className="mt-2 font-semibold">{item.title}</h3>
            <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">
              {item.raw_text}
            </p>

            <button
              onClick={() => removeItem(item.id)}
              className="mt-4 rounded-full bg-rose-100 px-4 py-2 text-xs font-medium text-rose-700"
            >
              Delete
            </button>
          </GlassCard>
        ))}
      </section>
    </AppShell>
  );
}
