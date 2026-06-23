"use client";

import { useEffect, useState } from "react";
import {
  acceptBrainProjectSuggestion,
  getBrainProjectSuggestions,
  type BrainProjectSuggestion,
} from "@/lib/api";

export function BrainProjectSuggestionsCard() {
  const [suggestions, setSuggestions] = useState<BrainProjectSuggestion[]>([]);
  const [notice, setNotice] = useState("");
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  async function load() {
    try {
      const res = await getBrainProjectSuggestions();
      setSuggestions(res.suggestions || []);
    } catch {
      setSuggestions([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function accept(suggestion: BrainProjectSuggestion, index: number) {
    setLoadingIndex(index);
    setNotice("Creating project...");

    try {
      const res = await acceptBrainProjectSuggestion(suggestion);
      setNotice(
        `${res.message} Linked ${res.linked_tasks.length} task${
          res.linked_tasks.length === 1 ? "" : "s"
        }.`
      );
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not create project.");
    } finally {
      setLoadingIndex(null);
    }
  }

  return (
    <section className="mt-8 rounded-[2.3rem] bg-white p-6 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
        Project Builder
      </p>

      <h2 className="font-display mt-4 text-4xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
        Your brain found projects.
      </h2>

      <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Connected tasks, dreams, writing, and Notion pages can become focused projects.
      </p>

      {suggestions.length ? (
        <div className="mt-5 space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.title}-${index}`}
              className="rounded-[1.5rem] bg-sky-50 p-4 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {suggestion.title}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                    {suggestion.description}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase text-sky-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {suggestion.items.length} items
                </span>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                {suggestion.items.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="min-w-[130px] rounded-2xl bg-white px-3 py-2 text-xs ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10"
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

              <button
                onClick={() => accept(suggestion, index)}
                disabled={loadingIndex === index}
                className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {loadingIndex === index ? "Creating..." : "Create project"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.5rem] bg-sky-50 p-4 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
          No project suggestions yet. Rebuild local brain connections after adding more tasks, dreams, or Notion pages.
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
