"use client";

import type { NotionPageCard as NotionPageCardType } from "@/lib/api";

export function NotionPageCard({ page }: { page: NotionPageCardType }) {
  return (
    <div className="mt-3 rounded-[1.35rem] border border-sky-100 bg-sky-50/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
            Created in Notion
          </p>

          <h3 className="mt-1 truncate text-base font-semibold text-slate-950">
            {page.title}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Saved as a Notion page and linked to your Second Brain.
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-bold text-sky-700 shadow-sm">
          N
        </div>
      </div>

      <a
        href={page.url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
      >
        Open in Notion →
      </a>
    </div>
  );
}
