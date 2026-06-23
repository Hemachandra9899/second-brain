"use client";

import { useEffect, useState } from "react";
import { getTodayBrief, type BriefTask, type TodayBrief } from "@/lib/api";

function TaskMiniCard({ task }: { task: BriefTask }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-4 w-4 rounded-md border border-sky-300 bg-sky-50 dark:border-zinc-700 dark:bg-zinc-800" />

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-zinc-950 dark:text-white">
            {task.title}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {task.due_date ? (
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:bg-zinc-800 dark:text-zinc-300">
                {task.due_date}
              </span>
            ) : null}

            {task.notion_page_id ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-zinc-800 dark:text-zinc-300">
                Notion
              </span>
            ) : null}

            {task.priority ? (
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
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
    <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
      <p className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
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
      <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
        <p className="text-sm font-semibold text-sky-600">Loading your day...</p>
      </section>
    );
  }

  if (!brief) {
    return (
      <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
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
      <div className="rounded-[2.4rem] bg-gradient-to-b from-sky-100 to-white p-6 shadow-sm ring-1 ring-sky-100 dark:from-zinc-900 dark:to-zinc-950 dark:ring-white/10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
          Daily Command Center
        </p>

        <h2 className="font-display mt-4 text-5xl leading-none tracking-[-0.05em] text-zinc-950 dark:text-white">
          Your day, cleaned.
        </h2>

        <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {brief.summary}
        </p>

        <div className="mt-6 grid grid-cols-4 gap-2">
          <CountPill label="Today" value={brief.counts.today_tasks} />
          <CountPill label="Late" value={brief.counts.overdue_tasks} />
          <CountPill label="Yesterday" value={brief.counts.unfinished_yesterday} />
          <CountPill label="Notion" value={brief.counts.notion_todos} />
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-zinc-950 p-5 text-white dark:bg-white dark:text-black">
          <p className="text-xs font-bold uppercase tracking-wide opacity-60">
            Next best action
          </p>

          <p className="mt-3 text-lg font-semibold leading-6">
            {brief.suggested_next_action.title}
          </p>

          {brief.suggested_next_action.reason ? (
            <p className="mt-2 text-sm leading-6 opacity-70">
              {brief.suggested_next_action.reason}
            </p>
          ) : null}
        </div>
      </div>

      {brief.latest_dream ? (
        <div className="mt-4 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
          <p className="text-xs font-bold uppercase tracking-wide text-sky-600">
            Latest Dream
          </p>

          <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            {brief.latest_dream.summary}
          </p>
        </div>
      ) : null}

      {topTasks.length ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-zinc-950 dark:text-white">
              Needs attention
            </p>

            <button
              type="button"
              onClick={() => load()}
              className="text-xs font-bold text-sky-600"
            >
              Refresh
            </button>
          </div>

          {topTasks.map((task) => (
            <TaskMiniCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[2rem] bg-white p-5 text-sm leading-6 text-zinc-600 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-white/10">
          Nothing urgent. Capture one useful thought, task, or memory.
        </div>
      )}
    </section>
  );
}
