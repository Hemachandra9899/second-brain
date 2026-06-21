"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ActivityEvent } from "@/lib/api";

function hrefFor(event: ActivityEvent) {
  if (event.url) return event.url;
  if (event.source_type === "writing" && event.source_id) return `/writing/${event.source_id}`;
  if (event.source_type === "memory") return "/memory";
  if (event.event_type === "tasks_extracted") return "/tasks";
  return "/home";
}

function labelFor(event: ActivityEvent) {
  if (event.event_type === "notion_page_created") return "Notion page";
  if (event.event_type === "writing_saved") return "Writing block";
  if (event.event_type === "tasks_extracted") return "Tasks";
  if (event.event_type === "memory_card_created") return "Memory";
  return "Insight";
}

export function SavedInsightsCarousel({
  events,
}: {
  events: ActivityEvent[];
}) {
  const cards = useMemo(() => {
    if (events.length) return events.slice(0, 6);

    return [
      {
        id: "empty-1",
        title: "Write anything. I'll clean it.",
        description:
          "Capture messy thoughts, todos, goals, and Notion ideas. They become saved insights here.",
        event_type: "writing_saved",
        source_type: "writing",
        source_id: null,
        url: "/writing",
        created_at: null,
        metadata: {},
      },
      {
        id: "empty-2",
        title: "Connect Notion and build memory.",
        description:
          "Your synced pages, tasks, and writing blocks will appear as cards you can open later.",
        event_type: "notion_page_created",
        source_type: "notion",
        source_id: null,
        url: "/settings/integrations",
        created_at: null,
        metadata: {},
      },
    ] as ActivityEvent[];
  }, [events]);

  const [active, setActive] = useState(0);

  return (
    <section className="mt-10">
      <div className="text-center">
        <h2 className="font-display text-5xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
          Saved Insights
        </h2>

        <div className="mt-5 flex justify-center gap-3">
          <span className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-600 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10">
            Writing
          </span>
          <span className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-zinc-600 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10">
            Notion
          </span>
        </div>
      </div>

      <div className="relative mt-9 h-[31rem] overflow-hidden">
        {cards.map((event, index) => {
          const offset = index - active;
          const visible = Math.abs(offset) <= 2;
          const href = hrefFor(event);
          const external = href.startsWith("http");

          const card = (
            <article
              className="absolute left-0 right-0 mx-auto h-[28rem] rounded-[2.4rem] bg-white p-6 shadow-xl ring-1 ring-black/5 transition-all duration-500 ease-out dark:bg-zinc-900 dark:ring-white/10"
              style={{
                transform: `translateX(${offset * 88}%) scale(${offset === 0 ? 1 : 0.9}) rotate(${offset * 3}deg)`,
                opacity: visible ? (offset === 0 ? 1 : 0.42) : 0,
                zIndex: 20 - Math.abs(offset),
                pointerEvents: offset === 0 ? "auto" : "none",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-600 dark:bg-zinc-800 dark:text-white">
                    {event.source_type === "notion" ? "N" : "✦"}
                  </div>

                  <div>
                    <p className="font-semibold text-zinc-950 dark:text-white">
                      {labelFor(event)}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Saved in Second Brain
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10"
                >
                  ×
                </button>
              </div>

              <h3 className="font-display mt-9 text-4xl leading-[1.06] tracking-[-0.04em] text-zinc-950 dark:text-white">
                {event.title}
              </h3>

              {event.description ? (
                <p className="mt-5 line-clamp-5 text-base leading-7 text-zinc-600 dark:text-zinc-400">
                  {event.description}
                </p>
              ) : null}

              <div className="absolute bottom-6 left-6 right-6">
                {external ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full bg-black px-7 py-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
                  >
                    Open →
                  </a>
                ) : (
                  <Link
                    href={href}
                    className="inline-flex rounded-full bg-black px-7 py-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
                  >
                    Open →
                  </Link>
                )}
              </div>
            </article>
          );

          return <div key={event.id}>{card}</div>;
        })}
      </div>

      <div className="mt-2 flex justify-center gap-2">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => setActive(index)}
            className={
              active === index
                ? "h-2 w-7 rounded-full bg-black transition-all dark:bg-white"
                : "h-2 w-2 rounded-full bg-black/20 transition-all dark:bg-white/25"
            }
            aria-label={`Show card ${index + 1}`}
          />
        ))}
      </div>

      <div className="mt-7 flex justify-center gap-3">
        <button
          onClick={() => setActive((prev) => Math.max(prev - 1, 0))}
          className="rounded-full bg-white/80 px-5 py-3 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:text-white dark:ring-white/10"
        >
          Previous
        </button>

        <button
          onClick={() => setActive((prev) => Math.min(prev + 1, cards.length - 1))}
          className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
        >
          Next
        </button>
      </div>
    </section>
  );
}
