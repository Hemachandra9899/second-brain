"use client";

import { useState } from "react";
import type { NotionTodoPageData, NotionTodoItemData } from "@/lib/api";
import { checkNotionTodo, addTodosToNotionPage, renameNotionTodoPage } from "@/lib/api";

type TodoPageCardProps = {
  page: NotionTodoPageData;
  items: NotionTodoItemData[];
  onItemsChanged?: (items: NotionTodoItemData[]) => void;
};

export function TodoPageCard({ page, items, onItemsChanged }: TodoPageCardProps) {
  const [localItems, setLocalItems] = useState(items);
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(page.title);
  const [adding, setAdding] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  async function toggleItem(item: NotionTodoItemData) {
    if (togglingIds.has(item.notion_block_id)) return;
    setTogglingIds((prev) => new Set(prev).add(item.notion_block_id));

    const newChecked = !item.checked;
    try {
      await checkNotionTodo(page.id, item.notion_block_id, newChecked);
      const updated = localItems.map((i) =>
        i.notion_block_id === item.notion_block_id ? { ...i, checked: newChecked } : i
      );
      setLocalItems(updated);
      onItemsChanged?.(updated);
    } catch {
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.notion_block_id);
        return next;
      });
    }
  }

  async function handleRename() {
    if (!newTitle.trim() || newTitle === page.title) {
      setRenaming(false);
      return;
    }
    try {
      await renameNotionTodoPage(page.id, newTitle.trim());
      setRenaming(false);
    } catch {
    }
  }

  async function handleAddTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    try {
      const res = await addTodosToNotionPage(page.id, [newTodoText.trim()]);
      const added = res.todos.map((t) => ({ ...t, checked: false }));
      const updated = [...localItems, ...added];
      setLocalItems(updated);
      onItemsChanged?.(updated);
      setNewTodoText("");
    } catch {
    }
  }

  return (
    <div className="mt-3 overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-black/5">
      <div className="bg-gradient-to-br from-amber-50 to-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
          Notion Todo List
        </p>

        {renaming ? (
          <div className="mt-2 flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              className="flex-1 rounded-full bg-white px-3 py-2 text-sm font-semibold text-zinc-900 ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
            <button
              onClick={handleRename}
              className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="mt-1 flex items-center justify-between">
            <h3 className="text-xl font-semibold leading-tight tracking-tight text-zinc-950">
              {page.title || "Todo List"}
            </h3>
            <button
              onClick={() => setRenaming(true)}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-600"
              aria-label="Rename"
            >
              ✎
            </button>
          </div>
        )}
      </div>

      <div className="space-y-0.5 px-3 pb-2 pt-1">
        {localItems.map((item) => (
          <label
            key={item.notion_block_id}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
              togglingIds.has(item.notion_block_id)
                ? "opacity-60"
                : "hover:bg-zinc-50"
            }`}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleItem(item)}
              disabled={togglingIds.has(item.notion_block_id)}
              className="h-5 w-5 rounded-full border-2 border-zinc-300 text-amber-600 accent-amber-600 focus:ring-amber-500"
            />
            <span
              className={
                item.checked
                  ? "text-zinc-400 line-through"
                  : "text-zinc-800"
              }
            >
              {item.title}
            </span>
          </label>
        ))}
      </div>

      {adding ? (
        <form onSubmit={handleAddTodo} className="flex gap-2 px-3 pb-3">
          <input
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="New todo..."
            className="flex-1 rounded-full bg-zinc-50 px-4 py-2 text-sm text-zinc-800 ring-1 ring-black/5 outline-none focus:ring-2 focus:ring-amber-500"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="rounded-full bg-zinc-100 px-3 py-2 text-xs text-zinc-500"
          >
            Cancel
          </button>
        </form>
      ) : null}

      <div className="flex gap-2 border-t border-zinc-100 p-3">
        {page.url ? (
          <a
            href={page.url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-full bg-black px-4 py-3 text-center text-sm font-semibold text-white active:scale-[0.98]"
          >
            Open in Notion →
          </a>
        ) : null}
        <button
          onClick={() => setAdding(true)}
          className="rounded-full bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 active:scale-[0.98]"
        >
          + Add todo
        </button>
      </div>
    </div>
  );
}
