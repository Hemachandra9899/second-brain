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

  useEffect(() => { load(); }, []);

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
    <AppShell title="Memory cards" eyebrow="Long-term context">
      <section className="-mx-5 mb-6 flex gap-3 overflow-x-auto px-5 pb-3 no-scrollbar sb-card-scroll">
        <GlassCard className="w-[19rem] shrink-0">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100/62">Important</p>
          <h2 className="mt-4 text-3xl font-black leading-none tracking-[-0.07em] text-white">Build clean long-term memory</h2>
          <p className="mt-3 text-sm leading-6 text-white/52">Consolidate recent tasks and notes into durable memory cards.</p>
          <button onClick={handleConsolidate} disabled={consolidating} className="mt-5 w-full rounded-full bg-white px-5 py-3 text-sm font-black text-black disabled:opacity-50">
            {consolidating ? "Consolidating..." : "Consolidate memories →"}
          </button>
        </GlassCard>
        <GlassCard className="w-[15rem] shrink-0">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100/62">Count</p>
          <h2 className="mt-8 text-6xl font-black tracking-[-0.08em] text-white">{cards.length}</h2>
          <p className="mt-2 text-sm text-white/45">saved memory cards</p>
        </GlassCard>
      </section>

      <section className="grid gap-4">
        {cards.map((card) => (
          <GlassCard key={card.id}>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100/62">Memory Card</p>
            <h3 className="mt-3 text-2xl font-black leading-tight tracking-[-0.06em] text-white">{card.title}</h3>
            <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/52">{card.summary}</p>
            {card.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {card.tags.map((tag) => <span key={tag} className="rounded-full bg-cyan-100/14 px-3 py-1 text-xs font-bold text-cyan-100">{tag}</span>)}
              </div>
            ) : null}
            <button onClick={() => handleDelete(card.id)} className="mt-5 rounded-full bg-rose-100/14 px-4 py-2 text-xs font-bold text-rose-100">Delete</button>
          </GlassCard>
        ))}
        {!cards.length ? <GlassCard><p className="text-sm text-white/55">No memory cards yet. Run consolidation to create them.</p></GlassCard> : null}
      </section>
    </AppShell>
  );
}
