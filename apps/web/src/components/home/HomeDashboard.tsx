"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { TodayBriefCard } from "@/components/TodayBriefCard";
import { getMemoryCards, getProjects, MemoryCard, Project, captureAnything } from "@/lib/api";
import Link from "next/link";

export function HomeDashboard() {
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [captureText, setCaptureText] = useState("");

  useEffect(() => {
    getMemoryCards()
      .then((cards) => setMemoryCards(cards.slice(0, 3)))
      .catch(() => {});

    getProjects()
      .then((p) => setProjects(p.slice(0, 3)))
      .catch(() => {});
  }, []);

  async function handleQuickCapture() {
    if (!captureText.trim()) return;
    await captureAnything(captureText);
    setCaptureText("");
  }

  return (
    <AppShell title="Second Brain">
      <section className="mb-8 text-center md:text-left">
        <p className="text-sm font-medium text-sky-600">AI-powered knowledge workspace</p>
        <h1 className="mt-3 text-5xl font-semibold leading-tight tracking-tight text-slate-950 md:text-7xl">
          Your calm, connected second brain.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 md:max-w-2xl">
          Capture tasks, sync with Notion, search your memory, and ask your AI assistant what matters next.
        </p>
      </section>

      <GlassCard className="mb-6">
        <div className="flex gap-3">
          <input
            value={captureText}
            onChange={(e) => setCaptureText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleQuickCapture(); }}
            placeholder="Quick capture: task, idea, note..."
            className="flex-1 rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm outline-none"
          />
          <button
            onClick={handleQuickCapture}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
          >
            Capture
          </button>
        </div>
      </GlassCard>

      <section className="grid gap-5 md:grid-cols-3">
        <TodayBriefCard />

        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Active Projects</h2>
            <Link href="/projects" className="text-xs text-sky-600">View all</Link>
          </div>
          {projects.map((p) => (
            <div key={p.id} className="mb-2 rounded-xl bg-white/70 p-3 text-sm">
              <p className="font-medium">{p.name}</p>
              <p className="mt-0.5 text-xs text-slate-500 capitalize">{p.status}</p>
            </div>
          ))}
          {!projects.length ? (
            <p className="text-sm text-slate-600">No projects yet.</p>
          ) : null}
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Memory</h2>
            <Link href="/memory" className="text-xs text-sky-600">View all</Link>
          </div>
          {memoryCards.map((mc) => (
            <div key={mc.id} className="mb-2 rounded-xl bg-white/70 p-3 text-sm">
              <p className="font-medium">{mc.title}</p>
              <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{mc.summary}</p>
            </div>
          ))}
          {!memoryCards.length ? (
            <p className="text-sm text-slate-600">No memory cards yet.</p>
          ) : null}
        </GlassCard>
      </section>
    </AppShell>
  );
}
