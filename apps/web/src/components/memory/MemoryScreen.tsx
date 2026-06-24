"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { consolidateMemory, getMemoryCards, deleteMemoryCard, MemoryCard } from "@/lib/api";

export function MemoryScreen() {
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
      <section className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.34em] text-cyan-200/70">Recall</p>
        <h1 className="mt-3 text-[2.2rem] font-black leading-[0.96] tracking-[-0.07em] text-white">Memory cards</h1>
        <p className="mt-4 text-sm leading-6 text-white/50">Consolidate raw captures into durable long-term memories.</p>
      </section>

      <GlassCard className="mb-5 bg-gradient-to-br from-blue-300/20 via-white/[0.07] to-cyan-500/20">
        <p className="text-sm leading-6 text-white/60">Run consolidation periodically to clean recent tasks and notes into long-term memory cards.</p>
        <button onClick={handleConsolidate} disabled={consolidating} className="mt-4 w-full rounded-full bg-white px-5 py-3 text-sm font-black text-black disabled:opacity-50">
          {consolidating ? "Consolidating..." : "Consolidate memories →"}
        </button>
      </GlassCard>

      <section className="space-y-3">
        {cards.map((card, index) => (
          <GlassCard key={card.id} className={index % 2 ? "bg-gradient-to-br from-violet-300/10 via-white/[0.07] to-cyan-500/10" : "bg-gradient-to-br from-cyan-300/10 via-white/[0.07] to-emerald-500/10"}>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/75">Memory Card</p>
            <h3 className="mt-3 text-xl font-black leading-tight text-white">{card.title}</h3>
            <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/50">{card.summary}</p>
            {card.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {card.tags.map((tag) => <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100/80">{tag}</span>)}
              </div>
            ) : null}
            <button onClick={() => handleDelete(card.id)} className="mt-4 rounded-full bg-rose-300/20 px-4 py-2 text-xs font-black text-rose-100">Delete</button>
          </GlassCard>
        ))}
        {!cards.length ? <GlassCard><p className="text-sm text-white/50">No memory cards yet. Run consolidation to create them.</p></GlassCard> : null}
      </section>
    </AppShell>
  );
}
