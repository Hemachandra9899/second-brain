"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { consolidateMemory, getMemoryCards, deleteMemoryCard, MemoryCard } from "@/lib/api";

export default function MemoryPage() {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [consolidating, setConsolidating] = useState(false);

  async function load() {
    try {
      const data = await getMemoryCards();
      setCards(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleConsolidate() {
    setConsolidating(true);
    try {
      await consolidateMemory();
      await load();
    } finally {
      setConsolidating(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteMemoryCard(id);
    await load();
  }

  return (
    <AppShell title="Memory">
      <section className="mb-8">
        <h1 className="text-5xl font-semibold tracking-tight">Memory Cards</h1>
        <p className="mt-3 text-sm text-slate-600">
          Consolidate raw captures into durable long-term memories.
        </p>
      </section>

      <GlassCard className="mb-6">
        <p className="text-sm leading-6 text-slate-600">
          Memory consolidation takes your recent tasks and notes, then uses AI to create clean
          long-term memory cards. Run this periodically.
        </p>

        <button
          onClick={handleConsolidate}
          disabled={consolidating}
          className="mt-4 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {consolidating ? "Consolidating..." : "Consolidate memories →"}
        </button>
      </GlassCard>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <GlassCard key={card.id}>
            <p className="text-xs uppercase tracking-wide text-sky-600">Memory Card</p>
            <h3 className="mt-2 font-semibold">{card.title}</h3>
            <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">{card.summary}</p>

            {card.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {card.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs text-sky-700">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <button
              onClick={() => handleDelete(card.id)}
              className="mt-4 rounded-full bg-rose-100 px-4 py-2 text-xs font-medium text-rose-700"
            >
              Delete
            </button>
          </GlassCard>
        ))}

        {!cards.length ? (
          <GlassCard>
            <p className="text-sm text-slate-600">No memory cards yet. Run consolidation to create them.</p>
          </GlassCard>
        ) : null}
      </section>
    </AppShell>
  );
}
