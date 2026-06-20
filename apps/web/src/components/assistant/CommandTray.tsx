"use client";

const slashCommands = [
  {
    label: "/notion",
    description: "Create or search Notion tasks",
    insert: "/notion ",
  },
  {
    label: "/task",
    description: "Create a task",
    insert: "/task ",
  },
  {
    label: "/memory",
    description: "Search your memory",
    insert: "/memory ",
  },
  {
    label: "/today",
    description: "Plan today",
    insert: "/today ",
  },
  {
    label: "/instagram",
    description: "Import or ask about Instagram data",
    insert: "/instagram ",
  },
];

const mentions = [
  {
    label: "@notion",
    description: "Use connected Notion workspace",
    insert: "@notion ",
  },
  {
    label: "@memory",
    description: "Use memory cards and knowledge graph",
    insert: "@memory ",
  },
  {
    label: "@tasks",
    description: "Use task database",
    insert: "@tasks ",
  },
  {
    label: "@projects",
    description: "Use project context",
    insert: "@projects ",
  },
];

export function CommandTray({
  input,
  onSelect,
}: {
  input: string;
  onSelect: (value: string) => void;
}) {
  const trimmed = input.trim();
  const showSlash = trimmed.startsWith("/");
  const showMention = trimmed.includes("@") && !showSlash;

  if (!showSlash && !showMention) return null;

  const items = showSlash ? slashCommands : mentions;

  return (
    <div className="absolute bottom-[5.25rem] left-4 right-4 z-50 mx-auto max-w-md rounded-[1.5rem] bg-white/95 p-2 shadow-2xl backdrop-blur animate-in slide-in-from-bottom-2 duration-200">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => onSelect(item.insert)}
          className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-sky-50 active:scale-[0.99]"
        >
          <div>
            <p className="text-sm font-semibold text-slate-950">{item.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
          </div>

          <span className="text-sm text-sky-600">Insert</span>
        </button>
      ))}
    </div>
  );
}
