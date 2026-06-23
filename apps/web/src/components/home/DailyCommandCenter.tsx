"use client";

import { useEffect, useState } from "react";
import { getTodayBrief, type BriefTask, type TodayBrief } from "@/lib/api";

function TaskMiniCard({ task }: { task: BriefTask }) {
  return (
    <div className="sb-soft-card rounded-[1.35rem] p-3.5">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-4 w-4 shrink-0 rounded-md border border-white/20 bg-white/5" />

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-white">
            {task.title}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {task.due_date ? (
              <span className="sb-chip rounded-full px-2.5 py-1 text-[11px] font-semibold">
                {task.due_date}
              </span>
            ) : null}

            {task.notion_page_id ? (
              <span className="sb-chip rounded-full px-2.5 py-1 text-[11px] font-semibold">
                Notion
              </span>
            ) : null}

            {task.priority ? (
              <span className="sb-chip rounded-full px-2.5 py-1 text-[11px] font-semibold">
                {task.priority}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="sb-soft-card rounded-2xl px-3 py-3 text-center">
      <p className="text-2xl font-bold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
        {label}
      </p>
    </div>
  );
}

export function DailyCommandCenter() {
  const [brief, setBrief] = useState<TodayBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await getTodayBrief();
      setBrief(data);
      setNotice("");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not load today brief.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <section className="sb-card mt-8 rounded-[2rem] p-6">
        <p className="text-sm font-semibold text-white/60">Loading your day...</p>
      </section>
    );
  }

  if (!brief) {
    return (
      <section className="sb-card mt-8 rounded-[2rem] p-6">
        <p className="text-sm text-white/50">
          {notice || "No brief available."}
        </p>
      </section>
    );
  }

  const topTasks = [
    ...brief.overdue_tasks.slice(0, 2),
    ...brief.today_tasks.slice(0, 3),
    ...brief.unfinished_yesterday.slice(0, 2),
  ].slice(0, 5);

  return (
    <section className="mt-8">
      <div className="sb-card rounded-[2rem] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/50">
          Daily Command Center
        </p>

        <h2 className="mt-4 text-4xl font-semibold leading-none tracking-[-0.05em] text-white">
          Your day, cleaned.
        </h2>

        <p className="mt-4 text-sm leading-6 text-white/55">
          {brief.summary}
        </p>

        <div className="mt-6 grid grid-cols-4 gap-2">
          <CountPill label="Today" value={brief.counts.today_tasks} />
          <CountPill label="Late" value={brief.counts.overdue_tasks} />
          <CountPill label="Yesterday" value={brief.counts.unfinished_yesterday} />
          <CountPill label="Notion" value={brief.counts.notion_todos} />
        </div>

        <div className="sb-soft-card mt-6 rounded-[1.35rem] p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-white/60">
            Next best action
          </p>

          <p className="mt-3 text-lg font-semibold leading-6 text-white">
            {brief.suggested_next_action.title}
          </p>

          {brief.suggested_next_action.reason ? (
            <p className="mt-2 text-sm leading-6 text-white/60">
              {brief.suggested_next_action.reason}
            </p>
          ) : null}
        </div>
      </div>

      {brief.latest_dream ? (
        <div className="sb-card mt-4 rounded-[2rem] p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-white/50">
            Latest Dream
          </p>

          <p className="mt-3 text-sm leading-6 text-white/70">
            {brief.latest_dream.summary}
          </p>
        </div>
      ) : null}

      {topTasks.length ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">
              Needs attention
            </p>

            <button
              type="button"
              onClick={() => load()}
              className="sb-chip rounded-full px-4 py-2 text-xs font-bold"
            >
              Refresh
            </button>
          </div>

          {topTasks.map((task) => (
            <TaskMiniCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="sb-soft-card mt-5 rounded-[2rem] p-5 text-sm leading-6 text-white/50">
          Nothing urgent. Capture one useful thought, task, or memory.
        </div>
      )}
    </section>
  );
}
