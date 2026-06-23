"use client";

import { useEffect, useState } from "react";
import { getBrainTimeline, type BrainTimelineEvent } from "@/lib/api";

export function BrainTimelineCard() {
  const [events, setEvents] = useState<BrainTimelineEvent[]>([]);

  useEffect(() => {
    getBrainTimeline()
      .then((res) => setEvents(res.events || []))
      .catch(() => setEvents([]));
  }, []);

  return (
    <section className="mt-8 rounded-[2.3rem] bg-white p-6 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
        Brain Timeline
      </p>

      <h2 className="font-display mt-4 text-4xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
        What changed recently.
      </h2>

      <div className="mt-5 space-y-3">
        {events.slice(0, 6).map((event) => (
          <div
            key={event.id}
            className="rounded-[1.5rem] bg-sky-50 p-4 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="line-clamp-1 text-sm font-semibold text-zinc-950 dark:text-white">
                {event.title}
              </p>

              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-sky-700 dark:bg-zinc-800 dark:text-zinc-300">
                {event.source_type}
              </span>
            </div>

            {event.preview ? (
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                {event.preview}
              </p>
            ) : null}
          </div>
        ))}

        {!events.length ? (
          <p className="rounded-[1.5rem] bg-sky-50 p-4 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
            No recent brain activity yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
