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
    <GlassCard className="space-y-3 bg-gradient-to-br from-cyan-300/10 via-white/[0.07] to-violet-500/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/75">{task.source || "Second Brain"}</p>
          <h3 className="mt-2 text-lg font-black leading-snug text-white">{task.title}</h3>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-cyan-100/80">{task.status || "Todo"}</span>
      </div>

      {task.description ? <p className="line-clamp-3 text-sm leading-6 text-white/50">{task.description}</p> : null}

      <div className="flex items-center justify-between text-xs font-bold text-white/40">
        <span>{task.priority || "Normal"}</span>
        <span>{task.due_date ? `Due ${task.due_date}` : "No date"}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button onClick={() => onDone?.(task)} className="rounded-full bg-emerald-300/20 px-3 py-2 text-xs font-black text-emerald-100">Done</button>
        <button onClick={() => onSyncNotion?.(task)} className="rounded-full bg-cyan-300/20 px-3 py-2 text-xs font-black text-cyan-100">Notion</button>
        <button onClick={() => onDelete?.(task)} className="rounded-full bg-rose-300/20 px-3 py-2 text-xs font-black text-rose-100">Delete</button>
      </div>
    </GlassCard>
  );
}
