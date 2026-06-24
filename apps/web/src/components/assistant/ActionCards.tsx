"use client";

import type { CreatedTaskCardData, NotionPageCardData } from "@/lib/api";

export function NotionPageCard({ page }: { page: NotionPageCardData }) {
  return (
    <div className="mt-3 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/7 shadow-2xl">
      <div className="bg-gradient-to-br from-cyan-300/18 to-transparent p-4">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100/72">Created in Notion</p>
        <h3 className="mt-2 text-xl font-black leading-tight tracking-[-0.04em] text-white">{page.title || "New Notion page"}</h3>
        <p className="mt-2 text-sm leading-5 text-white/48">Saved as a page and linked to your Second Brain.</p>
      </div>
      <div className="flex gap-2 p-3">
        <a href={page.url} target="_blank" rel="noreferrer" className="flex-1 rounded-full bg-white px-4 py-3 text-center text-sm font-black text-black active:scale-[0.98]">
          Open in Notion →
        </a>
      </div>
    </div>
  );
}

export function TaskResultCard({ task }: { task: CreatedTaskCardData }) {
  return (
    <div className="mt-3 rounded-[1.6rem] border border-white/10 bg-white/7 p-4 shadow-2xl">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100/72">Task created</p>
      <h3 className="mt-2 text-lg font-black tracking-[-0.04em] text-white">{task.title}</h3>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-cyan-100/14 px-3 py-1 font-bold text-cyan-100">{task.status || "Todo"}</span>
        <span className="rounded-full bg-white/8 px-3 py-1 font-bold text-white/58">{task.priority || "Normal"}</span>
        {task.due_date ? <span className="rounded-full bg-white/8 px-3 py-1 font-bold text-white/58">Due {task.due_date}</span> : null}
      </div>
    </div>
  );
}

export function SourceCards({ sources }: { sources?: { title: string; url?: string | null; id?: string | null; type: string; preview?: string | null }[] }) {
  if (!sources?.length) return null;

  function hrefFor(source: { url?: string | null; id?: string | null; type: string }) {
    if (source.url) return source.url;
    if (source.type === "writing" && source.id) return `/writing/${source.id}`;
    if (source.type === "task" && source.id) return `/tasks`;
    if (source.type === "memory" && source.id) return `/memory`;
    return "#";
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="px-1 text-xs font-black uppercase tracking-[0.25em] text-white/38">Sources used</p>
      {sources.map((source, index) => {
        const href = hrefFor(source);
        const external = href.startsWith("http");
        const card = (
          <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/7 px-4 py-3 text-sm shadow-sm">
            <div className="min-w-0">
              <p className="truncate font-black text-white">{source.title}</p>
              <p className="mt-0.5 text-xs capitalize text-cyan-100/48">{source.type}</p>
              {source.preview ? <p className="mt-1 line-clamp-1 text-xs text-white/35">{source.preview}</p> : null}
            </div>
            <span className="ml-3 text-xl text-white/42">›</span>
          </div>
        );
        if (href === "#") return <div key={`${source.title}-${index}`}>{card}</div>;
        return <a key={`${source.title}-${index}`} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>{card}</a>;
      })}
    </div>
  );
}
