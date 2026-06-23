"use client";

import { useEffect, useState } from "react";
import {
  getLocalBrainHealth,
  reindexLocalBrain,
  searchLocalBrain,
  thinkLocalBrain,
  type LocalBrainHealth,
  type LocalBrainItem,
} from "@/lib/api";

export function LocalBrainCard() {
  const [health, setHealth] = useState<LocalBrainHealth | null>(null);
  const [query, setQuery] = useState("What should I focus on today?");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<LocalBrainItem[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadHealth() {
    try {
      const next = await getLocalBrainHealth();
      setHealth(next);
    } catch {
      setHealth(null);
    }
  }

  useEffect(() => {
    void loadHealth();
  }, []);

  async function rebuild() {
    setLoading(true);
    setNotice("Rebuilding local brain...");

    try {
      const res = await reindexLocalBrain();
      setNotice(`Indexed ${res.indexed} local brain items.`);
      await loadHealth();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not rebuild brain.");
    } finally {
      setLoading(false);
    }
  }

  async function think() {
    if (!query.trim()) return;

    setLoading(true);
    setAnswer("");
    setSources([]);
    setNotice("Thinking from local brain...");

    try {
      const res = await thinkLocalBrain(query);
      setAnswer(res.answer);
      setSources(res.sources || []);
      setNotice(res.gaps?.length ? `Gaps: ${res.gaps[0]}` : "");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Think failed.");
    } finally {
      setLoading(false);
    }
  }

  async function search() {
    if (!query.trim()) return;

    setLoading(true);
    setAnswer("");
    setNotice("Searching local brain...");

    try {
      const res = await searchLocalBrain(query);
      setSources(res.results || []);
      setNotice(`Found ${res.count} local items.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-[2.3rem] bg-white p-6 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
            Local Brain
          </p>

          <h2 className="font-display mt-4 text-4xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
            Your brain, stored here.
          </h2>
        </div>

        <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 dark:bg-zinc-800 dark:text-white">
          {health ? `${health.score}%` : "--"}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Local index across tasks, memories, writing, Notion pages, dreams, and activity.
      </p>

      {health ? (
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Items" value={health.item_count} />
          <Stat label="Open" value={health.open_tasks} />
          <Stat label="No dates" value={health.tasks_without_due_date} />
        </div>
      ) : null}

      {health?.issues?.length ? (
        <div className="mt-4 rounded-2xl bg-sky-50 p-4 text-sm leading-6 text-sky-800 dark:bg-zinc-950 dark:text-zinc-300">
          {health.issues[0]}
        </div>
      ) : null}

      <div className="mt-5 rounded-[1.5rem] bg-sky-50 p-4 dark:bg-zinc-950">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
          placeholder="Ask your local brain..."
        />

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={think}
            disabled={loading}
            className="rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Think
          </button>

          <button
            onClick={search}
            disabled={loading}
            className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-sky-700 ring-1 ring-sky-100 disabled:opacity-50 dark:bg-zinc-900 dark:text-white dark:ring-white/10"
          >
            Search
          </button>

          <button
            onClick={rebuild}
            disabled={loading}
            className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-zinc-700 ring-1 ring-sky-100 disabled:opacity-50 dark:bg-zinc-900 dark:text-white dark:ring-white/10"
          >
            Rebuild
          </button>
        </div>
      </div>

      {notice ? (
        <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:bg-zinc-800 dark:text-zinc-300">
          {notice}
        </p>
      ) : null}

      {answer ? (
        <div className="mt-5 whitespace-pre-wrap rounded-[1.5rem] bg-zinc-950 p-5 text-sm leading-6 text-white dark:bg-white dark:text-black">
          {answer}
        </div>
      ) : null}

      {sources.length ? (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-sky-600">
            Sources
          </p>

          {sources.slice(0, 5).map((source) => (
            <div
              key={source.id}
              className="rounded-2xl bg-sky-50 p-4 dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="line-clamp-1 text-sm font-semibold text-zinc-950 dark:text-white">
                  {source.title}
                </p>

                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-sky-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {source.source_type}
                </span>
              </div>

              <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                {source.preview}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-sky-50 px-3 py-3 text-center dark:bg-zinc-950">
      <p className="text-xl font-bold text-zinc-950 dark:text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase text-zinc-500">{label}</p>
    </div>
  );
}
