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
    <section className="sb-card mt-8 rounded-[2rem] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/50">
        Brain Timeline
      </p>

      <h2 className="mt-4 text-4xl font-semibold leading-none tracking-[-0.04em] text-white">
        What changed recently.
      </h2>

      <div className="mt-5 space-y-3">
        {events.slice(0, 6).map((event) => (
          <div
            key={event.id}
            className="sb-soft-card rounded-[1.35rem] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="line-clamp-1 text-sm font-semibold text-white">
                {event.title}
              </p>

              <span className="sb-chip rounded-full px-2.5 py-1 text-[10px] font-bold uppercase">
                {event.source_type}
              </span>
            </div>

            {event.preview ? (
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/50">
                {event.preview}
              </p>
            ) : null}
          </div>
        ))}

        {!events.length ? (
          <p className="sb-soft-card rounded-[1.35rem] p-4 text-sm text-white/50">
            No recent brain activity yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
