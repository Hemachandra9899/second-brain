import { GlassCard } from "./GlassCard";

export type TaskCardData = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  due_date?: string | null;
  source?: string | null;
};

type TaskCardProps = {
  task: TaskCardData;
  onDone?: (task: TaskCardData) => void;
  onDelete?: (task: TaskCardData) => void;
  onSyncNotion?: (task: TaskCardData) => void;
};

export function TaskCard({ task, onDone, onDelete, onSyncNotion }: TaskCardProps) {
  return (
    <GlassCard className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-sky-600">
            {task.source || "Second Brain"}
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-snug text-slate-900">
            {task.title}
          </h3>
        </div>

        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700">
          {task.status || "Todo"}
        </span>
      </div>

      {task.description ? (
        <p className="line-clamp-3 text-sm leading-6 text-slate-600">
          {task.description}
        </p>
      ) : null}

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{task.priority || "Normal"}</span>
        <span>{task.due_date ? `Due ${task.due_date}` : "No date"}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => onDone?.(task)}
          className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700"
        >
          Done
        </button>

        <button
          onClick={() => onSyncNotion?.(task)}
          className="rounded-full bg-sky-100 px-3 py-2 text-xs font-medium text-sky-700"
        >
          Notion
        </button>

        <button
          onClick={() => onDelete?.(task)}
          className="rounded-full bg-rose-100 px-3 py-2 text-xs font-medium text-rose-700"
        >
          Delete
        </button>
      </div>
    </GlassCard>
  );
}
