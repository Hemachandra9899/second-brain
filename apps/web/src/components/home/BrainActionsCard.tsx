"use client";

import { useEffect, useState } from "react";
import {
  acceptBrainAction,
  getBrainActions,
  type BrainAction,
} from "@/lib/api";

export function BrainActionsCard() {
  const [actions, setActions] = useState<BrainAction[]>([]);
  const [notice, setNotice] = useState("");
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  async function load() {
    try {
      const res = await getBrainActions();
      setActions(res.actions || []);
    } catch {
      setActions([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function accept(action: BrainAction, index: number) {
    setLoadingIndex(index);
    setNotice("Applying action...");

    try {
      const res = await acceptBrainAction(action);
      setNotice(res.message || "Action completed.");
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not apply action.");
    } finally {
      setLoadingIndex(null);
    }
  }

  return (
    <section className="mt-8 rounded-[2.3rem] bg-white p-6 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
        Brain Actions
      </p>

      <h2 className="font-display mt-4 text-4xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
        Things your brain noticed.
      </h2>

      <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Second Brain turns loose connections into useful next steps.
      </p>

      {actions.length ? (
        <div className="mt-5 space-y-3">
          {actions.slice(0, 5).map((action, index) => (
            <div
              key={`${action.title}-${index}`}
              className="rounded-[1.5rem] bg-sky-50 p-4 dark:bg-zinc-950"
            >
              <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                {action.title}
              </p>

              {action.reason ? (
                <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  {action.reason}
                </p>
              ) : null}

              {action.items?.length ? (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {action.items.map((item) => (
                    <div
                      key={item.id}
                      className="min-w-[120px] rounded-2xl bg-white px-3 py-2 text-xs ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10"
                    >
                      <p className="line-clamp-2 font-semibold text-zinc-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="mt-1 uppercase text-sky-600">
                        {item.source_type}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <button
                onClick={() => accept(action, index)}
                disabled={loadingIndex === index}
                className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {loadingIndex === index
                  ? "Working..."
                  : action.action_type === "move_task_to_today"
                    ? "Move to today"
                    : "Create task"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.5rem] bg-sky-50 p-4 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
          No brain actions yet. Add more tasks, notes, dreams, or Notion pages.
        </div>
      )}

      {notice ? (
        <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:bg-zinc-800 dark:text-zinc-300">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
