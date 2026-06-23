"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getLocalBrainGraph,
  rebuildLocalBrainRelationships,
  type LocalBrainGraph,
} from "@/lib/api";

function colorFor(type: string) {
  if (type === "task") return "bg-blue-600 text-white";
  if (type === "dream") return "bg-zinc-950 text-white";
  if (type === "notion") return "bg-blue-50 text-blue-700";
  if (type === "memory") return "bg-sky-100 text-sky-800";
  if (type === "writing") return "bg-white text-zinc-950 ring-1 ring-sky-100";
  return "bg-sky-50 text-sky-700";
}

export function LocalBrainGraphCard() {
  const [graph, setGraph] = useState<LocalBrainGraph | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const data = await getLocalBrainGraph();
      setGraph(data);
    } catch {
      setGraph(null);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function rebuild() {
    setLoading(true);
    setNotice("Rebuilding connections...");

    try {
      const res = await rebuildLocalBrainRelationships();
      setNotice(`Created ${res.edges_created} brain connections.`);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not rebuild connections.");
    } finally {
      setLoading(false);
    }
  }

  const topNodes = useMemo(() => graph?.nodes.slice(0, 16) || [], [graph]);

  return (
    <section className="mt-8 rounded-[2.3rem] bg-white p-6 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
        Brain Connections
      </p>

      <h2 className="font-display mt-4 text-4xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
        Not just saved. Connected.
      </h2>

      <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Second Brain links related tasks, memories, dreams, writing, and Notion pages.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-sky-50 p-4 text-center dark:bg-zinc-950">
          <p className="text-2xl font-bold text-zinc-950 dark:text-white">
            {graph?.counts.nodes ?? 0}
          </p>
          <p className="mt-1 text-xs font-bold uppercase text-zinc-500">Nodes</p>
        </div>

        <div className="rounded-2xl bg-sky-50 p-4 text-center dark:bg-zinc-950">
          <p className="text-2xl font-bold text-zinc-950 dark:text-white">
            {graph?.counts.edges ?? 0}
          </p>
          <p className="mt-1 text-xs font-bold uppercase text-zinc-500">Edges</p>
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
        {topNodes.map((node) => (
          <div
            key={node.id}
            className={`min-w-[140px] rounded-2xl px-4 py-3 text-sm font-semibold ${colorFor(node.type)}`}
          >
            <p className="line-clamp-2">{node.label}</p>
            <p className="mt-2 text-[10px] font-bold uppercase opacity-60">
              {node.type}
            </p>
          </div>
        ))}
      </div>

      {graph?.edges?.length ? (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-sky-600">
            Strong links
          </p>

          {graph.edges.slice(0, 4).map((edge) => (
            <div
              key={edge.id}
              className="rounded-2xl bg-sky-50 p-4 text-sm leading-6 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
            >
              <p className="font-semibold">{edge.label}</p>
              {edge.reason ? (
                <p className="mt-1 text-xs opacity-70">{edge.reason}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {notice ? (
        <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:bg-zinc-800 dark:text-zinc-300">
          {notice}
        </p>
      ) : null}

      <button
        onClick={rebuild}
        disabled={loading}
        className="mt-5 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Working..." : "Rebuild connections"}
      </button>
    </section>
  );
}
