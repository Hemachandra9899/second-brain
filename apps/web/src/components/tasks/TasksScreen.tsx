"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { PillChip } from "@/components/PillChip";
import { TaskCard, TaskCardData } from "@/components/TaskCard";
import { createTask, deleteTask, getTasks, patchTask, syncTaskToNotion } from "@/lib/api";

export function TasksScreen() {
  const [tasks, setTasks] = useState<TaskCardData[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [syncToNotion, setSyncToNotion] = useState(true);

  async function loadTasks() {
    const data = await getTasks();
    setTasks(data);
  }

  useEffect(() => {
    loadTasks().catch(console.error);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim()) return;

    await createTask({
      title,
      description,
      sync_to_notion: syncToNotion,
    });

    setTitle("");
    setDescription("");
    await loadTasks();
  }

  async function markDone(task: TaskCardData) {
    await patchTask(task.id, {
      status: "Done",
      sync_to_notion: Boolean((task as any).notion_page_id),
    });
    await loadTasks();
  }

  async function remove(task: TaskCardData) {
    await deleteTask(task.id);
    await loadTasks();
  }

  async function syncNotion(task: TaskCardData) {
    await syncTaskToNotion(task.id);
    await loadTasks();
  }

  return (
    <AppShell title="Tasks">
      <section className="mb-6">
        <h1 className="text-5xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-3 text-sm text-slate-600">
          Create tasks here and optionally sync them to Notion.
        </p>
      </section>

      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
        <PillChip label="All" active />
        <PillChip label="Today" />
        <PillChip label="Notion" />
        <PillChip label="High priority" />
      </div>

      <GlassCard className="mb-6">
        <form onSubmit={submit} className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm outline-none"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="min-h-24 w-full rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm outline-none"
          />

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={syncToNotion}
              onChange={(e) => setSyncToNotion(e.target.checked)}
            />
            Sync to Notion
          </label>

          <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
            Create task →
          </button>
        </form>
      </GlassCard>

      <section className="grid gap-4 md:grid-cols-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDone={markDone}
            onDelete={remove}
            onSyncNotion={syncNotion}
          />
        ))}
      </section>
    </AppShell>
  );
}
