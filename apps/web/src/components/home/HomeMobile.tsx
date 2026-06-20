"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentActivity, type ActivityEvent } from "@/lib/api";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
import { SavedInsightCards } from "@/components/home/SavedInsightCards";

type HomeTab = "recent" | "saved" | "memory";

function formatTime(value?: string | null) {
  if (!value) return "";

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
  if (event.source_type === "writing" && event.source_id) {
    return `/writing/${event.source_id}`;
  }
  if (event.event_type === "tasks_extracted") return "/tasks";
  if (event.source_type === "memory") return "/memory";
  return "/home";
}

function RecentActivityCard({ event }: { event: ActivityEvent }) {
  const href = hrefFor(event);
  const external = href.startsWith("http");

  const content = (
    <article className="flex min-h-[7.5rem] items-center gap-4 rounded-[1.9rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 active:scale-[0.99] dark:bg-zinc-900 dark:ring-white/10">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.4rem] bg-slate-100 text-2xl font-bold text-slate-900 dark:bg-zinc-800 dark:text-white">
        {event.source_type === "notion" ? "N" : "✦"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
          {labelFor(event)}
        </p>

        <h2 className="mt-1 line-clamp-2 text-2xl font-semibold leading-[0.98] tracking-[-0.06em] text-slate-950">
          {event.title}
        </h2>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <span>{event.source_type || "brain"}</span>
          <span>·</span>
          <span>{formatTime(event.created_at)}</span>
        </div>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xl text-blue-600 dark:bg-sky-900/50">
        ›
      </div>
    </article>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return <Link href={href}>{content}</Link>;
}

export function HomeMobile() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [activeTab, setActiveTab] = useState<HomeTab>("recent");
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

  const visibleEvents =
    activeTab === "recent"
      ? events
      : activeTab === "saved"
        ? savedEvents
        : events.filter((event) =>
            ["memory_card_created", "writing_saved"].includes(event.event_type)
          );

  return (
    <main className="min-h-[100dvh] bg-[#f7f7f7] text-slate-950 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-32 pt-12">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-[4.6rem] font-black leading-none tracking-[-0.09em]">
              History
            </h1>

            <div className="mt-6 flex items-center gap-8">
              {[
                ["recent", "Recent", events.length],
                ["saved", "Saved", savedEvents.length],
                ["memory", "Memory", null],
              ].map(([key, label, count]) => {
                const active = activeTab === key;

                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as HomeTab)}
                    className={
                      active
                        ? "text-3xl font-semibold tracking-[-0.07em] text-slate-950"
                        : "text-3xl font-semibold tracking-[-0.07em] text-slate-400"
                    }
                  >
                    {label}
                    {typeof count === "number" ? (
                      <span className="ml-2 rounded-full bg-slate-200 px-2 text-sm tracking-normal text-slate-600">
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <Link
            href="/"
            className="mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-slate-100 dark:bg-zinc-900 dark:ring-white/10"


          >
            ✦
          </Link>
        </header>

        {activeTab === "saved" ? (
          <SavedInsightCards events={savedEvents} />
        ) : null}

        <section className="mt-8 space-y-4">
          {loading ? (
            <div className="rounded-[2rem] bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-white/10">
              Loading your brain…
            </div>
          ) : null}

          {!loading && visibleEvents.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                Empty brain
              </p>

              <h2 className="mt-5 text-4xl font-semibold leading-none tracking-[-0.08em]">
                Start by writing something.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-500 dark:text-zinc-400">
                Capture messy thoughts, clean them, extract tasks, and sync them
                to Notion.
              </p>

              <Link
                href="/writing"
                className="mt-7 inline-flex rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
              >
                New writing →
              </Link>
            </div>
          ) : null}

          {visibleEvents.map((event) => (
            <RecentActivityCard key={event.id} event={event} />
          ))}
        </section>

        <section className="mt-8 rounded-[2.2rem] bg-slate-950 p-6 text-white dark:bg-zinc-900 dark:ring-1 dark:ring-white/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">
            Quick capture
          </p>

          <h2 className="mt-4 text-4xl font-semibold leading-none tracking-[-0.08em]">
            Write anything. I&apos;ll clean it.
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-300">
            Capture messy thoughts, todos, goals, or notes. Second Brain turns
            them into memory and tasks.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <Link
              href="/writing"
              className="rounded-full bg-white px-5 py-4 text-center text-sm font-semibold text-slate-950"
            >
              New writing
            </Link>

            <Link
              href="/"
              className="rounded-full bg-white/10 px-5 py-4 text-center text-sm font-semibold text-white"
            >
              Ask AI
            </Link>
          </div>
        </section>
      </div>

      <MobileBottomBar />
    </main>
  );
}
