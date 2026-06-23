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
      <h2 className="mt-2 text-3xl font-semibold">Daily Command Center</h2>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <div className="rounded-xl bg-white/70 p-2 text-center">
          <p className="text-xl font-bold">{brief.counts.today_tasks}</p>
          <p className="text-[10px] font-semibold uppercase text-slate-500">Today</p>
        </div>
        <div className="rounded-xl bg-white/70 p-2 text-center">
          <p className="text-xl font-bold">{brief.counts.overdue_tasks}</p>
          <p className="text-[10px] font-semibold uppercase text-slate-500">Late</p>
        </div>
        <div className="rounded-xl bg-white/70 p-2 text-center">
          <p className="text-xl font-bold">{brief.counts.unfinished_yesterday}</p>
          <p className="text-[10px] font-semibold uppercase text-slate-500">Yesterday</p>
        </div>
        <div className="rounded-xl bg-white/70 p-2 text-center">
          <p className="text-xl font-bold">{brief.counts.notion_todos}</p>
          <p className="text-[10px] font-semibold uppercase text-slate-500">Notion</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{brief.summary}</p>

      <div className="mt-5 rounded-2xl bg-sky-50 p-4 text-sm text-slate-600">
        <p className="font-medium text-sky-700">Next best action</p>
        <p className="mt-1">{brief.suggested_next_action.title}</p>
        {brief.suggested_next_action.reason ? (
          <p className="mt-1 text-xs opacity-70">{brief.suggested_next_action.reason}</p>
        ) : null}
      </div>
    </GlassCard>
  );
}
