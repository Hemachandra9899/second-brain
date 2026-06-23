"use client";

import { useEffect, useState } from "react";
import { brainThink, getBrainMap, type BrainMap } from "@/lib/api";

function typeClass(type: string) {
  if (type === "task") return "bg-blue-600 text-white";
  if (type === "memory") return "bg-sky-100 text-sky-800";
  if (type === "notion") return "bg-blue-50 text-blue-700";
  if (type === "dream") return "bg-zinc-950 text-white";
  if (type === "writing") return "bg-white text-zinc-900 ring-1 ring-sky-100";
  return "bg-sky-50 text-sky-700";
}

export function BrainMapCard() {
  const [map, setMap] = useState<BrainMap | null>(null);
  const [question, setQuestion] = useState("What should I focus on next?");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBrainMap()
      .then(setMap)
      .catch(() => setMap(null));
  }, []);

  async function think() {
    setLoading(true);
    setAnswer("");

    try {
      const res = await brainThink(question);
      setAnswer(res.answer);
    } catch (err) {
      setAnswer(err instanceof Error ? err.message : "Think Mode failed.");
    } finally {
      setLoading(false);
    }
  }

  const visibleNodes = map?.nodes.filter((n) => n.type !== "hub").slice(0, 18) || [];

  return (
    <section className="mt-8 rounded-[2.3rem] bg-white p-6 shadow-sm ring-1 ring-sky-100 dark:bg-zinc-900 dark:ring-white/10">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">
        Brain Map
      </p>

      <h2 className="font-display mt-4 text-4xl leading-none tracking-[-0.04em] text-zinc-950 dark:text-white">
        Your connectome.
      </h2>

      <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Tasks, memories, writing, Notion pages, and dreams connected into one map.
      </p>

      {map ? (
        <div className="mt-5 grid grid-cols-5 gap-2">
          <Count label="Tasks" value={map.counts.tasks} />
          <Count label="Memory" value={map.counts.memories} />
          <Count label="Write" value={map.counts.writings} />
          <Count label="Notion" value={map.counts.notion_pages} />
          <Count label="Dreams" value={map.counts.dreams} />
        </div>
      ) : null}

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
        {visibleNodes.map((node) => (
          <div
            key={node.id}
            className={`min-w-[145px] rounded-2xl px-4 py-3 text-sm font-semibold ${typeClass(node.type)}`}
          >
            <p className="line-clamp-2">{node.label}</p>
            {node.subtitle ? (
              <p className="mt-2 line-clamp-2 text-[11px] font-medium opacity-70">
                {node.subtitle}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[1.5rem] bg-sky-50 p-4 dark:bg-zinc-950">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
          placeholder="Ask Think Mode..."
        />

        <button
          onClick={think}
          disabled={loading || !question.trim()}
          className="mt-4 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Think"}
        </button>
      </div>

      {answer ? (
        <div className="mt-5 whitespace-pre-wrap rounded-[1.5rem] bg-zinc-950 p-5 text-sm leading-6 text-white dark:bg-white dark:text-black">
          {answer}
        </div>
      ) : null}
    </section>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-sky-50 px-2 py-3 text-center dark:bg-zinc-950">
      <p className="text-lg font-bold text-zinc-950 dark:text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase text-zinc-500">{label}</p>
    </div>
  );
}
