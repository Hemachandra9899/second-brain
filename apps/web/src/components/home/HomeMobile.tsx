"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentActivity, type ActivityEvent } from "@/lib/api";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
import { DreamModeCard } from "@/components/home/DreamModeCard";
import { BrainMapCard } from "@/components/home/BrainMapCard";
import { LocalBrainCard } from "@/components/home/LocalBrainCard";
import { LocalBrainGraphCard } from "@/components/home/LocalBrainGraphCard";
import { BrainActionsCard } from "@/components/home/BrainActionsCard";
import { BrainProjectSuggestionsCard } from "@/components/home/BrainProjectSuggestionsCard";
import { DailyCommandCenter } from "@/components/home/DailyCommandCenter";

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
  if (event.event_type === "notion_page_created") return "Notion";
  if (event.event_type === "writing_saved") return "Writing";
  if (event.event_type === "tasks_extracted") return "Tasks";
  if (event.event_type === "memory_card_created") return "Memory";
  if (event.event_type === "dream_created") return "Dream";
  if (event.event_type === "instagram_imported") return "Instagram";
  return "Activity";
}

function hrefFor(event: ActivityEvent) {
  if (event.url) return event.url;
  if (event.source_type === "writing" && event.source_id) return `/writing/${event.source_id}`;
  if (event.event_type === "tasks_extracted") return "/tasks";
  if (event.source_type === "memory") return "/memory";
  return "/home";
}

function QuickActions() {
  const actions = [
    { label: "Write", href: "/writing", mark: "+" },
    { label: "Notion", href: "/settings/integrations", mark: "N" },
    { label: "Tasks", href: "/tasks", mark: "\u2713" },
    { label: "Instagram", href: "/imports/instagram", mark: "IG" },
  ];

  return (
    <section className="-mx-5 mt-8 flex gap-4 overflow-x-auto px-5 pb-2 no-scrollbar">
      {actions.map((item) => (
        <Link key={item.label} href={item.href} className="shrink-0 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-white text-xl font-bold text-blue-600 shadow-sm ring-1 ring-blue-100 dark:bg-zinc-900 dark:ring-white/10">
            {item.mark}
          </div>

          <p className="mt-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {item.label}
          </p>
        </Link>
      ))}
    </section>
  );
}

function FeatureCard({
  title,
  body,
  href,
}: {
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-blue-100 transition active:scale-[0.98] dark:bg-zinc-900 dark:ring-white/10"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
        Second Brain
      </p>

      <h3 className="font-display mt-4 text-3xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
        {title}
      </h3>

      <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {body}
      </p>
    </Link>
  );
}

function ActivityCard({ event }: { event: ActivityEvent }) {
  const href = hrefFor(event);
  const external = href.startsWith("http");

  const card = (
    <article className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-blue-100 transition active:scale-[0.99] dark:bg-zinc-900 dark:ring-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
            {labelFor(event)}
          </p>

          <h3 className="font-display mt-3 text-3xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
            {event.title}
          </h3>

          {event.description ? (
            <p className="mt-4 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {event.description}
            </p>
          ) : null}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-600 dark:bg-zinc-800">
          {'\u203A'}
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

function SavedInsightsPreview({ events }: { events: ActivityEvent[] }) {
  const cards = events.slice(0, 3);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-4xl tracking-[-0.04em] text-zinc-950 dark:text-white">
          Saved insights
        </h2>

        <Link href="/" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          Ask
        </Link>
      </div>

      <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-3 no-scrollbar">
        {(cards.length ? cards : [
          {
            id: "empty",
            title: "No saved insights yet",
            description: "Create writing blocks, Notion pages, or imports. They\u2019ll appear here.",
            event_type: "empty",
            source_type: "brain",
            source_id: null,
            url: "/writing",
            created_at: null,
            metadata: {},
          } as ActivityEvent,
        ]).map((event) => (
          <Link
            key={event.id}
            href={hrefFor(event)}
            className="min-h-[18rem] w-[18rem] shrink-0 snap-center rounded-[2.2rem] bg-white p-6 shadow-sm ring-1 ring-blue-100 dark:bg-zinc-900 dark:ring-white/10"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              {labelFor(event)}
            </p>

            <h3 className="font-display mt-8 text-4xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
              {event.title}
            </h3>

            {event.description ? (
              <p className="mt-5 line-clamp-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {event.description}
              </p>
            ) : null}

            <span className="mt-7 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black">
              {'Open \u2192'}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomeMobile() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentActivity()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const savedEvents = events.filter((event) =>
    ["notion_page_created", "writing_saved", "memory_card_created", "dream_created", "instagram_imported"].includes(
      event.event_type
    )
  );

  return (
    <main className="min-h-[100dvh] bg-blue-50 text-zinc-950 transition-colors dark:bg-[#050505] dark:text-white">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-32 pt-12">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
              Second Brain
            </p>

            <h1 className="font-display mt-3 text-5xl leading-none tracking-[-0.05em] text-zinc-950 dark:text-white">
              Your day, cleaned.
            </h1>
          </div>

          <Link
            href="/"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-blue-600 shadow-sm ring-1 ring-blue-100 dark:bg-zinc-900 dark:ring-white/10"
          >
            {'\u2726'}
          </Link>
        </header>

        <DailyCommandCenter />

        <LocalBrainCard />

        <LocalBrainGraphCard />

        <BrainActionsCard />

        <BrainProjectSuggestionsCard />

        <QuickActions />

        <section className="mt-10 grid grid-cols-2 gap-4">
          <FeatureCard
            title="Writing"
            body="Clean messy thoughts into tasks and memory."
            href="/writing"
          />

          <FeatureCard
            title="Notion"
            body="Create pages, sync todos, and open cards."
            href="/settings/integrations"
          />

          <FeatureCard
            title="Tasks"
            body="Track work and mark things done."
            href="/tasks"
          />

          <FeatureCard
            title="Ask Brain"
            body="Ask across writing, tasks, Notion, and imports."
            href="/"
          />
        </section>

        <DreamModeCard />

        <BrainMapCard />

        <SavedInsightsPreview events={savedEvents} />

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-4xl tracking-[-0.04em] text-zinc-950 dark:text-white">
              Recent activity
            </h2>

            <Link href="/writing" className="text-3xl text-blue-600">
              +
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-[2rem] bg-white p-6 text-sm text-zinc-500 shadow-sm ring-1 ring-blue-100 dark:bg-zinc-900 dark:ring-white/10">
                {'Loading your brain\u2026'}
              </div>
            ) : null}

            {!loading && events.length === 0 ? (
              <div className="rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-blue-100 dark:bg-zinc-900 dark:ring-white/10">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                  Empty brain
                </p>

                <h2 className="font-display mt-5 text-4xl leading-none tracking-[-0.04em]">
                  Start by writing something.
                </h2>

                <p className="mt-5 text-base leading-7 text-zinc-600 dark:text-zinc-400">
                  Capture messy thoughts, clean them, extract tasks, and sync them to Notion.
                </p>

                <Link
                  href="/writing"
                  className="mt-7 inline-flex rounded-full bg-blue-600 px-6 py-4 text-sm font-semibold text-white"
                >
                  {'New writing \u2192'}
                </Link>
              </div>
            ) : null}

            {events.map((event) => (
              <ActivityCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      </div>

      <MobileBottomBar />
    </main>
  );
}
