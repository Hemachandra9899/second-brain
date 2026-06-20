"use client";

import { useState } from "react";
import { completeTask, type TaskChoice } from "@/lib/api";

export function TaskChoiceCards({
  tasks,
  onCompleted,
}: {
  tasks: TaskChoice[];
  onCompleted: (message: string) => void;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!tasks.length) return null;

  async function markDone(task: TaskChoice) {
    setLoadingId(task.id);

    try {
      const res = await completeTask(task.id);

      if (res.notion_updated) {
        onCompleted(
          `Done — I marked **${res.task.title}** complete and updated Notion.`
        );
      } else if (res.notion_error) {
        onCompleted(
          `I marked **${res.task.title}** complete locally, but Notion update failed.\n\nReason: \`${res.notion_error}\``
        );
      } else {
        onCompleted(
          `Done — I marked **${res.task.title}** complete locally.`
        );
      }
    } catch {
      onCompleted("I could not mark that task complete yet.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Open tasks
      </p>

      {tasks.map((task) => (
        <div
          key={task.id}
          className="rounded-[1.35rem] bg-white p-4 shadow-sm ring-1 ring-slate-200"
        >
          <h3 className="text-base font-semibold text-slate-950">
            {task.title}
          </h3>

          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700">
              {task.status || "Todo"}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
              {task.priority || "Normal"}
            </span>

            {task.due_date ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                Due {task.due_date}
              </span>
            ) : null}

            {task.notion_page_id ? (
              <span className="rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700">
                Notion linked
              </span>
            ) : null}
          </div>

          <button
            onClick={() => markDone(task)}
            disabled={loadingId === task.id}
            className="mt-4 w-full rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loadingId === task.id ? "Updating…" : "Mark done"}
          </button>
        </div>
      ))}
    </div>
  );
}
