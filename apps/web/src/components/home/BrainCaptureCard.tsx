"use client";

import { useState } from "react";
import { captureToBrain } from "@/lib/api";

export function BrainCaptureCard() {
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!text.trim()) return;

    setLoading(true);
    setNotice("Saving to brain...");

    try {
      const res = await captureToBrain(text);
      setNotice(`Saved as ${res.created.type}: ${res.created.title}`);
      setText("");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not save capture.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-[2.3rem] bg-white p-6 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
        Universal Capture
      </p>

      <h2 className="font-display mt-4 text-4xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
        Dump anything.
      </h2>

      <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Second Brain decides whether it is a task, memory, project, or goal.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Example: remind me tomorrow to fix Notion sync for demo..."
        className="mt-5 min-h-32 w-full rounded-[1.5rem] bg-sky-50 p-4 text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-400 dark:bg-zinc-950 dark:text-white"
      />

      <button
        onClick={save}
        disabled={loading || !text.trim()}
        className="mt-4 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save to Brain"}
      </button>

      {notice ? (
        <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:bg-zinc-800 dark:text-zinc-300">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
