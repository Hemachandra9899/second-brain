"use client";

import Link from "next/link";
import type { ActivityEvent } from "@/lib/api";

export function SavedInsightsDrawer({
  open,
  events,
  onClose,
}: {
  open: boolean;
  events: ActivityEvent[];
  onClose: () => void;
}) {
  const cards = events.slice(0, 3);

  return (
    <div
      className={
        open
          ? "fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm transition"
          : "pointer-events-none fixed inset-0 z-[70] bg-transparent transition"
      }
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className={
          open
            ? "absolute bottom-0 left-0 top-0 w-[88%] max-w-sm translate-x-0 rounded-r-[2.2rem] bg-[#f7edf2] p-5 shadow-2xl transition-transform duration-300 dark:bg-[#050505]"
            : "absolute bottom-0 left-0 top-0 w-[88%] max-w-sm -translate-x-full rounded-r-[2.2rem] bg-[#f7edf2] p-5 shadow-2xl transition-transform duration-300 dark:bg-[#050505]"
        }
      >
        <div className="flex items-center justify-between pt-8">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl shadow-sm dark:bg-zinc-900 dark:text-white"
          >
            ‹
          </button>

          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Swipe panel
          </p>
        </div>

        <h2 className="mt-10 text-5xl font-semibold tracking-[-0.08em] text-zinc-950 dark:text-white">
          Saved Insights
        </h2>

        <div className="mt-8 space-y-4">
          {cards.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Empty
              </p>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-zinc-950 dark:text-white">
                Nothing saved yet.
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Create writing blocks or Notion pages. They'll appear here.
              </p>
            </div>
          ) : null}

          {cards.map((event) => {
            const href = event.url || "/home";
            const external = href.startsWith("http");

            const card = (
              <article className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {event.event_type.replaceAll("_", " ")}
                </p>

                <h3 className="mt-4 text-3xl font-semibold leading-none tracking-[-0.07em] text-zinc-950 dark:text-white">
                  {event.title}
                </h3>

                {event.description ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    {event.description}
                  </p>
                ) : null}

                <div className="mt-5">
                  <span className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black">
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
      </aside>
    </div>
  );
}
