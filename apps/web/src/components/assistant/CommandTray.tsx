"use client";

type CommandItem = {
  label: string;
  description: string;
  insert: string;
};

const slashCommands: CommandItem[] = [
  {
    label: "/notion",
    description: "Create or ask about Notion pages",
    insert: "/notion ",
  },
  {
    label: "/write",
    description: "Open clean writing mode",
    insert: "/write ",
  },
  {
    label: "/task",
    description: "Create a task",
    insert: "/task ",
  },
  {
    label: "/today",
    description: "Plan or review today",
    insert: "/today ",
  },
  {
    label: "/memory",
    description: "Search your Second Brain",
    insert: "/memory ",
  },
];

const mentions: CommandItem[] = [
  {
    label: "@notion",
    description: "Use connected Notion data",
    insert: "@notion ",
  },
  {
    label: "@memory",
    description: "Use memory cards and graph",
    insert: "@memory ",
  },
  {
    label: "@tasks",
    description: "Use saved tasks",
    insert: "@tasks ",
  },
  {
    label: "@writing",
    description: "Use writing blocks",
    insert: "@writing ",
  },
];

function getActiveToken(input: string) {
  const match = input.match(/(?:^|\s)([\/@][^\s]*)$/);
  return match?.[1] || "";
}

export function shouldShowCommandTray(input: string) {
  const token = getActiveToken(input);
  return token.startsWith("/") || token.startsWith("@");
}

export function insertCommandToken(input: string, value: string) {
  const match = input.match(/(?:^|\s)([\/@][^\s]*)$/);

  if (!match || match.index === undefined) {
    return `${input.trimEnd()} ${value}`;
  }

  const tokenStart = input.lastIndexOf(match[1]);

  return `${input.slice(0, tokenStart)}${value}`.replace(/\s+$/, " ");
}

export function CommandTray({
  input,
  onSelect,
}: {
  input: string;
  onSelect: (value: string) => void;
}) {
  const token = getActiveToken(input);
  const isSlash = token.startsWith("/");
  const isMention = token.startsWith("@");

  if (!isSlash && !isMention) return null;

  const query = token.slice(1).toLowerCase();
  const items = (isSlash ? slashCommands : mentions).filter((item) =>
    item.label.toLowerCase().includes(query)
  );

  if (!items.length) return null;

  return (
    <div className="absolute bottom-[5.5rem] left-4 right-4 z-50 mx-auto max-w-md rounded-[1.5rem] bg-white/95 p-2 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(item.insert)}
          className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-pink-50 active:scale-[0.99]"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-950">
              {item.label}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {item.description}
            </p>
          </div>

          <span className="ml-3 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
            Use
          </span>
        </button>
      ))}
    </div>
  );
}
