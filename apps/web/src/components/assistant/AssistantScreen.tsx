"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { askAssistant, askBrain, getRecentActivity } from "@/lib/api";
import { getStoredUser, isSignedIn, logout } from "@/lib/auth";
import { useTheme } from "@/components/theme/ThemeProvider";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ChatBubble } from "@/components/assistant/ChatBubble";
import { CommandTray, insertCommandToken, shouldShowCommandTray } from "@/components/assistant/CommandTray";
import { TypingBubble } from "@/components/assistant/TypingBubble";
import { NotionPageCard, SourceCards, TaskResultCard } from "@/components/assistant/ActionCards";
import { TaskChoiceCards } from "@/components/assistant/TaskChoiceCards";
import { TodoPageCard } from "@/components/assistant/TodoPageCard";
import { SavedInsightsDrawer } from "@/components/assistant/SavedInsightsDrawer";
import type {
  AssistantResponse,
  BrainAskResponse,
  CreatedTaskCardData,
  NotionPageCardData,
  NotionTodoItemData,
  NotionTodoPageData,
  TaskChoice,
  ActivityEvent,
} from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  notion_page?: NotionPageCardData | null;
  created_task?: CreatedTaskCardData | null;
  task_choices?: TaskChoice[];
  sources?: { title: string; url?: string | null; id?: string | null; type: string; preview?: string | null }[];
  notion_todo_page?: NotionTodoPageData | null;
  notion_todo_items?: NotionTodoItemData[];
};

const starterChips = [
  "/today Give me my Today Brief",
  "@memory What should I remember?",
  "@notion Create a page from this idea",
  "Create a task for today",
];

const actionItems: [string, string, string][] = [
  ["Home", "/home", "Open your command center"],
  ["Capture", "/capture", "Save any thought quickly"],
  ["Memory", "/memory", "Browse saved memory"],
  ["Tasks", "/tasks", "Review open work"],
  ["Projects", "/projects", "See project spaces"],
  ["Notion", "/settings/integrations", "Connect workspace"],
];

