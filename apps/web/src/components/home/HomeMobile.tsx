"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
import {
  getWritingDocuments,
  getTasks,
  type WritingDocument,
  type Task,
} from "@/lib/api";

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  quality: string;
  time: string;
  href: string;
};

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function buildActivity(
  docs: WritingDocument[],
  tasks: Task[],
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const doc of docs) {
    items.push({
      id: doc.id,
      title: doc.title,
      subtitle: doc.notion_page_id
        ? "Synced to Notion"
        : "Saved as writing block",
      quality: doc.notion_page_id ? "Synced" : "Writing",
      time: formatTime(doc.created_at),
      href: "/writing",
    });
  }

  for (const task of tasks) {
    items.push({
      id: task.id,
      title: task.title,
      subtitle: `Status: ${task.status || "Todo"} · ${task.priority || "Normal"}`,
      quality: task.source === "notion" ? "Synced" : "Task",
      time: formatTime(task.created_at),
      href: "/tasks",
    });
  }

  items.sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  return items.slice(0, 15);
}

export function HomeMobile() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [docs, tasks] = await Promise.all([
          getWritingDocuments(),
          getTasks(),
        ]);
        setItems(buildActivity(docs, tasks));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className="min-h-[100dvh] bg-[#f7f7f7] text-slate-950">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-32 pt-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-[4.2rem] font-black leading-none tracking-[-0.08em]">
              History
            </h1>

            <div className="mt-5 flex items-center gap-5 text-2xl tracking-[-0.06em]">
              <button className="font-medium text-slate-950">
                Recent items{" "}
                <span className="rounded-full bg-slate-200 px-2 text-sm">
                  {items.length}
                </span>
              </button>
              <button className="font-medium text-slate-400">
                Saved{" "}
                <span className="rounded-full bg-slate-200 px-2 text-sm">
                  {items.filter((i) => i.quality === "Synced").length}
                </span>
              </button>
            </div>
          </div>

          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm"
          >
            ✦
          </Link>
        </header>

        <section className="mt-8 space-y-5">
          {loading ? (
            <p className="text-center text-sm text-slate-400">Loading...</p>
          ) : items.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-5 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">
                No activity yet. Start writing or creating tasks.
              </p>
              <Link
                href="/writing"
                className="mt-4 inline-flex rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white"
              >
                Write something
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <Link
                key={`${item.quality}-${item.id}`}
                href={item.href}
                className="flex min-h-[8.5rem] items-center gap-4 rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-slate-200 active:scale-[0.99]"
              >
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-sky-100 to-white text-3xl">
                  {item.quality === "Synced" ? "↗" : item.quality === "Writing" ? "✎" : "◌"}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-semibold leading-[0.95] tracking-[-0.06em] text-slate-950">
                    {item.title}
                  </h2>

                  <p className="mt-3 line-clamp-1 text-sm text-slate-500">
                    {item.subtitle}
                  </p>

                  <div className="mt-5 flex items-center gap-3 text-xs text-slate-600">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        item.quality === "Synced"
                          ? "bg-green-500"
                          : item.quality === "Writing"
                            ? "bg-blue-500"
                            : "bg-slate-400"
                      }`}
                    />
                    <span>{item.quality}</span>
                    <span>·</span>
                    <span>{item.time}</span>
                  </div>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-2xl text-blue-600">
                  ›
                </div>
              </Link>
            ))
          )}
        </section>

        <section className="mt-8 rounded-[2rem] bg-slate-950 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">
            Quick capture
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
            Write anything. I&apos;ll clean it.
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Capture messy thoughts, todos, goals, or notes. Second Brain will
            turn them into memory, tasks, and Notion pages.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/writing"
              className="rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950"
            >
              New writing
            </Link>

            <Link
              href="/"
              className="rounded-full bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Ask AI
            </Link>
          </div>
        </section>
      </div>

      <MobileBottomBar />
    </main>
  );
}
