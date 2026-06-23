"use client";

import { useEffect, useState } from "react";
import { getLatestDream, runDream, acceptDreamAction, type Dream } from "@/lib/api";

export function DreamModeCard() {
  const [dream, setDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getLatestDream()
      .then((res) => setDream(res.dream))
      .catch(() => setDream(null));
  }, []);

  async function run(mode: "nightly" | "think") {
    setLoading(true);
    setNotice(mode === "think" ? "Thinking deeply..." : "Dreaming...");

    try {
      const next = await runDream(mode);
      setDream(next);
      setNotice(mode === "think" ? "Think Mode completed." : "Dream created.");
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Could not run Dream Mode."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(index: number) {
    if (!dream) return;
    try {
      await acceptDreamAction(dream.id, index);
      setNotice("Action accepted.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not accept action.");
    }
  }

  return (
    <section className="mt-10 rounded-[2.2rem] bg-white p-6 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
            Dream Mode
          </p>

          <h2 className="font-display mt-4 text-4xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
            {dream ? dream.title : "Let your brain dream."}
          </h2>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xl font-bold text-sky-600 dark:bg-zinc-800">
          {"\u2726"}
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {dream
          ? dream.summary
          : "I\u2019ll review your tasks, writing, Notion pages, memories, and recent activity to find patterns and next actions."}
      </p>

      {dream?.patterns?.length ? (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-sky-600">
            I noticed
          </p>

          <div className="mt-3 space-y-2">
            {dream.patterns.slice(0, 3).map((pattern, index) => (
              <div
                key={`${pattern}-${index}`}
                className="rounded-2xl bg-sky-50 px-4 py-3 text-sm leading-6 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
              >
                {pattern}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {dream?.suggested_actions?.length ? (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-sky-600">
            Suggested next actions
          </p>

          <div className="mt-3 space-y-2">
            {dream.suggested_actions.slice(0, 3).map((action, index) => (
              <div
                key={`${action.title}-${index}`}
                className="rounded-2xl bg-zinc-950 px-4 py-4 text-white dark:bg-white dark:text-black"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{action.title}</p>
                    {action.reason ? (
                      <p className="mt-2 text-xs leading-5 opacity-75">
                        {action.reason}
                      </p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => handleAccept(index)}
                    className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-950 transition active:scale-95 dark:bg-zinc-800 dark:text-white"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {notice ? (
        <p className="mt-5 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 dark:bg-zinc-800 dark:text-zinc-300">
          {notice}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => run("nightly")}
          disabled={loading}
          className="rounded-full bg-sky-600 px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Running..." : "Run Dream"}
        </button>

        <button
          onClick={() => run("think")}
          disabled={loading}
          className="rounded-full bg-sky-50 px-5 py-4 text-sm font-semibold text-sky-700 ring-1 ring-sky-100 disabled:opacity-50 dark:bg-zinc-800 dark:text-white dark:ring-white/10"
        >
          Think Mode
        </button>
      </div>
    </section>
  );
}
