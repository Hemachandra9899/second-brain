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
      <section className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.34em] text-cyan-200/70">Input</p>
        <h1 className="mt-3 text-[2.2rem] font-black leading-[0.96] tracking-[-0.07em] text-white">Capture anything</h1>
        <p className="mt-4 text-sm leading-6 text-white/50">Paste a task, idea, link, meeting note, or question.</p>
      </section>

      <GlassCard className="bg-gradient-to-br from-cyan-300/20 via-white/[0.07] to-violet-500/20">
        <form onSubmit={submit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Try: "Remind me to submit paper Sunday"'
            className="min-h-52 w-full rounded-[1.5rem] border border-white/10 bg-black/30 px-5 py-4 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-cyan-200/40"
          />
          <button className="w-full rounded-full bg-white px-5 py-3 text-sm font-black text-black active:scale-95 disabled:opacity-50" disabled={loading}>
            {loading ? "Capturing..." : "Save to Second Brain →"}
          </button>
        </form>
      </GlassCard>

      {result ? (
        <GlassCard className="mt-5">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/75">{result.capture_type}</p>
          <h2 className="mt-3 text-xl font-black text-white">{result.summary || "Captured"}</h2>
          {result.suggested_next_action ? <p className="mt-3 text-sm leading-6 text-white/50">Next: {result.suggested_next_action}</p> : null}
        </GlassCard>
      ) : null}
    </AppShell>
  );
}
