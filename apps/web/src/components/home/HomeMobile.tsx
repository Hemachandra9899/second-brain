"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentActivity, type ActivityEvent } from "@/lib/api";
import { getStoredUser, isSignedIn } from "@/lib/auth";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
import { DailyCommandCenter } from "@/components/home/DailyCommandCenter";
import { BrainInboxCard } from "@/components/home/BrainInboxCard";
import { BrainActionsCard } from "@/components/home/BrainActionsCard";
import { BrainTimelineCard } from "@/components/home/BrainTimelineCard";

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

const featureCards = [
  {
    title: "Ask Brain",
    body: "Chat with your tasks, memory, Notion, projects, and writing.",
    href: "/",
    tag: "AI",
  },
  {
    title: "Brain Inbox",
    body: "Dump thoughts, review AI drafts, then save clean items.",
    href: "/home#inbox",
    tag: "Capture",
  },
  {
    title: "Projects",
    body: "Turn connected tasks and notes into focused workspaces.",
    href: "/projects",
    tag: "Work",
  },
  {
    title: "Notion",
    body: "Create pages, sync todos, and connect your workspace.",
    href: "/settings/integrations",
    tag: "Sync",
  },
  {
    title: "Writing",
    body: "Clean messy notes into structured blocks and tasks.",
    href: "/writing",
    tag: "Draft",
  },
];

function FeatureStoryCard({
  card,
  index,
}: {
  card: (typeof featureCards)[number];
  index: number;
}) {
  return (
    <Link
      href={card.href}
      className="sb-card min-h-[18rem] w-[17rem] shrink-0 rounded-[2rem] p-5 transition duration-300 active:scale-[0.98]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white/70">
          {card.tag}
        </span>

        <span className="text-xl text-white/35">↗</span>
      </div>

      <div className="mt-16">
        <h3 className="text-3xl font-semibold leading-none tracking-[-0.05em] text-white">
          {card.title}
        </h3>

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/58">
          {card.body}
        </p>
      </div>
    </Link>
  );
}

function ActivityStoryCard({ event }: { event: ActivityEvent }) {
  return (
    <article className="sb-soft-card min-h-[15rem] w-[16rem] shrink-0 rounded-[2rem] p-5">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase text-white/55">
          {event.source_type || event.event_type}
        </span>

        <span className="text-xs text-white/35">{timeAgo(event.created_at)}</span>
      </div>

      <h3 className="mt-12 line-clamp-3 text-2xl font-semibold leading-tight tracking-[-0.04em] text-white">
        {event.title}
      </h3>

      {event.description ? (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/48">
          {event.description}
        </p>
      ) : null}
    </article>
  );
}

export function HomeMobile() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const signedIn = isSignedIn();
  const user = getStoredUser();

  useEffect(() => {
    getRecentActivity()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  return (
    <main className="sb-shell">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-32 pt-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="sm" />

            <div>
              <p className="text-sm font-semibold tracking-[-0.03em] text-white">
                Second Brain
              </p>
              <p className="text-xs text-white/38">Personal AI OS</p>
            </div>
          </Link>

          {signedIn ? (
            <Link
              href="/settings/integrations"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10 text-sm font-semibold text-white"
            >
              {user?.picture ? (
                <img src={user.picture} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                "••"
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Sign in
            </Link>
          )}
        </header>

        <section className="pt-12 sb-fade-up">
          <h1 className="text-[3.4rem] font-semibold leading-[0.92] tracking-[-0.075em] text-white">
            What should your brain work on?
          </h1>

          <p className="mt-5 max-w-sm text-base leading-7 text-white/54">
            Capture thoughts, review memory, ask questions, and turn loose ideas into action.
          </p>

          {!signedIn ? (
            <div className="mt-7 rounded-[1.7rem] bg-white p-5 text-black">
              <p className="text-base font-semibold">Sign in to save your brain.</p>
              <p className="mt-2 text-sm leading-6 text-black/58">
                Your tasks, memory, projects, and Notion sync need a private account.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
              >
                Continue
              </Link>
            </div>
          ) : null}
        </section>

        <section className="-mx-5 mt-8 flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
          {["For You", "Today", "Memory", "Projects", "Notion"].map((chip, index) => (
            <button
              key={chip}
              className={
                index === 0
                  ? "shrink-0 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"
                  : "sb-chip shrink-0 rounded-full px-5 py-3 text-sm font-semibold"
              }
            >
              {chip}
            </button>
          ))}
        </section>

        <section className="-mx-5 mt-6 flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar sb-card-scroll">
          {featureCards.map((card, index) => (
            <FeatureStoryCard key={card.title} card={card} index={index} />
          ))}
        </section>

        {signedIn ? (
          <>
            <DailyCommandCenter />

            <div id="inbox">
              <BrainInboxCard />
            </div>

            <BrainActionsCard />

            <BrainTimelineCard />
          </>
        ) : null}

        <section className="mt-9">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
              Memory stories
            </h2>

            <Link href="/" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              Ask
            </Link>
          </div>

          <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar sb-card-scroll">
            {(events.length ? events : []).slice(0, 8).map((event) => (
              <ActivityStoryCard key={event.id} event={event} />
            ))}

            {!events.length ? (
              <div className="sb-soft-card min-h-[15rem] w-[16rem] shrink-0 rounded-[2rem] p-5">
                <p className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase text-white/55">
                  Empty
                </p>

                <h3 className="mt-14 text-2xl font-semibold leading-tight tracking-[-0.04em] text-white">
                  No memory stories yet.
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/48">
                  Capture something and it will appear here.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <MobileBottomBar />
    </main>
  );
}
