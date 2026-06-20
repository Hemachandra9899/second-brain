"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { captureAnything, CaptureResponse } from "@/lib/api";

export function CaptureScreen() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<CaptureResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);

    try {
      const res = await captureAnything(text);
      setResult(res);
      setText("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Capture">
      <section className="mb-8">
        <h1 className="text-5xl font-semibold tracking-tight">Capture Anything</h1>
        <p className="mt-3 text-sm text-slate-600">
          Paste a task, idea, link, meeting note, or question. Second Brain will route it.
        </p>
      </section>

      <GlassCard>
        <form onSubmit={submit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Try: "Remind me to submit paper Sunday"'
            className="min-h-52 w-full rounded-3xl border border-sky-100 bg-white/80 px-5 py-4 text-sm leading-6 outline-none"
          />

          <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
            {loading ? "Capturing..." : "Save to Second Brain →"}
          </button>
        </form>
      </GlassCard>

      {result ? (
        <GlassCard className="mt-6">
          <p className="text-xs uppercase tracking-wide text-sky-600">
            {result.capture_type}
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            {result.summary || "Captured"}
          </h2>

          {result.suggested_next_action ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Next: {result.suggested_next_action}
            </p>
          ) : null}

          {result.answer?.answer ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {result.answer.answer}
            </p>
          ) : null}
        </GlassCard>
      ) : null}
    </AppShell>
  );
}
