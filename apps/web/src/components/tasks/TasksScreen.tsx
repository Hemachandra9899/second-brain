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
    await createTask({ title, description, sync_to_notion: syncToNotion });
    setTitle("");
    setDescription("");
    await loadTasks();
  }

  async function markDone(task: TaskCardData) {
    await patchTask(task.id, { status: "Done", sync_to_notion: Boolean((task as any).notion_page_id) });
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
        <p className="text-[11px] font-black uppercase tracking-[0.34em] text-cyan-200/70">Todo</p>
        <h1 className="mt-3 text-[2.2rem] font-black leading-[0.96] tracking-[-0.07em] text-white">Tasks</h1>
        <p className="mt-4 text-sm leading-6 text-white/50">Create tasks and optionally sync them to Notion.</p>
      </section>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <PillChip label="All" active />
        <PillChip label="Today" />
        <PillChip label="Notion" />
        <PillChip label="High priority" />
      </div>

      <GlassCard className="mb-5 bg-gradient-to-br from-emerald-300/10 via-white/[0.07] to-cyan-500/10">
        <form onSubmit={submit} className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40" />
          <label className="flex items-center gap-2 text-sm font-bold text-white/50"><input type="checkbox" checked={syncToNotion} onChange={(e) => setSyncToNotion(e.target.checked)} /> Sync to Notion</label>
          <button className="w-full rounded-full bg-white px-5 py-3 text-sm font-black text-black">Create task →</button>
        </form>
      </GlassCard>

      <section className="space-y-3">
        {tasks.map((task) => <TaskCard key={task.id} task={task} onDone={markDone} onDelete={remove} onSyncNotion={syncNotion} />)}
      </section>
    </AppShell>
  );
}
