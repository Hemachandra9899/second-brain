import Link from "next/link";
import { AppShell } from "@/components/AppShell";

const features = [
  { title: "AI Chat", body: "Ask across memory, tasks, Notion, writing, and projects.", href: "/", icon: "✦", tag: "Main" },
  { title: "Capture", body: "Drop thoughts, links, reminders, and notes into your brain.", href: "/capture", icon: "+", tag: "Input" },
  { title: "Memory", body: "Consolidate raw captures into durable personal memories.", href: "/memory", icon: "◇", tag: "Recall" },
  { title: "Tasks", body: "Create, finish, delete, and sync tasks to Notion.", href: "/tasks", icon: "✓", tag: "Action" },
  { title: "Notion", body: "Connect your workspace and choose a default database.", href: "/settings/integrations", icon: "▣", tag: "Sync" },
  { title: "Projects", body: "Organize work into focused spaces.", href: "/projects", icon: "▤", tag: "Work" },
  { title: "Knowledge", body: "Search and reuse saved knowledge.", href: "/knowledge", icon: "⌕", tag: "Search" },
  { title: "Writing", body: "Turn messy notes into clean drafts.", href: "/writing", icon: "✎", tag: "Draft" },
  { title: "Mood", body: "Track emotional context and daily state.", href: "/mood", icon: "◐", tag: "Personal" },
];

export function FeaturesScreen() {
  return (
    <AppShell title="All features" eyebrow="One clean page">
      <section className="grid gap-3 sb-fade-up">
        {features.map((feature, index) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="sb-panel flex items-center gap-4 rounded-[1.7rem] p-4 transition active:scale-[0.98]"
            style={{ animationDelay: `${index * 35}ms` }}
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-white text-2xl font-black text-black">
              {feature.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-100/55">{feature.tag}</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.06em] text-white">{feature.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/50">{feature.body}</p>
            </div>
            <span className="text-2xl text-white/32">›</span>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
