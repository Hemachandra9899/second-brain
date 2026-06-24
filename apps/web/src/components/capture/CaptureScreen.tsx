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
    <AppShell title="Capture anything" eyebrow="Save to brain">
      <GlassCard className="mb-8 sb-fade-up">
        <form onSubmit={submit} className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Try: "Remind me to submit paper Sunday"'
            className="min-h-56 w-full rounded-[1.6rem] border border-white/10 bg-black/28 px-5 py-4 text-base leading-7 text-white outline-none placeholder:text-white/30 focus:border-cyan-100/35"
          />
          <button className="w-full rounded-[1.25rem] bg-white px-5 py-4 text-base font-black text-black active:scale-[0.98] disabled:opacity-50" disabled={loading}>
            {loading ? "Capturing..." : "Save to Second Brain →"}
          </button>
        </form>
      </GlassCard>

      {result ? (
        <GlassCard className="sb-fade-up">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100/62">{result.capture_type}</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.06em] text-white">{result.summary || "Captured"}</h2>
          {result.suggested_next_action ? <p className="mt-3 text-sm leading-6 text-white/52">Next: {result.suggested_next_action}</p> : null}
          {result.answer?.answer ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/60">{result.answer.answer}</p> : null}
        </GlassCard>
      ) : null}
    </AppShell>
  );
}
