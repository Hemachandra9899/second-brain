import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";

export default function CalendarPage() {
  return (
    <AppShell title="Calendar">
      <section className="mb-8">
        <h1 className="text-5xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-3 text-sm text-slate-600">
          Scheduled tasks from Second Brain and Notion will appear here.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-7">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <GlassCard key={day} className="min-h-40">
            <p className="text-sm font-semibold text-sky-700">{day}</p>
            <p className="mt-4 text-xs text-slate-500">No scheduled tasks yet.</p>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  );
}
