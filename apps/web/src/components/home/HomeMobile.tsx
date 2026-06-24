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

const heroCards = [
  {
    title: "Ask your Brain",
    body: "Search memory, tasks, Notion, writing, and projects from one chat.",
    href: "/",
    tag: "Chat",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Capture thoughts",
    body: "Drop messy ideas and let AI structure them into useful memory.",
    href: "/capture",
    tag: "Capture",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Connect Notion",
    body: "Create pages, todos, and daily plans in your workspace.",
    href: "/settings/integrations",
    tag: "Notion",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
  },
];

const sections = [
  {
    title: "Continue where you left off",
    cards: [
      ["Today Brief", "/", "/today Give me my Today Brief."],
      ["Open Tasks", "/tasks", "Review and complete todos"],
      ["Recent Memory", "/memory", "Search saved thoughts"],
    ],
  },
  {
    title: "Important cards",
    cards: [
      ["Plan my day", "/", "Turn ideas into next actions"],
      ["Write from notes", "/writing", "Clean messy writing"],
      ["Project focus", "/projects", "Move work forward"],
    ],
  },
];

function HeroCard({ card, index }: { card: (typeof heroCards)[number]; index: number }) {
  return (
    <Link
      href={card.href}
      className="relative h-[28rem] w-[19rem] shrink-0 overflow-hidden rounded-[2.1rem] border border-white/10 bg-white/5 shadow-2xl transition active:scale-[0.985]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <img src={card.image} alt="" className="h-full w-full object-cover opacity-75" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
      <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
        <span className="rounded-full bg-black/45 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-100 backdrop-blur">
          {card.tag}
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur">↗</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-[2.25rem] font-semibold leading-[0.92] tracking-[-0.07em] text-white">
          {card.title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-white/62">{card.body}</p>
      </div>
    </Link>
  );
}

function MiniCard({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <Link href={href} className="sb-soft-card h-36 w-40 shrink-0 rounded-[1.6rem] p-4 transition active:scale-[0.98]">
      <div className="mb-7 h-9 w-9 rounded-2xl bg-gradient-to-br from-cyan-200 via-blue-200 to-violet-200" />
      <h3 className="text-base font-semibold tracking-[-0.04em] text-white">{title}</h3>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">{body}</p>
    </Link>
  );
}

function ActivityStoryCard({ event }: { event: ActivityEvent }) {
  return (
    <article className="sb-soft-card min-h-[13rem] w-[17rem] shrink-0 rounded-[1.8rem] p-5">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase text-white/55">
          {event.source_type || event.event_type}
        </span>
        <span className="text-xs text-white/35">{timeAgo(event.created_at)}</span>
      </div>
      <h3 className="mt-10 line-clamp-3 text-2xl font-semibold leading-tight tracking-[-0.05em] text-white">
        {event.title}
      </h3>
      {event.description ? (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/45">{event.description}</p>
      ) : null}
    </article>
  );
}

export function HomeMobile() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const signedIn = isSignedIn();
  const user = getStoredUser();

  useEffect(() => {
    getRecentActivity().then(setEvents).catch(() => setEvents([]));
  }, []);

  return (
    <main className="sb-shell">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-32 pt-[calc(env(safe-area-inset-top)+1.1rem)]">
        <header className="flex items-center justify-between">
          <Link href="/home">
            <BrandLogo size="sm" showText />
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white">
              ⌕
            </Link>
            {signedIn ? (
              <Link href="/settings/integrations" className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-sm font-bold text-white">
                {user?.picture ? <img src={user.picture} alt="Profile" className="h-full w-full object-cover" /> : "••"}
              </Link>
            ) : (
              <Link href="/login" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black">
                Sign in
              </Link>
            )}
          </div>
        </header>

        <section className="pt-10 sb-fade-up">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/75">
            For {user?.name?.split(" ")[0] || "you"}
          </p>
          <h1 className="mt-3 text-[3.55rem] font-semibold leading-[0.9] tracking-[-0.085em] text-white">
            Your personal AI workspace
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-7 text-white/54">
            Capture thoughts, ask your memory, sync Notion, and move ideas into action.
          </p>
        </section>

        {!signedIn ? (
          <section className="mt-7 rounded-[1.8rem] border border-white/10 bg-white/[0.07] p-5">
            <p className="text-lg font-semibold tracking-[-0.04em] text-white">Start with your private account.</p>
            <p className="mt-2 text-sm leading-6 text-white/48">Save memory, connect Notion, and keep everything synced.</p>
            <Link href="/onboarding" className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-black">
              Get started
            </Link>
          </section>
        ) : null}

        <section className="-mx-5 mt-8 flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar sb-card-scroll">
          {heroCards.map((card, index) => <HeroCard key={card.title} card={card} index={index} />)}
        </section>

        {sections.map((section) => (
          <section key={section.title} className="mt-5">
            <h2 className="mb-3 text-[1.35rem] font-semibold tracking-[-0.05em] text-white">{section.title}</h2>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-3 no-scrollbar">
              {section.cards.map(([title, href, body]) => (
                <MiniCard key={title} title={title} href={href} body={body} />
              ))}
            </div>
          </section>
        ))}

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[1.35rem] font-semibold tracking-[-0.05em] text-white">Recent activity</h2>
            <Link href="/" className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/75">Ask</Link>
          </div>

          <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar sb-card-scroll">
            {events.slice(0, 8).map((event) => <ActivityStoryCard key={event.id} event={event} />)}
            {!events.length ? (
              <div className="sb-soft-card min-h-[13rem] w-[17rem] shrink-0 rounded-[1.8rem] p-5">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase text-white/55">Empty</span>
                <h3 className="mt-10 text-2xl font-semibold leading-tight tracking-[-0.05em] text-white">No memory yet.</h3>
                <p className="mt-3 text-sm leading-6 text-white/45">Capture something and it will appear here.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
      <MobileBottomBar />
    </main>
  );
}
