"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentActivity, type ActivityEvent } from "@/lib/api";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";

type HomeTab = "home" | "saved" | "memory";

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

function SummaryCard({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 transition active:scale-[0.99] dark:bg-zinc-900 dark:ring-white/10"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
        Second Brain
      </p>

      <h3 className="mt-3 text-3xl font-semibold leading-none tracking-[-0.07em] text-slate-950 dark:text-white">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-zinc-400">
        {subtitle}
      </p>
    </Link>
  );
}

function ActivityCard({ event }: { event: ActivityEvent }) {
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

        <h2 className="mt-1 line-clamp-2 text-2xl font-semibold leading-[0.98] tracking-[-0.06em] text-slate-950 dark:text-white">
          {event.title}
        </h2>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
          <span>{event.source_type || "brain"}</span>
          <span>·</span>
          <span>{formatTime(event.created_at)}</span>
        </div>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xl text-blue-600 dark:bg-zinc-800">
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

function SavedInsightsStack({ events }: { events: ActivityEvent[] }) {
  const cards = events.slice(0, 3);

  if (!cards.length) {
    return (
      <div className="rounded-[2.2rem] bg-white p-7 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-white/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
          Saved Insights
        </p>

        <h2 className="mt-5 text-4xl font-semibold leading-none tracking-[-0.08em] text-slate-950 dark:text-white">
          No saved insights yet.
        </h2>

        <p className="mt-5 text-base leading-7 text-slate-500 dark:text-zinc-400">
          Create writing blocks, tasks, or Notion pages. They'll show here as
          swipeable cards.
        </p>

        <Link
          href="/writing"
          className="mt-7 inline-flex rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
        >
          Create new →
        </Link>
      </div>
    );
  }

  return (
    <section className="mt-8">
      <div className="text-center">
        <h2 className="text-5xl font-semibold tracking-[-0.08em] text-slate-950 dark:text-white">
          Saved Insights
        </h2>

        <div className="mt-5 flex justify-center gap-3">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10">
            Writing
          </span>

          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10">
            Notion
          </span>
        </div>
      </div>

      <div className="relative mt-10 h-[30rem]">
        {cards.map((event, index) => {
          const href = hrefFor(event);
          const external = href.startsWith("http");

          const card = (
            <article
              className="absolute left-0 right-0 mx-auto rounded-[2.2rem] bg-white p-6 shadow-xl ring-1 ring-slate-200 transition dark:bg-zinc-900 dark:ring-white/10"
              style={{
                top: `${index * 18}px`,
                transform: `scale(${1 - index * 0.045})`,
                zIndex: 10 - index,
                opacity: 1 - index * 0.16,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-lg font-bold text-sky-700 dark:bg-zinc-800">
                    {event.source_type === "notion" ? "N" : "✦"}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">
                      {labelFor(event)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                      {formatTime(event.created_at)}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-zinc-800 dark:text-zinc-300">
                  {event.source_type || "brain"}
                </span>
              </div>

              <h3 className="mt-8 text-4xl font-semibold leading-[1.05] tracking-[-0.07em] text-slate-950 dark:text-white">
                {event.title}
              </h3>

              {event.description ? (
                <p className="mt-5 line-clamp-4 text-base leading-7 text-slate-600 dark:text-zinc-400">
                  {event.description}
                </p>
              ) : null}

              <div className="mt-8">
                <span className="inline-flex rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                  Open →
                </span>
              </div>
            </article>
          );

          if (external) {
            return (
              <a key={event.id} href={href} target="_blank" rel="noreferrer">
                {card}
              </a>
            );
          }

          return (
            <Link key={event.id} href={href}>
              {card}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function HomeMobile() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [activeTab, setActiveTab] = useState<HomeTab>("home");
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
    activeTab === "home"
      ? events
      : activeTab === "saved"
        ? savedEvents
        : memoryEvents;

  return (
    <main className="min-h-[100dvh] bg-[#f7f7f7] text-slate-950 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-32 pt-12">
        <header>
          <h1 className="text-[4.2rem] font-black leading-none tracking-[-0.09em]">
            Home
          </h1>

          <div className="mt-6 flex items-center gap-7">
            {[
              ["home", "Overview", events.length],
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
                      ? "text-3xl font-semibold tracking-[-0.07em] text-slate-950 dark:text-white"
                      : "text-3xl font-semibold tracking-[-0.07em] text-slate-400 dark:text-zinc-600"
                  }
                >
                  {label}
                  <span className="ml-2 rounded-full bg-slate-200 px-2 text-sm tracking-normal text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        {activeTab === "saved" ? (
          <SavedInsightsStack events={savedEvents} />
        ) : (
          <>
            <section className="mt-8 grid gap-4">
              <SummaryCard
                title="Ask your brain"
                subtitle="Search writing, tasks, Notion pages, and memories with source cards."
                href="/"
              />

              <SummaryCard
                title="Write anything"
                subtitle="Capture messy thoughts and clean them into tasks and memory."
                href="/writing"
              />
            </section>

            <section className="mt-8 space-y-4">
              {loading ? (
                <div className="rounded-[2rem] bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-900 dark:ring-white/10">
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
                    Capture messy thoughts, clean them, extract tasks, and sync
                    them to Notion.
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
                <ActivityCard key={event.id} event={event} />
              ))}
            </section>
          </>
        )}
      </div>

      <MobileBottomBar />
    </main>
  );
}
