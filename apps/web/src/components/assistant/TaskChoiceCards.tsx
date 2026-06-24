"use client";

import { useState } from "react";
import { completeTask, type TaskChoice } from "@/lib/api";

export function TaskChoiceCards({ tasks, onCompleted }: { tasks: TaskChoice[]; onCompleted: (message: string) => void }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  if (!tasks.length) return null;

  async function markDone(task: TaskChoice) {
    setLoadingId(task.id);
    try {
      const res = await completeTask(task.id);
      if (res.notion_updated) onCompleted(`Done — I marked **${res.task.title}** complete and updated Notion.`);
      else if (res.notion_error) onCompleted(`I marked **${res.task.title}** complete locally, but Notion update failed.\n\nReason: \`${res.notion_error}\``);
      else onCompleted(`Done — I marked **${res.task.title}** complete locally.`);
    } catch {
      onCompleted("I could not mark that task complete yet.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="px-1 text-xs font-black uppercase tracking-[0.25em] text-white/38">Open tasks</p>
      {tasks.map((task) => (
        <div key={task.id} className="rounded-[1.35rem] border border-white/10 bg-white/7 p-4 shadow-sm">
          <h3 className="text-base font-black text-white">{task.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-cyan-100/14 px-3 py-1 font-bold text-cyan-100">{task.status || "Todo"}</span>
            <span className="rounded-full bg-white/8 px-3 py-1 font-bold text-white/58">{task.priority || "Normal"}</span>
            {task.due_date ? <span className="rounded-full bg-white/8 px-3 py-1 font-bold text-white/58">Due {task.due_date}</span> : null}
            {task.notion_page_id ? <span className="rounded-full bg-blue-100/14 px-3 py-1 font-bold text-blue-100">Notion linked</span> : null}
          </div>
          <button onClick={() => markDone(task)} disabled={loadingId === task.id} className="mt-4 w-full rounded-full bg-white px-4 py-3 text-sm font-black text-black disabled:opacity-50">
            {loadingId === task.id ? "Updating…" : "Mark done"}
          </button>
        </div>
      ))}
    </div>
  );
}
