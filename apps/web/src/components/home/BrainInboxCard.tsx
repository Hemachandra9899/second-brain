"use client";

import { useEffect, useState } from "react";
import {
  acceptBrainInboxItem,
  createBrainInboxItem,
  dismissBrainInboxItem,
  getBrainInbox,
  updateBrainInboxItem,
  type BrainInboxItem,
} from "@/lib/api";

export function BrainInboxCard() {
  const [text, setText] = useState("");
  const [items, setItems] = useState<BrainInboxItem[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<BrainInboxItem>>>({});

  function updateDraft(itemId: string, updates: Partial<BrainInboxItem>) {
    setDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        ...updates,
      },
    }));
  }

  function getDraft(item: BrainInboxItem) {
    return {
      ...item,
      ...(drafts[item.id] || {}),
    };
  }

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

  async function saveDraft(item: BrainInboxItem) {
    const draft = getDraft(item);

    setLoading(true);
    setNotice("Updating draft...");

    try {
      const res = await updateBrainInboxItem(item.id, {
        suggested_type: draft.suggested_type,
        title: draft.title,
        description: draft.description,
        due_date: draft.due_date,
        priority: draft.priority || "Normal",
        tags: draft.tags || [],
      });

      setNotice(res.message);
      setEditingId(null);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not update draft.");
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
        {items.slice(0, 5).map((item) => {
          const draft = getDraft(item);
          const editing = editingId === item.id;

          return (
            <div
              key={item.id}
              className="rounded-[1.5rem] bg-sky-50 p-4 dark:bg-zinc-950"
            >
              {editing ? (
                <div className="space-y-3">
                  <select
                    value={draft.suggested_type}
                    onChange={(e) =>
                      updateDraft(item.id, { suggested_type: e.target.value })
                    }
                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="task">Task</option>
                    <option value="memory">Memory</option>
                    <option value="project">Project</option>
                    <option value="goal">Goal</option>
                  </select>

                  <input
                    value={draft.title || ""}
                    onChange={(e) => updateDraft(item.id, { title: e.target.value })}
                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-900 outline-none dark:bg-zinc-900 dark:text-white"
                    placeholder="Title"
                  />

                  <textarea
                    value={draft.description || ""}
                    onChange={(e) =>
                      updateDraft(item.id, { description: e.target.value })
                    }
                    className="min-h-24 w-full rounded-2xl bg-white px-4 py-3 text-sm text-zinc-900 outline-none dark:bg-zinc-900 dark:text-white"
                    placeholder="Description"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={draft.due_date || ""}
                      onChange={(e) =>
                        updateDraft(item.id, { due_date: e.target.value })
                      }
                      className="rounded-2xl bg-white px-4 py-3 text-sm text-zinc-900 outline-none dark:bg-zinc-900 dark:text-white"
                      placeholder="Due date"
                    />

                    <select
                      value={draft.priority || "Normal"}
                      onChange={(e) =>
                        updateDraft(item.id, { priority: e.target.value })
                      }
                      className="rounded-2xl bg-white px-4 py-3 text-sm text-zinc-900 outline-none dark:bg-zinc-900 dark:text-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveDraft(item)}
                      disabled={loading}
                      className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Save draft
                    </button>

                    <button
                      onClick={() => setEditingId(null)}
                      disabled={loading}
                      className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-700 ring-1 ring-sky-100 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                        {item.title}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                        {item.description || item.raw_text}
                      </p>

                      {item.due_date ? (
                        <p className="mt-2 text-xs font-semibold text-sky-700">
                          Due: {item.due_date}
                        </p>
                      ) : null}
                    </div>

                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-sky-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {item.suggested_type}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => accept(item.id)}
                      disabled={loading}
                      className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setDrafts((prev) => ({
                          ...prev,
                          [item.id]: item,
                        }));
                      }}
                      disabled={loading}
                      className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-sky-700 ring-1 ring-sky-100 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => dismiss(item.id)}
                      disabled={loading}
                      className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-700 ring-1 ring-sky-100 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10"
                    >
                      Dismiss
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {!items.length ? (
          <p className="rounded-[1.5rem] bg-sky-50 p-4 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
            Inbox is clear.
          </p>
        ) : null}
      </div>
    </section>
  );
}