export function AssistantScreen() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
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
  const hasStarted = messages.length > 0;

  useEffect(() => {
    const seen = typeof window !== "undefined" && localStorage.getItem("sb_onboarding_done") === "1";
    if (!isSignedIn() && !seen) router.replace("/onboarding");
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  useEffect(() => {
    getRecentActivity().then(setActivityEvents).catch(() => setActivityEvents([]));
  }, []);

  function shouldUseBrainAsk(message: string) {
    const text = message.trim().toLowerCase();
    return (
      text.includes("@memory") || text.includes("@notion") || text.includes("@tasks") || text.includes("@writing") ||
      text.startsWith("/memory") || text.startsWith("/today") || text.startsWith("/write")
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
    setMessages((prev) => [...prev, { role: "assistant", content }]);
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
  function getNotionTodoPage(res: AssistantResponse | BrainAskResponse) {
    return "notion_todo_page" in res ? res.notion_todo_page || null : null;
  }
  function getNotionTodoItems(res: AssistantResponse | BrainAskResponse) {
    return "notion_todo_items" in res ? res.notion_todo_items || [] : [];
  }

  async function sendMessage(text?: string) {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");
    setTrayOpen(false);
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
          notion_todo_page: getNotionTodoPage(res),
          notion_todo_items: getNotionTodoItems(res),
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "I could not reach the backend yet. Once the API is healthy, I’ll answer using your Second Brain." }]);
    } finally {
      setLoading(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  function insertCommand(value: string) {
    setInput((prev) => insertCommandToken(prev, value));
    setTrayOpen(false);
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>("#assistant-input")?.focus());
  }

  function onTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return;
    const endX = e.changedTouches[0].clientX;
    if (touchStartX < 40 && endX - touchStartX > 80) setDrawerOpen(true);
    setTouchStartX(null);
  }

  return (
    <main onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="sb-shell text-white">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
        <header className="fixed inset-x-0 top-0 z-40 mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+0.9rem)]">
          <div className="sb-glass flex items-center justify-between rounded-[1.6rem] px-3 py-2.5">
            <Link href="/home" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white">‹</Link>
            <BrandLogo size="sm" showText />
            <button onClick={() => setProfileOpen(true)} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10 text-sm font-bold text-white" aria-label="Open profile">
              {user?.picture ? <img src={user.picture} alt={user.name || "Profile"} className="h-full w-full object-cover" /> : "••"}
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 pb-36 pt-28">
          {!hasStarted ? (
            <div className="flex min-h-[calc(100dvh-15rem)] flex-col justify-center pb-8 text-center sb-fade-up">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/70">Second Brain chat</p>
              <h1 className="mx-auto mt-4 max-w-sm text-[3.35rem] font-semibold leading-[0.92] tracking-[-0.085em] text-white">
                What can I help you remember?
              </h1>
              <p className="mx-auto mt-5 max-w-xs text-[15px] leading-6 text-white/48">
                Ask, capture, search memory, create tasks, or send things to Notion.
              </p>

              {!signedIn ? (
                <Link href="/login" className="mx-auto mt-7 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-black">
                  Continue with Google
                </Link>
              ) : null}

              <div className="mt-8 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {starterChips.map((chip) => (
                  <button key={chip} onClick={() => sendMessage(chip)} className="shrink-0 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-white/75 active:scale-95">
                    {chip.replace("/today ", "")}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            {messages.map((message, index) => (
              <div key={index}>
                <ChatBubble role={message.role} content={message.content} />
                {message.role === "assistant" ? (
                  <div className="mr-auto max-w-[88%]">
                    {message.created_task ? <TaskResultCard task={message.created_task} /> : null}
                    {message.task_choices?.length ? <TaskChoiceCards tasks={message.task_choices} onCompleted={addAssistantMessage} /> : null}
                    {message.notion_page ? <NotionPageCard page={message.notion_page} /> : null}
                    {message.notion_todo_page && message.notion_todo_items ? <TodoPageCard page={message.notion_todo_page} items={message.notion_todo_items} /> : null}
                    <SourceCards sources={message.sources} />
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? <TypingBubble /> : null}
            <div ref={bottomRef} />
          </div>
        </section>

        <footer className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-gradient-to-t from-[#050608] via-[#050608]/96 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-8">
          {trayOpen ? <CommandTray input={input} onSelect={insertCommand} /> : null}
          <div className="flex items-center gap-3 rounded-[1.7rem] border border-white/10 bg-white/[0.07] p-2 shadow-2xl backdrop-blur-2xl">
            <button onClick={() => setActionsOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl text-black active:scale-95" aria-label="Open actions">+</button>
            <form onSubmit={submit} className="flex min-w-0 flex-1 items-center">
              <input
                id="assistant-input"
                value={input}
                onChange={(e) => {
                  const value = e.target.value;
                  setInput(value);
                  setTrayOpen(shouldShowCommandTray(value));
                }}
                placeholder="Ask anything..."
                className="min-w-0 flex-1 bg-transparent px-1 text-[15.5px] font-medium text-white outline-none placeholder:text-white/28"
              />
              <button type="submit" disabled={loading || !input.trim()} className="ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-black disabled:opacity-25" aria-label="Send">↑</button>
            </form>
          </div>
        </footer>

        {actionsOpen ? <ActionsSheet onClose={() => setActionsOpen(false)} /> : null}
        {profileOpen ? <ProfileSheet onClose={() => setProfileOpen(false)} signedIn={signedIn} user={user} /> : null}
        <SavedInsightsDrawer open={drawerOpen} events={activityEvents.filter((event) => ["notion_page_created", "writing_saved", "memory_card_created"].includes(event.event_type))} onClose={() => setDrawerOpen(false)} />
      </div>
    </main>
  );
}

function ActionsSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/55 p-4 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md rounded-t-[2rem] border border-white/10 bg-[#090c10] p-5 shadow-2xl sb-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xl font-semibold tracking-[-0.05em] text-white">Actions</p>
          <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70">Close</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {actionItems.map(([label, href, body]) => (
            <Link key={href} href={href} onClick={onClose} className="rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-4 text-left active:scale-[0.98]">
              <p className="font-semibold text-white">{label}</p>
              <p className="mt-1 text-xs leading-5 text-white/42">{body}</p>
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
    <div className="fixed inset-0 z-50 flex items-end bg-black/55 p-4 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md rounded-t-[2rem] border border-white/10 bg-[#090c10] p-5 shadow-2xl sb-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xl font-semibold tracking-[-0.05em] text-white">Profile</p>
          <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/70">Close</button>
        </div>

        {signedIn ? (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-4">
            <div className="flex items-center gap-3">
              {user?.picture ? <img src={user.picture} alt={user.name || "Profile"} className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-black text-black">U</div>}
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{user?.name || "Signed in"}</p>
                <p className="truncate text-xs text-white/42">{user?.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <Link href="/login" className="block rounded-full bg-white px-5 py-3 text-center text-sm font-black text-black">Continue with Google</Link>
        )}

        <div className="mt-4 grid gap-2">
          <button onClick={toggleTheme} className="rounded-2xl bg-white/[0.055] px-4 py-3 text-left text-sm font-semibold text-white/72">
            {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          </button>
          <Link href="/settings/integrations" className="rounded-2xl bg-white/[0.055] px-4 py-3 text-sm font-semibold text-white/72">Connect Notion</Link>
          <Link href="/imports/instagram" className="rounded-2xl bg-white/[0.055] px-4 py-3 text-sm font-semibold text-white/72">Upload Instagram export</Link>
          {signedIn ? <button onClick={logout} className="rounded-2xl bg-white/[0.055] px-4 py-3 text-left text-sm font-semibold text-red-200">Logout</button> : null}
        </div>
      </div>
    </div>
  );
}
