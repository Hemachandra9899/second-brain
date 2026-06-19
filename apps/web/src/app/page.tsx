import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { PillChip } from "@/components/PillChip";

export default function HomePage() {
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

      <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
        <PillChip label="Tasks" active />
        <PillChip label="Knowledge" />
        <PillChip label="Notion" />
        <PillChip label="GraphRAG" />
      </div>

      <section className="grid gap-5 md:grid-cols-3">
        <GlassCard className="md:col-span-2">
          <p className="text-sm font-medium text-sky-600">Today</p>
          <h2 className="mt-2 text-3xl font-semibold">Plan your day with context</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Pull tasks from Notion, enrich them with your knowledge base, and ask the assistant what to do next.
          </p>

          <div className="mt-6 flex gap-3">
            <Link href="/tasks" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
              View tasks →
            </Link>
            <Link href="/assistant" className="rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow">
              Ask AI
            </Link>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-medium text-sky-600">System</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>API</span>
              <span className="text-emerald-600">Live</span>
            </div>
            <div className="flex justify-between">
              <span>NVIDIA</span>
              <span className="text-emerald-600">Ready</span>
            </div>
            <div className="flex justify-between">
              <span>Notion</span>
              <span className="text-amber-600">Connect</span>
            </div>
            <div className="flex justify-between">
              <span>Pinecone</span>
              <span className="text-emerald-600">Ready</span>
            </div>
          </div>
        </GlassCard>
      </section>
    </AppShell>
  );
}
