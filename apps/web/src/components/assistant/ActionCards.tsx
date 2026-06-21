"use client";

import type {
  CreatedTaskCardData,
  NotionPageCardData,
} from "@/lib/api";

export function NotionPageCard({ page }: { page: NotionPageCardData }) {
  return (
    <div className="mt-3 overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-black/5">
      <div className="bg-gradient-to-br from-pink-100 to-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-pink-500">
          Created in Notion
        </p>

        <h3 className="mt-2 text-xl font-semibold leading-tight tracking-tight text-zinc-950">
          {page.title || "New Notion page"}
        </h3>

        <p className="mt-2 text-sm leading-5 text-zinc-600">
          Saved as a page and linked to your Second Brain.
        </p>
      </div>

      <div className="flex gap-2 p-3">
        <a
          href={page.url}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-full bg-black px-4 py-3 text-center text-sm font-semibold text-white active:scale-[0.98]"
        >
          Open in Notion →
        </a>
      </div>
    </div>
  );
}

export function TaskResultCard({ task }: { task: CreatedTaskCardData }) {
  return (
    <div className="mt-3 rounded-[1.6rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-pink-500">
        Task created
      </p>

      <h3 className="mt-2 text-lg font-semibold tracking-tight text-zinc-950">
        {task.title}
      </h3>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-pink-50 px-3 py-1 font-medium text-pink-700">
          {task.status || "Todo"}
        </span>

        <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-600">
          {task.priority || "Normal"}
        </span>

        {task.due_date ? (
          <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-600">
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
  sources?: {
    title: string;
    url?: string | null;
    id?: string | null;
    type: string;
    preview?: string | null;
  }[];
}) {
  if (!sources?.length) return null;

  function hrefFor(source: {
    url?: string | null;
    id?: string | null;
    type: string;
  }) {
    if (source.url) return source.url;
    if (source.type === "writing" && source.id) return `/writing/${source.id}`;
    if (source.type === "task" && source.id) return `/tasks`;
    if (source.type === "memory" && source.id) return `/memory`;
    return "#";
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Sources used
      </p>

      {sources.map((source, index) => {
        const href = hrefFor(source);
        const external = href.startsWith("http");

        const card = (
          <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-black/5">
            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-950">
                {source.title}
              </p>

              <p className="mt-0.5 text-xs capitalize text-zinc-500">
                {source.type}
              </p>

              {source.preview ? (
                <p className="mt-1 line-clamp-1 text-xs text-zinc-400">
                  {source.preview}
                </p>
              ) : null}
            </div>

            <span className="ml-3 text-xl text-zinc-600">›</span>
          </div>
        );

        if (href === "#") {
          return <div key={`${source.title}-${index}`}>{card}</div>;
        }

        return (
          <a
            key={`${source.title}-${index}`}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
          >
            {card}
          </a>
        );
      })}
    </div>
  );
}
