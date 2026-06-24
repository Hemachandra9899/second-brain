"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { askAssistant, askBrain, getRecentActivity } from "@/lib/api";
import { getStoredUser, isSignedIn, logout } from "@/lib/auth";
import { ChatBubble } from "@/components/assistant/ChatBubble";
import { CommandTray, insertCommandToken, shouldShowCommandTray } from "@/components/assistant/CommandTray";
import { TypingBubble } from "@/components/assistant/TypingBubble";
import { NotionPageCard, SourceCards, TaskResultCard } from "@/components/assistant/ActionCards";
import { TaskChoiceCards } from "@/components/assistant/TaskChoiceCards";
import { TodoPageCard } from "@/components/assistant/TodoPageCard";
import { SavedInsightsDrawer } from "@/components/assistant/SavedInsightsDrawer";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
import type { AssistantResponse, BrainAskResponse, CreatedTaskCardData, NotionPageCardData, NotionTodoItemData, NotionTodoPageData, TaskChoice, ActivityEvent } from "@/lib/api";

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
  "/notion Create a task for today",
  "Search my recent tasks",
];

const quickCards = [
  { title: "Today Brief", body: "Summarize tasks, memory, and next action.", prompt: "/today Give me my Today Brief.", icon: "☀" },
  { title: "Memory Search", body: "Ask across saved notes and context.", prompt: "@memory What did I capture recently?", icon: "◇" },
  { title: "Notion Task", body: "Create a Notion-synced action item.", prompt: "/notion Create a task for today: review my Second Brain demo.", icon: "▣" },
];

