"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { apiPost, apiGet } from "@/lib/api";
import { useMoodTheme } from "@/hooks/useMoodTheme";

type MoodResponse = {
  mood: string;
  intensity: string;
  confidence: number;
  valence: string;
  arousal: string;
  recommended_tone: string;
  theme: {
    theme_name: string;
    background: string;
    primary: string;
    accent: string;
    card: string;
    reason: string;
  };
};

export default function MoodPage() {
  const { mood: currentMood, theme: currentTheme, refreshMood } = useMoodTheme();
  const [text, setText] = useState("");
  const [result, setResult] = useState<MoodResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDetect() {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiPost<MoodResponse>("/mood/detect", {
        text: text.trim(),
        save: true,
      });
      setResult(data);
      refreshMood();
    } catch {
      setError("Detection failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchLatest() {
    setLoading(true);
    setError(null);

    try {
      const data = await apiGet<MoodResponse>("/mood/latest");
      setResult(data);
    } catch {
      setError("Failed to fetch latest mood");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Mood">
      <section className="mb-8 text-center">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-950">
          Mood Detection
        </h1>
        <p className="mt-3 text-sm text-sky-700">
          Current mood: <span className="font-semibold capitalize">{currentMood}</span>
        </p>
      </section>

      <GlassCard className="mb-6">
        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="How are you feeling?"
            rows={3}
            className="w-full resize-none rounded-xl bg-white/50 p-3 text-sm outline-none placeholder:text-slate-400"
          />

          <button
            onClick={handleDetect}
            disabled={loading || !text.trim()}
            className={`w-full rounded-full py-2.5 text-sm font-medium text-white transition ${
              currentTheme.primary
            } disabled:opacity-50`}
          >
            {loading ? "Detecting..." : "Detect Mood"}
          </button>

          <button
            onClick={handleFetchLatest}
            disabled={loading}
            className="w-full rounded-full border border-sky-200 bg-white/50 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white/80"
          >
            Fetch Latest
          </button>
        </div>
      </GlassCard>

      {error && (
        <GlassCard className="mb-6 border-red-200 text-red-600">
          <p className="text-sm">{error}</p>
        </GlassCard>
      )}

      {result && (
        <GlassCard>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Mood</span>
              <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-medium capitalize shadow-sm">
                {result.mood}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Intensity</span>
              <span className="text-sm font-medium capitalize">{result.intensity}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Valence</span>
              <span className="text-sm font-medium capitalize">{result.valence}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Arousal</span>
              <span className="text-sm font-medium capitalize">{result.arousal}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Recommended Tone</span>
              <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-medium">
                {result.recommended_tone}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Theme</span>
              <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-medium">
                {result.theme.theme_name}
              </span>
            </div>

            <p className="pt-2 text-xs italic text-slate-500">
              {result.theme.reason}
            </p>
          </div>
        </GlassCard>
      )}
    </AppShell>
  );
}
