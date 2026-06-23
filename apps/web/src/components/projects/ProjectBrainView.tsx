"use client";

import { useEffect, useState } from "react";
import { getProjectBrain, type ProjectBrain } from "@/lib/api";
import { ProjectThinkBox } from "@/components/projects/ProjectThinkBox";

export function ProjectBrainView({ projectId }: { projectId: string }) {
  const [brain, setBrain] = useState<ProjectBrain | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    getProjectBrain(projectId)
      .then(setBrain)
      .catch((err) => {
        setNotice(err instanceof Error ? err.message : "Could not load project brain.");
      });
  }, [projectId]);

  if (!brain) {
    return (
      <main className="min-h-screen bg-sky-50 px-5 py-8 dark:bg-zinc-950">
        <p className="text-sm font-semibold text-sky-700">
          {notice || "Loading project brain..."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sky-50 px-5 pb-28 pt-8 dark:bg-zinc-950">
      <section className="rounded-[2.3rem] bg-white p-6 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
          Project Brain
        </p>

        <h1 className="font-display mt-4 text-5xl leading-none tracking-[-0.05em] text-zinc-950 dark:text-white">
          {brain.project.name}
        </h1>

        {brain.project.description ? (
          <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {brain.project.description}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-4 gap-2">
          <Stat label="Tasks" value={brain.counts.tasks} />
          <Stat label="Open" value={brain.counts.open_tasks} />
          <Stat label="Items" value={brain.counts.related_items} />
          <Stat label="Links" value={brain.counts.connections} />
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-zinc-950 p-5 text-white dark:bg-white dark:text-black">
          <p className="text-xs font-bold uppercase tracking-wide opacity-60">
            Next action
          </p>

          <p className="mt-3 text-lg font-semibold leading-6">
            {brain.next_action.title}
          </p>

          <p className="mt-2 text-sm leading-6 opacity-70">
            {brain.next_action.reason}
          </p>
        </div>
      </section>

      <ProjectThinkBox projectId={projectId} />

      <section className="mt-6">
        <p className="text-sm font-bold text-zinc-950 dark:text-white">
          Project tasks
        </p>

        <div className="mt-3 space-y-3">
          {brain.tasks.length ? (
            brain.tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10"
              >
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {task.title}
                </p>

                <div className="mt-2 flex gap-2">
                  <Tag>{task.status}</Tag>
                  {task.due_date ? <Tag>{task.due_date}</Tag> : null}
                  {task.notion_page_id ? <Tag>Notion</Tag> : null}
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[1.5rem] bg-white p-4 text-sm text-zinc-600 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-white/10">
              No tasks linked to this project yet.
            </p>
          )}
        </div>
      </section>

      <section className="mt-6">
        <p className="text-sm font-bold text-zinc-950 dark:text-white">
          Related brain items
        </p>

        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
          {brain.related_items.slice(0, 12).map((item) => (
            <div
              key={item.id}
              className="min-w-[180px] rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10"
            >
              <p className="line-clamp-2 text-sm font-semibold text-zinc-950 dark:text-white">
                {item.title}
              </p>

              <p className="mt-2 text-[10px] font-bold uppercase text-sky-600">
                {item.source_type}
              </p>

              <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                {item.preview}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-sky-50 px-2 py-3 text-center dark:bg-zinc-950">
      <p className="text-xl font-bold text-zinc-950 dark:text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase text-zinc-500">{label}</p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 dark:bg-zinc-800 dark:text-zinc-300">
      {children}
    </span>
  );
}
