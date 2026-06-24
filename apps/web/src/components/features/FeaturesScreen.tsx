"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";

const cards = [
  { title: "Ask AI", body: "Chat with memory, tasks, Notion, and notes.", href: "/", tag: "AI", gradient: "from-cyan-300/30 via-slate-800 to-violet-500/25" },
  { title: "Capture", body: "Paste any idea, task, note, or question.", href: "/capture", tag: "Input", gradient: "from-emerald-300/30 via-slate-800 to-cyan-500/25" },
  { title: "Memory", body: "Consolidate durable long-term memory cards.", href: "/memory", tag: "Recall", gradient: "from-blue-300/30 via-slate-800 to-fuchsia-500/25" },
  { title: "Tasks", body: "Create and complete todos with Notion sync.", href: "/tasks", tag: "Todo", gradient: "from-amber-200/30 via-slate-800 to-cyan-500/25" },
  { title: "Notion", body: "Connect workspace and select task database.", href: "/settings/integrations", tag: "Sync", gradient: "from-violet-300/30 via-slate-800 to-cyan-500/25" },
  { title: "Projects", body: "Organize work into active project spaces.", href: "/projects", tag: "Work", gradient: "from-sky-300/30 via-slate-800 to-emerald-500/25" },
  { title: "Knowledge", body: "Store searchable notes and references.", href: "/knowledge", tag: "KB", gradient: "from-teal-300/30 via-slate-800 to-blue-500/25" },
  { title: "Writing", body: "Clean messy notes into structured output.", href: "/writing", tag: "Draft", gradient: "from-fuchsia-300/25 via-slate-800 to-cyan-500/25" },
];

export function FeaturesScreen() {
  return (
    <AppShell title="Features">
      <section className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.34em] text-cyan-200/70">Everything</p>
        <h1 className="mt-3 text-[2.2rem] font-black leading-[0.96] tracking-[-0.07em] text-white">All features</h1>
        <p className="mt-4 text-sm leading-6 text-white/50">One page for all tools. No extra nav. No old UI.</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className={`min-h-[12rem] rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${card.gradient} p-4 shadow-xl shadow-black/25 active:scale-95`}>
            <span className="rounded-full bg-black/30 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-white/70">{card.tag}</span>
            <h2 className="mt-10 text-2xl font-black leading-[0.95] tracking-[-0.07em] text-white">{card.title}</h2>
            <p className="mt-3 line-clamp-3 text-xs leading-5 text-white/60">{card.body}</p>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
