"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { askAssistant, askBrain } from "@/lib/api";
import { getStoredUser, isSignedIn, logout } from "@/lib/auth";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
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
import { TodoPageCard } from "@/components/assistant/TodoPageCard";
import type {
  AssistantResponse,
  BrainAskResponse,
  CreatedTaskCardData,
  NotionPageCardData,
  NotionTodoPageData,
  NotionTodoItemData,
  TaskChoice,
} from "@/lib/api";

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
  notion_todo_page?: NotionTodoPageData | null;
  notion_todo_items?: NotionTodoItemData[];
};

const starterChips = ["Plan today", "Search memory", "Create a task", "Connect Notion"];

function firstName(name?: string | null) {
  return name?.split(" ").filter(Boolean)[0] || "there";
}

export function AssistantScreen() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const user = getStoredUser();
  const signedIn = isSignedIn();
  const hasStarted = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

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
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I could not reach the backend yet. Once the API is healthy, I will answer using your Second Brain.",
        },
      ]);
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

  return (
    <main className="sb-shell min-h-[100dvh] text-white">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
        <header className="fixed inset-x-0 top-0 z-40 mx-auto max-w-md border-b border-white/10 bg-[#090b0f]/88 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.8rem)] backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <Link href="/home" className="flex items-center gap-3 active:scale-95">
              <BrandLogo size="sm" />
              <div>
                <p className="text-sm font-black text-white">Second Brain</p>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/60">AI</p>
              </div>
            </Link>

            <button
              onClick={() => setProfileOpen(true)}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-xs font-black text-white active:scale-95"
              aria-label="Open profile"
            >
              {user?.picture ? <img src={user.picture} alt="" className="h-full w-full object-cover" /> : "••"}
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-5 pb-56 pt-28">
          {!hasStarted ? (
            <div className="pt-[16vh]">
              <p className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-200/60">Hey {firstName(user?.name)}</p>
              <h1 className="mt-3 text-[2rem] font-black leading-[0.95] tracking-[-0.07em] text-white">
                What should we remember?
              </h1>
              <p className="mt-4 max-w-xs text-sm leading-6 text-white/50">
                Ask, capture, search memory, or turn a thought into a task.
              </p>

              {!signedIn ? (
                <Link href="/login" className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-black active:scale-95">
                  Continue with Google
                </Link>
              ) : null}

              <div className="mt-8 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {starterChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="shrink-0 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white/75 active:scale-95"
                  >
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

        <footer className="fixed inset-x-0 bottom-[5.25rem] z-50 mx-auto max-w-md bg-gradient-to-t from-[#090b0f] via-[#090b0f]/94 to-transparent px-4 pb-3 pt-8">
          {trayOpen ? <CommandTray input={input} onSelect={insertCommand} /> : null}

          <form onSubmit={submit} className="flex items-center gap-2 rounded-full border border-white/10 bg-white px-2 py-2 shadow-[0_18px_55px_rgba(0,0,0,0.45)]">
            <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/5 text-2xl text-black active:scale-95">
              +
            </button>
            <input
              id="assistant-input"
              value={input}
              onChange={(e) => {
                const value = e.target.value;
                setInput(value);
                setTrayOpen(shouldShowCommandTray(value));
              }}
              placeholder="Ask Second Brain"
              className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-black outline-none placeholder:text-black/36"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-lg text-white disabled:bg-black/10 disabled:text-black/25"
              aria-label="Send"
            >
              ↑
            </button>
          </form>
        </footer>

        {profileOpen ? (
          <ProfileSheet onClose={() => setProfileOpen(false)} signedIn={signedIn} user={user} />
        ) : null}
      </div>

      <MobileBottomBar />
    </main>
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
  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-black/60 p-4 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md rounded-t-[2rem] border border-white/10 bg-[#101217] p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-lg font-black text-white">Profile</p>
          <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/70">Close</button>
        </div>
        {signedIn ? (
          <div className="rounded-[1.5rem] bg-white/10 p-4">
            <p className="font-black text-white">{user?.name || "Signed in"}</p>
            <p className="mt-1 text-xs text-white/40">{user?.email}</p>
            <button onClick={logout} className="mt-4 rounded-full bg-white px-4 py-2 text-xs font-black text-black">Log out</button>
          </div>
        ) : (
          <Link href="/login" className="block rounded-full bg-white px-5 py-3 text-center text-sm font-black text-black">Continue with Google</Link>
        )}
      </div>
    </div>
  );
}
