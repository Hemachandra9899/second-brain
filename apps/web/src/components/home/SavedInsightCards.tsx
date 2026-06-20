"use client";

import Link from "next/link";
import type { ActivityEvent } from "@/lib/api";

function fallbackCards() {
  return [
    {
      id: "empty-writing",
      title: "Write anything",
      description:
        "Capture messy thoughts, todos, goals, or notes. I'll clean them into useful memory.",
      source_type: "writing",
      url: "/writing",
      event_type: "writing_prompt",
    },
    {
      id: "empty-memory",
      title: "Build your memory",
      description:
        "Saved notes, tasks, Notion pages, and writing blocks will appear here as cards.",
      source_type: "memory",
      url: "/memory",
      event_type: "memory_prompt",
    },
  ] as ActivityEvent[];
}

export function SavedInsightCards({ events }: { events: ActivityEvent[] }) {
  const cards = events.length ? events.slice(0, 6) : fallbackCards();

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-3xl font-semibold tracking-[-0.06em] text-slate-950">
          Saved Insights
        </h2>

        <Link
          href="/insights"
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200"
        >
          View all
        </Link>
      </div>

      <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none]">
        {cards.map((event) => {
          const href = event.url || "/memory";
          const external = href.startsWith("http");

          const card = (
            <article
              key={event.id}
              className="h-[24rem] w-[20rem] shrink-0 snap-center rounded-[2.2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-lg font-bold text-sky-700">
                  {event.source_type === "notion" ? "N" : "✦"}
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {event.source_type || "brain"}
                </span>
              </div>

              <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-sky-600">
                {event.event_type?.replaceAll("_", " ") || "Saved"}
              </p>

              <h3 className="mt-3 text-3xl font-semibold leading-[1.02] tracking-[-0.07em] text-slate-950">
                {event.title}
              </h3>

              {event.description ? (
                <p className="mt-4 line-clamp-4 text-base leading-7 text-slate-600">
                  {event.description}
                </p>
              ) : null}

              <div className="mt-8">
                <span className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
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
