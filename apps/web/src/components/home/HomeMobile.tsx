"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentActivity, type ActivityEvent } from "@/lib/api";
import { getStoredUser, isSignedIn } from "@/lib/auth";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";

function timeAgo(value?: string | null) {
  if (!value) return "Now";
  const date = new Date(value);
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const topCards = [
  { title: "Ask your Brain", body: "Search memory, tasks, Notion, and projects.", href: "/", tag: "AI", icon: "✦", gradient: "from-cyan-300/28 via-blue-400/10 to-white/5" },
  { title: "Capture thoughts", body: "Save ideas, links, meetings, and reminders.", href: "/capture", tag: "Capture", icon: "+", gradient: "from-teal-300/24 via-cyan-300/10 to-white/5" },
  { title: "Consolidate memory", body: "Create durable cards from raw notes.", href: "/memory", tag: "Memory", icon: "◇", gradient: "from-blue-300/24 via-cyan-300/10 to-white/5" },
];

const rows = [
  {
    title: "Continue building",
    cards: [
      { title: "Create a task", body: "Move a thought into action.", href: "/tasks", tag: "Tasks", icon: "✓" },
      { title: "Connect Notion", body: "Sync pages and todos.", href: "/settings/integrations", tag: "Notion", icon: "▣" },
      { title: "Projects", body: "Group work into spaces.", href: "/projects", tag: "Work", icon: "▤" },
    ],
  },
  {
    title: "Your personal OS",
    cards: [
      { title: "Knowledge base", body: "Search saved knowledge.", href: "/knowledge", tag: "Search", icon: "⌕" },
      { title: "Writing", body: "Clean messy notes.", href: "/writing", tag: "Draft", icon: "✎" },
      { title: "Mood", body: "Track how you feel.", href: "/mood", tag: "Mood", icon: "◐" },
    ],
  },
];

function FeaturePoster({ card, large = false }: { card: { title: string; body: string; href: string; tag: string; icon: string; gradient?: string }; large?: boolean }) {
  return (
    <Link
      href={card.href}
      className={`${large ? "h-[21rem] w-[18.5rem]" : "h-[15.5rem] w-[12.5rem]"} sb-card relative shrink-0 overflow-hidden rounded-[2rem] p-5 transition active:scale-[0.98]`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient || "from-white/13 via-cyan-300/7 to-transparent"}`} />
      <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-cyan-200/12 blur-2xl" />
      <div className="relative flex items-center justify-between">
        <span className="rounded-full bg-black/38 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-100/80">
          {card.tag}
        </span>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-xl text-white">{card.icon}</span>
      </div>
      <div className="relative mt-auto flex h-full flex-col justify-end pb-2">
        <h3 className={`${large ? "text-[2.35rem]" : "text-2xl"} font-black leading-[0.92] tracking-[-0.075em] text-white`}>
          {card.title}
        </h3>
        <p className="mt-3 line-clamp-2 text-sm leading-5 text-white/58">{card.body}</p>
      </div>
    </Link>
  );
}

function ActivityCard({ event }: { event: ActivityEvent }) {
  return (
    <article className="sb-soft-panel min-h-[10.5rem] w-[16rem] shrink-0 rounded-[1.5rem] p-4">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-100/55">
          {event.source_type || event.event_type}
        </span>
        <span className="text-xs text-white/35">{timeAgo(event.created_at)}</span>
      </div>
      <h3 className="mt-8 line-clamp-2 text-xl font-black leading-tight tracking-[-0.04em] text-white">{event.title}</h3>
      {event.description ? <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/45">{event.description}</p> : null}
    </article>
  );
}

export function HomeMobile() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const signedIn = isSignedIn();
  const user = getStoredUser();
  const firstName = user?.name?.split(" ")[0] || "You";

  useEffect(() => {
    getRecentActivity().then(setEvents).catch(() => setEvents([]));
  }, []);

  return (
    <main className="sb-netflix-shell min-h-[100dvh] text-white">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-32 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <header className="flex items-center justify-between">
          <Link href="/home"><BrandLogo size="sm" wordmark /></Link>
          <div className="flex items-center gap-3">
            <Link href="/features" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/8 text-xl backdrop-blur-xl">⌕</Link>
            {user?.picture ? (
              <img src={user.picture} alt="Profile" className="h-12 w-12 rounded-full border border-white/10 object-cover" />
            ) : signedIn ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-200 text-sm font-black text-black">{firstName.charAt(0)}</div>
            ) : (
              <Link href="/login" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black">Sign in</Link>
            )}
          </div>
        </header>

        <section className="pt-12 sb-fade-up">
          <p className="text-xs font-black uppercase tracking-[0.36em] text-cyan-200/75">For {firstName}</p>
          <h1 className="mt-6 text-[4.25rem] font-black leading-[0.88] tracking-[-0.095em] text-white">
            Your personal AI workspace
          </h1>
          <p className="mt-6 max-w-sm text-xl leading-8 text-white/78">
            Capture thoughts, ask your memory, sync Notion, and move ideas into action.
          </p>
        </section>

        <section className="-mx-5 mt-9 overflow-x-auto px-5 pb-5 no-scrollbar sb-card-scroll">
          <div className="flex gap-4">
            {topCards.map((card) => <FeaturePoster key={card.title} card={card} large />)}
          </div>
        </section>

        {rows.map((row) => (
          <section key={row.title} className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-[-0.05em] text-white">{row.title}</h2>
              <Link href="/features" className="text-sm font-bold text-cyan-100/62">See all</Link>
            </div>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-4 no-scrollbar sb-card-scroll">
              {row.cards.map((card) => <FeaturePoster key={card.title} card={card} />)}
            </div>
          </section>
        ))}

        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-[-0.05em] text-white">Recent activity</h2>
            <Link href="/" className="text-sm font-bold text-cyan-100/62">Ask</Link>
          </div>
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-4 no-scrollbar sb-card-scroll">
            {events.slice(0, 8).map((event) => <ActivityCard key={event.id} event={event} />)}
            {!events.length ? (
              <article className="sb-soft-panel min-h-[10.5rem] w-[16rem] shrink-0 rounded-[1.5rem] p-4">
                <span className="rounded-full bg-white/8 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-100/55">Empty</span>
                <h3 className="mt-8 text-xl font-black tracking-[-0.04em] text-white">No activity yet.</h3>
                <p className="mt-2 text-sm leading-5 text-white/45">Capture something or ask your Brain.</p>
              </article>
            ) : null}
          </div>
        </section>
      </div>
      <MobileBottomBar />
    </main>
  );
}
