"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { getScheduledTasks, Task } from "@/lib/api";

export function CalendarScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    getScheduledTasks().then(setTasks).catch(console.error);
  }, []);

  const grouped = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      const key = task.due_date || "No date";
      acc[key] = acc[key] || [];
      acc[key].push(task);
      return acc;
    }, {});
  }, [tasks]);

  return (
    <AppShell title="Calendar">
      <section className="mb-8">
        <h1 className="text-5xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-3 text-sm text-slate-600">
          Scheduled tasks from Second Brain and Notion.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(grouped).map(([date, items]) => (
          <GlassCard key={date} className="min-h-40">
            <p className="text-sm font-semibold text-sky-700">{date}</p>

            <div className="mt-4 space-y-3">
              {items.map((task) => (
                <div key={task.id} className="rounded-2xl bg-white/70 p-3">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{task.status}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        ))}

        {!tasks.length ? (
          <GlassCard>
            <p className="text-sm text-slate-600">No scheduled tasks yet.</p>
          </GlassCard>
        ) : null}
      </div>
    </AppShell>
  );
}