export function AssistantScreen() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey — I’m your Second Brain. Ask me anything, search memory, or turn a thought into action." },
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
    getRecentActivity().then(setActivityEvents).catch(() => setActivityEvents([]));
  }, []);

  function shouldUseBrainAsk(message: string) {
    const text = message.trim().toLowerCase();
    return text.includes("@memory") || text.includes("@notion") || text.includes("@tasks") || text.includes("@writing") || text.startsWith("/memory") || text.startsWith("/today") || text.startsWith("/write");
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
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content }]);

    try {
      const res = shouldUseBrainAsk(content) ? await askBrain(content, inferSourceHint(content)) : await askAssistant(content);
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
    setTrayOpen(false);
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
    const delta = endX - touchStartX;
    if (touchStartX < 40 && delta > 80) setDrawerOpen(true);
    setTouchStartX(null);
  }

  return (
    <main onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="sb-shell min-h-[100dvh] text-white">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
        <header className="fixed inset-x-0 top-0 z-40 mx-auto max-w-md bg-gradient-to-b from-[#030607] via-[#030607]/90 to-transparent px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <Link href="/home"><BrandLogo size="sm" wordmark /></Link>
            <div className="flex items-center gap-3">
              <button onClick={() => setDrawerOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-xl">⌕</button>
              <button onClick={() => setProfileOpen(true)} className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/8 text-sm font-black">
                {user?.picture ? <img src={user.picture} alt={user.name || "Profile"} className="h-full w-full object-cover" /> : "••"}
              </button>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-5 pb-52 pt-28">
          {!hasStarted ? (
            <div className="pb-8 sb-fade-up">
              <p className="text-xs font-black uppercase tracking-[0.34em] text-cyan-200/70">AI Brain</p>
              <h1 className="mt-6 text-[3.75rem] font-black leading-[0.88] tracking-[-0.095em] text-white">
                What can I help you remember?
              </h1>
              <p className="mt-5 text-base leading-7 text-white/55">
                Ask, capture, search memory, create tasks, or send work to Notion.
              </p>

              {!signedIn ? (
                <Link href="/login" className="mt-6 block rounded-[1.5rem] bg-white p-5 text-black">
                  <p className="text-base font-black">Sign in to save memory</p>
                  <p className="mt-2 text-sm leading-5 text-black/58">Keep tasks, notes, mood, projects, and Notion sync private.</p>
                </Link>
              ) : null}

              <div className="-mx-5 mt-8 flex gap-3 overflow-x-auto px-5 pb-4 no-scrollbar sb-card-scroll">
                {quickCards.map((card) => (
                  <button key={card.title} onClick={() => sendMessage(card.prompt)} className="sb-card h-48 w-40 shrink-0 rounded-[1.7rem] p-4 text-left active:scale-[0.98]">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-black text-black">{card.icon}</span>
                    <h3 className="mt-10 text-2xl font-black leading-none tracking-[-0.06em] text-white">{card.title}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/48">{card.body}</p>
                  </button>
                ))}
              </div>

              <div className="mt-2 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {starterChips.map((chip) => (
                  <button key={chip} onClick={() => sendMessage(chip)} className="shrink-0 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-bold text-white/68 active:scale-95">
                    {chip}
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
                  <div className="mr-auto max-w-[92%]">
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

        <footer className="fixed inset-x-0 z-40 mx-auto max-w-md px-5 pb-3 bottom-[calc(env(safe-area-inset-bottom)+5.8rem)]">
          {trayOpen ? <CommandTray input={input} onSelect={insertCommand} /> : null}
          <div className="flex items-end gap-3 rounded-[2rem] border border-white/10 bg-[#0b1113]/94 p-2 shadow-2xl backdrop-blur-2xl">
            <button onClick={() => setActionsOpen(true)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-light text-black">+</button>
            <form onSubmit={submit} className="flex min-w-0 flex-1 items-center">
              <input
                id="assistant-input"
                value={input}
                onChange={(e) => {
                  const value = e.target.value;
                  setInput(value);
                  setTrayOpen(shouldShowCommandTray(value));
                }}
                placeholder="Ask your Brain..."
                className="min-w-0 flex-1 bg-transparent px-2 py-3 text-[15.5px] font-medium text-white outline-none placeholder:text-white/32"
              />
              <button type="submit" disabled={loading || !input.trim()} className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-100 text-xl text-black disabled:opacity-25">↑</button>
            </form>
          </div>
        </footer>

        {actionsOpen ? <ActionsSheet onClose={() => setActionsOpen(false)} /> : null}
        {profileOpen ? <ProfileSheet onClose={() => setProfileOpen(false)} signedIn={signedIn} user={user} /> : null}
        <SavedInsightsDrawer open={drawerOpen} events={activityEvents.filter((event) => ["notion_page_created", "writing_saved", "memory_card_created"].includes(event.event_type))} onClose={() => setDrawerOpen(false)} />
      </div>
      <MobileBottomBar />
    </main>
  );
}

function ActionsSheet({ onClose }: { onClose: () => void }) {
  const items: [string, string][] = [
    ["Capture anything", "/capture"],
    ["All features", "/features"],
    ["Memory cards", "/memory"],
    ["Tasks", "/tasks"],
    ["Connect Notion", "/settings/integrations"],
    ["Projects", "/projects"],
    ["Knowledge base", "/knowledge"],
    ["Mood", "/mood"],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/55 p-4 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md rounded-t-[2rem] border border-white/10 bg-[#0d1316] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-black text-white">Features</p>
          <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white/65">Close</button>
        </div>
        <div className="grid gap-2">
          {items.map(([label, href]) => (
            <Link key={href} href={href} onClick={onClose} className="rounded-2xl bg-white/7 px-4 py-3 text-sm font-bold text-white/78">{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileSheet({ onClose, signedIn, user }: { onClose: () => void; signedIn: boolean; user: { name?: string; email?: string; picture?: string } | null }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/55 p-4 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md rounded-t-[2rem] border border-white/10 bg-[#0d1316] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-black text-white">Profile</p>
          <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white/65">Close</button>
        </div>
        {signedIn ? (
          <div className="rounded-[1.5rem] bg-white/7 p-4">
            <div className="flex items-center gap-3">
              {user?.picture ? <img src={user.picture} alt={user.name || "Profile"} className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-black text-black">U</div>}
              <div className="min-w-0">
                <p className="truncate font-black text-white">{user?.name || "Signed in"}</p>
                <p className="truncate text-xs text-white/42">{user?.email}</p>
              </div>
            </div>
            <button onClick={logout} className="mt-4 w-full rounded-full bg-white px-4 py-3 text-sm font-black text-black">Log out</button>
          </div>
        ) : (
          <Link href="/login" className="block rounded-full bg-white px-5 py-3 text-center text-sm font-black text-black">Continue with Google</Link>
        )}
      </div>
    </div>
  );
}
