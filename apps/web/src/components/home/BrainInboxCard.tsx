"use client";

import { useEffect, useState } from "react";
import {
  acceptBrainInboxItem,
  createBrainInboxItem,
  dismissBrainInboxItem,
  getBrainInbox,
  type BrainInboxItem,
} from "@/lib/api";

export function BrainInboxCard() {
  const [text, setText] = useState("");
  const [items, setItems] = useState<BrainInboxItem[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await getBrainInbox();
      setItems(res.items || []);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function draft() {
    if (!text.trim()) return;

    setLoading(true);
    setNotice("Drafting capture...");

    try {
      const res = await createBrainInboxItem(text);
      setNotice(`Drafted as ${res.item.suggested_type}: ${res.item.title}`);
      setText("");
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not create draft.");
    } finally {
      setLoading(false);
    }
  }

  async function accept(itemId: string) {
    setLoading(true);
    setNotice("Saving item...");

    try {
      const res = await acceptBrainInboxItem(itemId);
      setNotice(res.message);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not accept item.");
    } finally {
      setLoading(false);
    }
  }

  async function dismiss(itemId: string) {
    setLoading(true);
    setNotice("Dismissing...");

    try {
      const res = await dismissBrainInboxItem(itemId);
      setNotice(res.message);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not dismiss item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-[2.3rem] bg-white p-6 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
        Brain Inbox
      </p>

      <h2 className="font-display mt-4 text-4xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
        Review before saving.
      </h2>

      <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Dump anything. Second Brain drafts it. You decide what gets saved.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Example: tomorrow fix Notion checkbox sync for the demo..."
        className="mt-5 min-h-28 w-full rounded-[1.5rem] bg-sky-50 p-4 text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-400 dark:bg-zinc-950 dark:text-white"
      />

      <button
        onClick={draft}
        disabled={loading || !text.trim()}
        className="mt-4 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Working..." : "Draft to Inbox"}
      </button>

      {notice ? (
        <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:bg-zinc-800 dark:text-zinc-300">
          {notice}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="rounded-[1.5rem] bg-sky-50 p-4 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {item.title}
                </p>

                <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  {item.description || item.raw_text}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-sky-700 dark:bg-zinc-800 dark:text-zinc-300">
                {item.suggested_type}
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => accept(item.id)}
                disabled={loading}
                className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Accept
              </button>

              <button
                onClick={() => dismiss(item.id)}
                disabled={loading}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-700 ring-1 ring-sky-100 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}

        {!items.length ? (
          <p className="rounded-[1.5rem] bg-sky-50 p-4 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
            Inbox is clear.
          </p>
        ) : null}
      </div>
    </section>
  );
}
