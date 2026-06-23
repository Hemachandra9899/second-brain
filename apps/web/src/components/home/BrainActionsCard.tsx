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
    <section className="sb-card mt-8 rounded-[2rem] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/50">
        Brain Actions
      </p>

      <h2 className="mt-4 text-4xl font-semibold leading-none tracking-[-0.04em] text-white">
        Things your brain noticed.
      </h2>

      <p className="mt-4 text-sm leading-6 text-white/55">
        Second Brain turns loose connections into useful next steps.
      </p>

      {actions.length ? (
        <div className="mt-5 space-y-3">
          {actions.slice(0, 5).map((action, index) => (
            <div
              key={`${action.title}-${index}`}
              className="sb-soft-card rounded-[1.35rem] p-4"
            >
              <p className="text-sm font-semibold text-white">
                {action.title}
              </p>

              {action.reason ? (
                <p className="mt-2 text-xs leading-5 text-white/50">
                  {action.reason}
                </p>
              ) : null}

              {action.items?.length ? (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {action.items.map((item) => (
                    <div
                      key={item.id}
                      className="sb-soft-card min-w-[120px] rounded-2xl px-3 py-2 text-xs"
                    >
                      <p className="line-clamp-2 font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="mt-1 text-white/50 uppercase">
                        {item.source_type}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <button
                onClick={() => accept(action, index)}
                disabled={loadingIndex === index}
                className="mt-4 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
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
        <div className="sb-soft-card mt-5 rounded-[1.35rem] p-4 text-sm text-white/50">
          No brain actions yet. Add more tasks, notes, dreams, or Notion pages.
        </div>
      )}

      {notice ? (
        <p className="sb-soft-card mt-4 rounded-[1.35rem] px-4 py-3 text-sm font-medium text-white/80">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
