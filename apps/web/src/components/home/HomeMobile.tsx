"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentActivity, type ActivityEvent } from "@/lib/api";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";

function eventLabel(eventType: string) {
  if (eventType === "notion_page_created") return "Created in Notion";
  if (eventType === "writing_saved") return "Writing saved";
  if (eventType === "tasks_extracted") return "Tasks extracted";
  if (eventType === "memory_card_created") return "Memory saved";
  return "Activity";
}

function eventHref(event: ActivityEvent) {
  if (event.url) return event.url;

  if (event.source_type === "writing" && event.source_id) {
    return "/writing";
  }

  if (event.event_type === "tasks_extracted") {
    return "/tasks";
  }

  if (event.source_type === "memory") {
    return "/memory";
  }

  return "/";
}

function formatTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ActivityCard({ event }: { event: ActivityEvent }) {
  const href = eventHref(event);
  const external = href.startsWith("http");

  const content = (
    <div className="flex min-h-[8.5rem] items-center gap-4 rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 active:scale-[0.99]">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-sky-100 to-white text-3xl">
        {event.event_type === "notion_page_created" ? "N" : "◌"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
          {eventLabel(event.event_type)}
        </p>

        <h2 className="mt-1 text-2xl font-semibold leading-[0.95] tracking-[-0.06em] text-slate-950">
          {event.title}
        </h2>

        {event.description ? (
          <p className="mt-3 line-clamp-1 text-sm text-slate-500">
            {event.description}
          </p>
        ) : null}

        <div className="mt-5 flex items-center gap-3 text-xs text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span>{event.source_type || "second-brain"}</span>
          <span>·</span>
          <span>{formatTime(event.created_at)}</span>
        </div>
      </div>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-2xl text-blue-600">
        ›
      </div>
    </div>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentActivity()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-[100dvh] bg-[#f7f7f7] text-slate-950">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-32 pt-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-[4.2rem] font-black leading-none tracking-[-0.08em]">
              History
            </h1>

            <div className="mt-5 flex items-center gap-5 text-2xl tracking-[-0.06em]">
              <button className="font-medium text-slate-950">
                Recent{" "}
                <span className="rounded-full bg-slate-200 px-2 text-sm">
                  {events.length}
                </span>
              </button>

              <button className="font-medium text-slate-400">
                Saved
              </button>
            </div>
          </div>

          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm"
          >
            ✦
          </Link>
        </header>

        <section className="mt-8 space-y-5">
          {loading ? (
            <div className="rounded-[2rem] bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
              Loading your activity…
            </div>
          ) : null}

          {!loading && events.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                Empty brain
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
                Start by writing something.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Capture messy thoughts, clean them, extract tasks, and sync them
                to Notion.
              </p>

              <Link
                href="/writing"
                className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                New writing →
              </Link>
            </div>
          ) : null}

          {events.map((event) => (
            <ActivityCard key={event.id} event={event} />
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] bg-slate-950 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">
            Quick capture
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
            Write anything. I&apos;ll clean it.
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Capture messy thoughts, todos, goals, or notes. Second Brain turns
            them into memory and tasks.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/writing"
              className="rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950"
            >
              New writing
            </Link>

            <Link
              href="/"
              className="rounded-full bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white"
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
