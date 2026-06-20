"use client";

import { useEffect, useState } from "react";
import { getTodayBrief, TodayBrief } from "@/lib/api";
import { GlassCard } from "@/components/GlassCard";

export function TodayBriefCard() {
  const [brief, setBrief] = useState<TodayBrief | null>(null);

  useEffect(() => {
    getTodayBrief().then(setBrief).catch(console.error);
  }, []);

  if (!brief) {
    return (
      <GlassCard>
        <p className="text-sm text-slate-600">Preparing your Today Brief...</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="md:col-span-2">
      <p className="text-sm font-medium text-sky-600">{brief.greeting}</p>
      <h2 className="mt-2 text-3xl font-semibold">Today Brief</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{brief.summary}</p>

      <div className="mt-5 space-y-3">
        {brief.priorities?.map((priority, idx) => (
          <div key={idx} className="rounded-2xl bg-white/70 p-4">
            <p className="font-medium text-slate-900">{priority.title}</p>
            <p className="mt-1 text-sm text-slate-600">{priority.reason}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-sky-50 p-4 text-sm text-slate-600">
        {brief.mood_note}
      </div>

      <p className="mt-4 text-sm font-medium text-sky-700">
        Next: {brief.suggested_next_action}
      </p>
    </GlassCard>
  );
}
