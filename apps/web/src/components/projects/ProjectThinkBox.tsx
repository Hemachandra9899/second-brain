"use client";

import { useState } from "react";
import {
  applyProjectBrainAction,
  thinkProjectBrain,
  type ProjectThinkResponse,
} from "@/lib/api";

export function ProjectThinkBox({ projectId }: { projectId: string }) {
  const [query, setQuery] = useState("What should I do next in this project?");
  const [result, setResult] = useState<ProjectThinkResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function think() {
    if (!query.trim()) return;

    setLoading(true);
    setNotice("");
    setResult(null);

    try {
      const res = await thinkProjectBrain(projectId, query);
      setResult(res);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Project Think failed.");
    } finally {
      setLoading(false);
    }
  }

  async function applyAction() {
    if (!result?.next_action) return;

    setActionLoading(true);
    setNotice("Applying next action...");

    try {
      const res = await applyProjectBrainAction(projectId, result.next_action);
      setNotice(res.message || "Action applied.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not apply action.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
        Project Think
      </p>

      <h2 className="font-display mt-3 text-3xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
        Ask this project.
      </h2>

      <div className="mt-4 rounded-[1.5rem] bg-sky-50 p-4 dark:bg-zinc-950">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none dark:text-white"
          placeholder="Ask about this project..."
        />

        <button
          onClick={think}
          disabled={loading || !query.trim()}
          className="mt-4 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Think"}
        </button>
      </div>

      {notice ? (
        <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:bg-zinc-800 dark:text-zinc-300">
          {notice}
        </p>
      ) : null}

      {result ? (
        <div className="mt-5">
          <div className="whitespace-pre-wrap rounded-[1.5rem] bg-zinc-950 p-5 text-sm leading-6 text-white dark:bg-white dark:text-black">
            {result.answer}
          </div>

          <div className="mt-4 rounded-[1.5rem] bg-sky-50 p-4 dark:bg-zinc-950">
            <p className="text-xs font-bold uppercase tracking-wide text-sky-600">
              Next action
            </p>

            <p className="mt-2 text-sm font-semibold text-zinc-950 dark:text-white">
              {result.next_action.title}
            </p>

            <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
              {result.next_action.reason}
            </p>

            <button
              onClick={applyAction}
              disabled={actionLoading}
              className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {actionLoading
                ? "Applying..."
                : result.next_action.action_type === "open_task"
                  ? "Move to today"
                  : "Create task"}
            </button>
          </div>

          {result.sources.length ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-sky-600">
                Sources
              </p>

              {result.sources.slice(0, 4).map((source) => (
                <div
                  key={`${source.type}-${source.id}`}
                  className="rounded-2xl bg-sky-50 p-4 dark:bg-zinc-950"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="line-clamp-1 text-sm font-semibold text-zinc-950 dark:text-white">
                      {source.title}
                    </p>

                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-sky-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {source.type}
                    </span>
                  </div>

                  {source.preview ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                      {source.preview}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {result.gaps.length ? (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {result.gaps[0]}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
