"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { askAssistant, askBrain } from "@/lib/api";
import { getStoredUser, isSignedIn, logout } from "@/lib/auth";
import { useTheme } from "@/components/theme/ThemeProvider";
import { ChatBubble } from "@/components/assistant/ChatBubble";
import {
  CommandTray,
  insertCommandToken,
  shouldShowCommandTray,
} from "@/components/assistant/CommandTray";
import { TypingBubble } from "@/components/assistant/TypingBubble";
import {
  NotionPageCard,
  SourceCards,
  TaskResultCard,
} from "@/components/assistant/ActionCards";
import { TaskChoiceCards } from "@/components/assistant/TaskChoiceCards";
import type {
  AssistantResponse,
  BrainAskResponse,
  CreatedTaskCardData,
  NotionPageCardData,
  TaskChoice,
  ActivityEvent,
} from "@/lib/api";
import { getRecentActivity } from "@/lib/api";
import { SavedInsightsDrawer } from "@/components/assistant/SavedInsightsDrawer";

type Message = {
  role: "user" | "assistant";
  content: string;
  notion_page?: NotionPageCardData | null;
  created_task?: CreatedTaskCardData | null;
  task_choices?: TaskChoice[];
  sources?: {
    title: string;
    url?: string | null;
    id?: string | null;
    type: string;
    preview?: string | null;
  }[];
};

const starterChips = [
  "Plan my day",
  "Create a task",
  "Search memory",
  "Connect Notion",
];

const quickCards = [
  {
    title: "Today Brief",
    body: "Summarize tasks, mood, projects, and next action.",
    prompt: "/today Give me my Today Brief.",
  },
  {
    title: "Notion Task",
    body: "Create tasks in Notion after connecting workspace.",
    prompt: "/notion Create a task for today: review my Second Brain demo.",
  },
];

