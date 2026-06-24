"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
import { getStoredUser, isSignedIn } from "@/lib/auth";
import {
  getRecentActivity,
  getTasks,
  getTodayBrief,
  type ActivityEvent,
  type Task,
  type TodayBrief,
} from "@/lib/api";

const gradients = [
  "from-cyan-300/30 via-slate-800 to-violet-500/25",
  "from-emerald-300/30 via-slate-800 to-cyan-500/25",
  "from-blue-300/30 via-slate-800 to-fuchsia-500/25",
  "from-amber-200/30 via-slate-800 to-cyan-500/25",
];

const featureCards = [
  { title: "Ask your Brain", body: "Chat with tasks, memory, Notion, projects, and notes.", href: "/", tag: "AI" },
  { title: "Capture thoughts", body: "Save messy ideas and route them into tasks or memory.", href: "/capture", tag: "Capture" },
  { title: "Memory cards", body: "Review durable long-term facts created from your activity.", href: "/memory", tag: "Memory" },
  { title: "Tasks", body: "Create, complete, and sync your todos with Notion.", href: "/tasks", tag: "Todo" },
  { title: "Notion", body: "Connect workspace, choose database, and sync pages.", href: "/settings/integrations", tag: "Sync" },
];

function firstName(name?: string | null) {
  return name?.split(" ").filter(Boolean)[0] || "you";
}

function TopCard({ label, title, body, index }: { label: string; title: string; body?: string | null; index: number }) {
  return (
    <article className={`relative min-h-[14.5rem] w-[82%] shrink-0 snap-start overflow-hidden rounded-[2.1rem] border border-white/10 bg-gradient-to-br ${gradients[index % gradients.length]} p-5 shadow-[0_28px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl`}>
      <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
      <p className="relative inline-flex rounded-full bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em] text-cyan-100/90">
        {label}
      </p>
      <h3 className="relative mt-10 line-clamp-3 text-[2.15rem] font-black leading-[0.92] tracking-[-0.07em] text-white">
        {title}
      </h3>
      {body ? <p className="relative mt-4 line-clamp-2 text-sm leading-6 text-white/70">{body}</p> : null}
    </article>
  );
}

export function HomeMobile() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [brief, setBrief] = useState<TodayBrief | null>(null);
  const user = getStoredUser();
  const signedIn = isSignedIn();
  const name = firstName(user?.name);

  useEffect(() => {
    getTasks().then(setTasks).catch(() => setTasks([]));
    getRecentActivity().then(setEvents).catch(() => setEvents([]));
    getTodayBrief().then(setBrief).catch(() => setBrief(null));
  }, []);

  const topCards = useMemo(() => {
    const cards: { label: string; title: string; body?: string | null }[] = [];

    if (brief?.suggested_next_action?.title) {
      cards.push({ label: "Next action", title: brief.suggested_next_action.title, body: brief.suggested_next_action.reason });
    }

    const openTasks = [...(brief?.today_tasks || []), ...tasks].filter((task) => (task.status || "").toLowerCase() !== "done");
    openTasks.slice(0, 3).forEach((task, index) => {
      cards.push({ label: index === 0 ? "Top todo" : "Todo", title: task.title, body: task.description || task.due_date || task.priority });
    });

    if (brief?.recent_memories?.[0]) {
      cards.push({ label: "Memory", title: brief.recent_memories[0].title, body: brief.recent_memories[0].summary });
    }

    if (events[0]) {
      cards.push({ label: "Recent", title: events[0].title, body: events[0].description });
    }

    if (!cards.length) {
      cards.push(
        { label: "Start", title: "Ask your Brain anything", body: "Search memory, create tasks, or plan the day." },
        { label: "Capture", title: "Save one important thought", body: "Turn it into a task, note, or memory card." },
        { label: "Notion", title: "Connect your workspace", body: "Sync tasks and pages without leaving Second Brain." }
      );
    }

    return cards.slice(0, 6);
  }, [brief, tasks, events]);

  const visibleTasks = tasks.length ? tasks.slice(0, 8) : brief?.today_tasks?.slice(0, 8) || [];

  return (
    <main className="sb-shell min-h-[100dvh] text-white">
      <div className="mx-auto min-h-[100dvh] w-full max-w-md overflow-hidden pb-28 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <header className="flex items-center justify-between px-5">
          <Link href="/home" className="flex items-center gap-3 active:scale-95">
            <BrandLogo size="sm" />
            <div>
              <p className="text-sm font-black tracking-[-0.03em] text-white">Second Brain</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.32em] text-cyan-200/60">For {name}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-lg text-white active:scale-95">
              ⌕
            </Link>
            {signedIn && user?.picture ? (
              <img src={user.picture} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-white/10" />
            ) : (
              <Link href="/login" className="rounded-full bg-white px-4 py-3 text-xs font-black text-black">Sign in</Link>
            )}
          </div>
        </header>

        <section className="px-5 pt-8">
          <p className="text-[11px] font-black uppercase tracking-[0.34em] text-cyan-200/70">Today</p>
          <h1 className="mt-3 max-w-[19rem] text-[2rem] font-black leading-[0.98] tracking-[-0.07em] text-white">
            Your personal AI workspace.
          </h1>
          <p className="mt-4 max-w-xs text-[15px] leading-6 text-white/60">
            Top thoughts, todos, memory, and features in one clean place.
          </p>
        </section>

        <section className="mt-7">
          <div className="mb-3 flex items-center justify-between px-5">
            <h2 className="text-lg font-black tracking-[-0.04em] text-white">Top thoughts</h2>
            <span className="text-xs font-bold text-white/40">Swipe</span>
          </div>
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 no-scrollbar">
            {topCards.map((card, index) => (
              <TopCard key={`${card.label}-${index}`} {...card} index={index} />
            ))}
          </div>
        </section>

        <section className="mt-2">
          <div className="mb-3 flex items-center justify-between px-5">
            <h2 className="text-lg font-black tracking-[-0.04em] text-white">Features</h2>
            <Link href="/features" className="text-xs font-black text-cyan-200/75">View all</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 pb-5 no-scrollbar">
            {featureCards.map((card, index) => (
              <Link
                key={card.title}
                href={card.href}
                className={`min-h-[11.5rem] w-[10.5rem] shrink-0 rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${gradients[(index + 1) % gradients.length]} p-4 shadow-xl shadow-black/25 active:scale-95`}
              >
                <span className="rounded-full bg-black/30 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-white/75">{card.tag}</span>
                <h3 className="mt-9 text-2xl font-black leading-[0.95] tracking-[-0.07em] text-white">{card.title}</h3>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/60">{card.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-5 mt-1 rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black tracking-[-0.04em] text-white">Tasks</h2>
            <Link href="/tasks" className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white/70">Open</Link>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1 no-scrollbar">
            {visibleTasks.length ? visibleTasks.map((task) => (
              <article key={task.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <p className="line-clamp-2 text-sm font-black leading-5 text-white">{task.title}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-white/40">
                  <span>{task.status || "Todo"}</span>
                  <span>•</span>
                  <span>{task.due_date ? `Due ${task.due_date}` : task.priority || "Normal"}</span>
                </div>
              </article>
            )) : (
              <p className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white/48">No tasks yet. Capture a thought or ask AI to create one.</p>
            )}
          </div>
        </section>
      </div>

      <MobileBottomBar />
    </main>
  );
}
