"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentActivity, type ActivityEvent } from "@/lib/api";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
import { SavedInsightsCarousel } from "@/components/home/SavedInsightsCarousel";

type HomeTab = "overview" | "saved" | "memory";

function formatTime(value?: string | null) {
  if (!value) return "Now";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function labelFor(event: ActivityEvent) {
  if (event.event_type === "notion_page_created") return "Created in Notion";
  if (event.event_type === "writing_saved") return "Writing saved";
  if (event.event_type === "tasks_extracted") return "Tasks extracted";
  if (event.event_type === "memory_card_created") return "Memory saved";
  return "Activity";
}

function hrefFor(event: ActivityEvent) {
  if (event.url) return event.url;
  if (event.source_type === "writing" && event.source_id) return `/writing/${event.source_id}`;
  if (event.event_type === "tasks_extracted") return "/tasks";
  if (event.source_type === "memory") return "/memory";
  return "/home";
}

function StoryRail() {
  const items = [
    { label: "write", href: "/writing", mark: "+" },
    { label: "notion", href: "/settings/integrations", mark: "N" },
    { label: "tasks", href: "/tasks", mark: "\u2713" },
    { label: "memory", href: "/memory", mark: "\u2726" },
  ];

  return (
    <div className="-mx-5 mt-8 flex gap-4 overflow-x-auto px-5 pb-2 no-scrollbar">
      {items.map((item) => (
        <Link key={item.label} href={item.href} className="shrink-0 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white text-2xl font-semibold text-zinc-950 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:text-white dark:ring-white/10">
            {item.mark}
          </div>
          <p className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {item.label}
          </p>
        </Link>
      ))}
    </div>
  );
}

function FeatureGrid() {
  const features = [
    {
      title: "Writing",
      body: "Clean messy thoughts into blocks, todos, and memories.",
      href: "/writing",
    },
    {
      title: "Notion",
      body: "Connect Notion, create pages, and open synced cards.",
      href: "/settings/integrations",
    },
    {
      title: "Tasks",
      body: "Extract tasks, mark done, and sync updates to Notion.",
      href: "/tasks",
    },
    {
      title: "Ask Brain",
      body: "Ask across writing, tasks, memory, and Notion sources.",
      href: "/",
    },
  ];

  return (
    <section className="mt-10">
      <h2 className="font-display text-4xl tracking-[-0.04em] text-zinc-950 dark:text-white">
        Your tools
      </h2>

      <div className="mt-5 grid grid-cols-2 gap-4">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 transition active:scale-[0.98] dark:bg-zinc-900 dark:ring-white/10"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-500">
              Second Brain
            </p>
            <h3 className="font-display mt-4 text-3xl leading-none tracking-[-0.05em] text-zinc-950 dark:text-white">
              {feature.title}
            </h3>
            <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {feature.body}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ActivityCard({ event }: { event: ActivityEvent }) {
  const href = hrefFor(event);
  const external = href.startsWith("http");

  const card = (
    <article className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 transition active:scale-[0.99] dark:bg-zinc-900 dark:ring-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-500">
            {labelFor(event)}
          </p>
          <h3 className="font-display mt-3 text-3xl leading-none tracking-[-0.05em] text-zinc-950 dark:text-white">
            {event.title}
          </h3>
          {event.description ? (
            <p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {event.description}
            </p>
          ) : null}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-50 text-lg font-bold text-zinc-900 dark:bg-zinc-800 dark:text-white">
          {event.source_type === "notion" ? "N" : "\u203A"}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{event.source_type || "brain"}</span>
        <span>{'\u00B7'}</span>
        <span>{formatTime(event.created_at)}</span>
      </div>
    </article>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {card}
      </a>
    );
  }

  return <Link href={href}>{card}</Link>;
}

export function HomeMobile() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [activeTab, setActiveTab] = useState<HomeTab>("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentActivity()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const savedEvents = events.filter((event) =>
    ["notion_page_created", "writing_saved", "memory_card_created"].includes(
      event.event_type
    )
  );

  const memoryEvents = events.filter((event) =>
    ["memory_card_created", "writing_saved"].includes(event.event_type)
  );

  const visibleEvents =
    activeTab === "overview"
      ? events
      : activeTab === "saved"
        ? savedEvents
        : memoryEvents;

  return (
    <main className="min-h-[100dvh] bg-[#f7edf2] text-zinc-950 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-32 pt-12">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-[4.4rem] leading-none tracking-[-0.07em]">
              Home
            </h1>

            <div className="mt-6 flex items-center gap-6">
              {[
                ["overview", "Overview", events.length],
                ["saved", "Saved", savedEvents.length],
                ["memory", "Memory", memoryEvents.length],
              ].map(([key, label, count]) => {
                const active = activeTab === key;

                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as HomeTab)}
                    className={
                      active
                        ? "font-display text-2xl tracking-[-0.04em] text-zinc-950 dark:text-white"
                        : "font-display text-2xl tracking-[-0.04em] text-zinc-400 dark:text-zinc-600"
                    }
                  >
                    {label}
                    <span className="ml-1 rounded-full bg-white/70 px-2 text-xs font-sans text-zinc-500 ring-1 ring-black/5 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-white/10">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Link
            href="/"
            className="mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10"
          >
            {'\u2726'}
          </Link>
        </header>

        <StoryRail />

        {activeTab === "saved" ? (
          <SavedInsightsCarousel events={savedEvents} />
        ) : (
          <>
            <FeatureGrid />

            <section className="mt-10">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-4xl tracking-[-0.04em] text-zinc-950 dark:text-white">
                  Recent activity
                </h2>

                <Link
                  href="/writing"
                  className="text-3xl leading-none text-zinc-950 dark:text-white"
                >
                  +
                </Link>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="rounded-[2rem] bg-white p-6 text-sm text-zinc-500 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
                    {'Loading your brain\u2026'}
                  </div>
                ) : null}

                {!loading && visibleEvents.length === 0 ? (
                  <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-pink-500">
                      Empty brain
                    </p>

                    <h2 className="font-display mt-5 text-4xl leading-none tracking-[-0.05em]">
                      Start by writing something.
                    </h2>

                    <p className="mt-5 text-base leading-7 text-zinc-600 dark:text-zinc-400">
                      Capture messy thoughts, clean them, extract tasks, and sync them to Notion.
                    </p>

                    <Link
                      href="/writing"
                      className="mt-7 inline-flex rounded-full bg-black px-6 py-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
                    >
                      {'New writing \u2192'}
                    </Link>
                  </div>
                ) : null}

                {visibleEvents.map((event) => (
                  <ActivityCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <MobileBottomBar />
    </main>
  );
}
