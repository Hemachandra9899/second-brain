"use client";

import type {
  CreatedTaskCardData,
  NotionPageCardData,
} from "@/lib/api";

export function NotionPageCard({ page }: { page: NotionPageCardData }) {
  return (
    <div className="mt-3 overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-slate-200">
      <div className="bg-gradient-to-br from-sky-100 to-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
          Created in Notion
        </p>

        <h3 className="mt-2 text-xl font-semibold leading-tight tracking-tight text-slate-950">
          {page.title || "New Notion page"}
        </h3>

        <p className="mt-2 text-sm leading-5 text-slate-600">
          Saved as a page and linked to your Second Brain.
        </p>
      </div>

      <div className="flex gap-2 p-3">
        <a
          href={page.url}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-full bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white active:scale-[0.98]"
        >
          Open in Notion →
        </a>
      </div>
    </div>
  );
}

export function TaskResultCard({ task }: { task: CreatedTaskCardData }) {
  return (
    <div className="mt-3 rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
        Task created
      </p>

      <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
        {task.title}
      </h3>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700">
          {task.status || "Todo"}
        </span>

        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
          {task.priority || "Normal"}
        </span>

        {task.due_date ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
            Due {task.due_date}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function SourceCards({
  sources,
}: {
  sources?: { title: string; url?: string; type: string }[];
}) {
  if (!sources?.length) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Sources used
      </p>

      {sources.map((source, index) => (
        <a
          key={`${source.title}-${index}`}
          href={source.url || "#"}
          target={source.url ? "_blank" : undefined}
          rel={source.url ? "noreferrer" : undefined}
          className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-950">
              {source.title}
            </p>
            <p className="text-xs capitalize text-slate-500">{source.type}</p>
          </div>

          <span className="text-sky-600">›</span>
        </a>
      ))}
    </div>
  );
}