export function AssistantScreen() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey, I'm your Second Brain. Ask me anything, capture a thought, or plan your day.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const user = getStoredUser();
  const signedIn = isSignedIn();
  const hasStarted = messages.length > 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  useEffect(() => {
    getRecentActivity()
      .then(setActivityEvents)
      .catch(() => setActivityEvents([]));
  }, []);

  function shouldUseBrainAsk(message: string) {
    const text = message.trim().toLowerCase();
    return (
      text.includes("@memory") ||
      text.includes("@notion") ||
      text.includes("@tasks") ||
      text.includes("@writing") ||
      text.startsWith("/memory") ||
      text.startsWith("/today") ||
      text.startsWith("/write")
    );
  }

  function inferSourceHint(message: string) {
    const text = message.trim().toLowerCase();
    if (text.includes("@notion") || text.startsWith("/notion")) return "notion";
    if (text.includes("@tasks") || text.startsWith("/today")) return "tasks";
    if (text.includes("@writing") || text.startsWith("/write")) return "writing";
    if (text.includes("@memory") || text.startsWith("/memory")) return "memory";
    return "all";
  }

  function addAssistantMessage(content: string) {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content,
      },
    ]);
  }

  function getNotionPage(res: AssistantResponse | BrainAskResponse) {
    return "notion_page" in res ? res.notion_page || null : null;
  }

  function getCreatedTask(res: AssistantResponse | BrainAskResponse) {
    return "created_task" in res ? res.created_task || null : null;
  }

  function getTaskChoices(res: AssistantResponse | BrainAskResponse) {
    return "task_choices" in res ? res.task_choices || [] : [];
  }

  async function sendMessage(text?: string) {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content }]);

    try {
      const res = shouldUseBrainAsk(content)
        ? await askBrain(content, inferSourceHint(content))
        : await askAssistant(content);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer || "I could not generate a response.",
          notion_page: getNotionPage(res),
          created_task: getCreatedTask(res),
          task_choices: getTaskChoices(res),
          sources: res.sources || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not reach the backend yet. Once Render is healthy, I'll answer using your Second Brain.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setTrayOpen(false);
    sendMessage();
  }

  function insertCommand(value: string) {
    setInput((prev) => insertCommandToken(prev, value));
    setTrayOpen(false);

    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLInputElement>("#assistant-input");
      el?.focus();
    });
  }

  function onTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return;

    const endX = e.changedTouches[0].clientX;
    const delta = endX - touchStartX;

    if (touchStartX < 40 && delta > 80) {
      setDrawerOpen(true);
    }

    setTouchStartX(null);
  }

  return (
    <main
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="min-h-[100dvh] bg-sky-50 text-slate-950 transition-colors dark:bg-[#050505] dark:text-white"
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-gradient-to-b from-sky-100 via-blue-50 to-white shadow-2xl dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
        <header className="fixed inset-x-0 top-0 z-40 mx-auto max-w-md border-b border-white/60 bg-sky-50/90 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/home")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-2xl text-slate-900 shadow-sm transition active:scale-95 dark:bg-zinc-900 dark:text-white"
              aria-label="Go home"
            >
              ‹
            </button>

            <div className="text-center">
              <p className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
                Second Brain
              </p>
              <p className="text-[11px] font-medium text-sky-600 dark:text-sky-400">
                AI Assistant
              </p>
            </div>

            <button
              onClick={() => setProfileOpen(true)}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/85 text-sm font-semibold text-slate-900 shadow-sm transition active:scale-95 dark:bg-zinc-900 dark:text-white"
              aria-label="Open profile"
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || "Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                "•••"
              )}
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 pb-32 pt-24">
          {!hasStarted ? (
            <div className="pb-5 transition-all duration-300">
              <h1 className="mx-auto max-w-xs text-center text-4xl font-semibold leading-[0.98] tracking-[-0.04em] text-slate-950">
                Ready to organize your second brain?
              </h1>

              <p className="mx-auto mt-4 max-w-xs text-center text-sm leading-6 text-slate-600">
                Ask, capture, plan, search memory, or send commands with /.
              </p>

              {!signedIn ? (
                <div className="mt-5 rounded-[1.75rem] bg-white/85 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm font-semibold text-slate-900">
                    Sign in to save memory
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Keep tasks, notes, mood, projects, and graph memory private.
                  </p>
                  <Link
                    href="/login"
                    className="mt-3 inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Continue with Google
                  </Link>
                </div>
              ) : null}

              <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
                {starterChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="shrink-0 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition active:scale-95"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {quickCards.map((card) => (
                  <button
                    key={card.title}
                    onClick={() => sendMessage(card.prompt)}
                    className="rounded-[1.75rem] bg-white/90 p-4 text-left shadow-sm transition active:scale-[0.98]"
                  >
                    <div className="mb-4 h-20 rounded-[1.25rem] bg-gradient-to-br from-sky-100 via-blue-100 to-white" />
                    <p className="text-lg font-semibold tracking-tight">
                      {card.title}
                    </p>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
                      {card.body}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            {messages.map((message, index) => (
              <div key={index}>
                <ChatBubble
                  role={message.role}
                  content={message.content}
                />

                {message.role === "assistant" ? (
                  <div className="mr-auto max-w-[88%]">
                    {message.created_task ? (
                      <TaskResultCard task={message.created_task} />
                    ) : null}

                    {message.task_choices?.length ? (
                      <TaskChoiceCards
                        tasks={message.task_choices}
                        onCompleted={addAssistantMessage}
                      />
                    ) : null}

                    {message.notion_page ? (
                      <NotionPageCard page={message.notion_page} />
                    ) : null}

                    <SourceCards sources={message.sources} />
                  </div>
                ) : null}
              </div>
            ))}

            {loading ? (
              <TypingBubble />
            ) : null}

            <div ref={bottomRef} />
          </div>
        </section>

        <footer className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-gradient-to-t from-white via-white/95 to-white/40 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 dark:from-zinc-950 dark:via-zinc-950/95 dark:to-zinc-950/40">
          {trayOpen ? (
            <CommandTray input={input} onSelect={insertCommand} />
          ) : null}

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActionsOpen(true)}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-3xl text-slate-950 shadow-lg transition active:scale-95"
              aria-label="Open actions"
            >
              +
            </button>

            <form
              onSubmit={submit}
              className="flex min-w-0 flex-1 items-center rounded-full bg-white px-5 py-4 shadow-lg"
            >
              <input
                id="assistant-input"
                value={input}
                onChange={(e) => {
                  const value = e.target.value;
                  setInput(value);
                  setTrayOpen(shouldShowCommandTray(value));
                }}
                placeholder="Ask, /command, or @mention..."
                className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-slate-800 outline-none placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="ml-3 text-2xl text-slate-950 disabled:opacity-30"
                aria-label="Send"
              >
                ↗
              </button>
            </form>
          </div>
        </footer>

        {actionsOpen ? (
          <ActionsSheet onClose={() => setActionsOpen(false)} />
        ) : null}

        {profileOpen ? (
          <ProfileSheet
            onClose={() => setProfileOpen(false)}
            signedIn={signedIn}
            user={user}
          />
        ) : null}

        <SavedInsightsDrawer
          open={drawerOpen}
          events={activityEvents.filter((event) =>
            ["notion_page_created", "writing_saved", "memory_card_created"].includes(
              event.event_type
            )
          )}
          onClose={() => setDrawerOpen(false)}
        />
      </div>
    </main>
  );
}

function ActionsSheet({ onClose }: { onClose: () => void }) {
  const items: [string, string][] = [
    ["Home overview", "/home"],
    ["Capture anything", "/capture"],
    ["Import Instagram ZIP", "/imports/instagram"],
    ["Memory cards", "/memory"],
    ["Projects", "/projects"],
    ["Tasks", "/tasks"],
    ["Knowledge base", "/knowledge"],
    ["Mood", "/mood"],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/25 p-4 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md rounded-t-[2rem] bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold">Actions</p>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm"
          >
            Close
          </button>
        </div>

        <div className="grid gap-2">
          {items.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-slate-700"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileSheet({
  onClose,
  signedIn,
  user,
}: {
  onClose: () => void;
  signedIn: boolean;
  user: { name?: string; email?: string; picture?: string } | null;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/25 p-4 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md rounded-t-[2rem] bg-white p-5 shadow-2xl dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold text-slate-950 dark:text-white">
            Profile
          </p>

          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Close
          </button>
        </div>

        {signedIn ? (
          <div className="rounded-[1.5rem] bg-sky-50 p-4 dark:bg-zinc-800">
            <div className="flex items-center gap-3">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || "Profile"}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                  U
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950 dark:text-white">
                  {user?.name || "Signed in"}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="block rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
          >
            Continue with Google
          </Link>
        )}

        <div className="mt-4 grid gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-2xl bg-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          </button>

          <Link
            href="/settings/integrations"
            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Connect Notion
          </Link>

          <Link
            href="/imports/instagram"
            className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Upload Instagram export
          </Link>

          {signedIn ? (
            <button
              onClick={logout}
              className="rounded-2xl bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-600 dark:bg-red-950/30"
            >
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
