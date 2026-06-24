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
      const updated = localItems.map((i) => i.notion_block_id === item.notion_block_id ? { ...i, checked: newChecked } : i);
      setLocalItems(updated);
      onItemsChanged?.(updated);
    } finally {
      setTogglingIds((prev) => { const next = new Set(prev); next.delete(item.notion_block_id); return next; });
    }
  }

  async function handleRename() {
    if (!newTitle.trim() || newTitle === page.title) { setRenaming(false); return; }
    try { await renameNotionTodoPage(page.id, newTitle.trim()); setRenaming(false); } catch {}
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
    } catch {}
  }

  return (
    <div className="mt-3 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/7 shadow-sm">
      <div className="bg-gradient-to-br from-cyan-300/16 to-transparent p-4">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100/62">Notion Todo List</p>
        {renaming ? (
          <div className="mt-2 flex gap-2">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }} className="flex-1 rounded-full bg-black/28 px-3 py-2 text-sm font-bold text-white ring-1 ring-white/10 outline-none" autoFocus />
            <button onClick={handleRename} className="rounded-full bg-white px-4 py-2 text-xs font-black text-black">Save</button>
          </div>
        ) : (
          <div className="mt-1 flex items-center justify-between">
            <h3 className="text-xl font-black leading-tight tracking-[-0.04em] text-white">{page.title || "Todo List"}</h3>
            <button onClick={() => setRenaming(true)} className="text-xs font-bold text-white/38" aria-label="Rename">✎</button>
          </div>
        )}
      </div>

      <div className="space-y-0.5 px-3 pb-2 pt-1">
        {localItems.map((item) => (
          <label key={item.notion_block_id} className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${togglingIds.has(item.notion_block_id) ? "opacity-60" : "hover:bg-white/8"}`}>
            <input type="checkbox" checked={item.checked} onChange={() => toggleItem(item)} disabled={togglingIds.has(item.notion_block_id)} className="h-5 w-5 accent-cyan-100" />
            <span className={item.checked ? "text-white/35 line-through" : "text-white/72"}>{item.title}</span>
          </label>
        ))}
      </div>

      {adding ? (
        <form onSubmit={handleAddTodo} className="flex gap-2 px-3 pb-3">
          <input value={newTodoText} onChange={(e) => setNewTodoText(e.target.value)} placeholder="New todo..." className="flex-1 rounded-full bg-black/28 px-4 py-2 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-white/30" autoFocus />
          <button type="submit" className="rounded-full bg-white px-4 py-2 text-xs font-black text-black">Add</button>
          <button type="button" onClick={() => setAdding(false)} className="rounded-full bg-white/8 px-3 py-2 text-xs text-white/52">Cancel</button>
        </form>
      ) : null}

      <div className="flex gap-2 border-t border-white/8 p-3">
        {page.url ? <a href={page.url} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-white px-4 py-3 text-center text-sm font-black text-black active:scale-[0.98]">Open in Notion →</a> : null}
        <button onClick={() => setAdding(true)} className="rounded-full bg-cyan-100/14 px-4 py-3 text-sm font-bold text-cyan-100 active:scale-[0.98]">+ Add todo</button>
      </div>
    </div>
  );
}
