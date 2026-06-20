"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { askAssistant } from "@/lib/api";
import { getStoredUser, isSignedIn, logout } from "@/lib/auth";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const starterChips = [
  "Plan my day",
  "Search my memory",
  "Create a task",
  "Capture an idea",
];

const quickCards = [
  {
    title: "Today Brief",
    body: "Summarize my tasks, mood, projects, and what matters next.",
    prompt: "Give me my Today Brief.",
  },
  {
    title: "Search Memory",
    body: "Ask across tasks, notes, memory cards, and graph context.",
    prompt: "What do you remember about my current projects?",
  },
];

export function AssistantScreen() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey, I am your Second Brain. Ask me anything, capture a thought, or plan your day.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const user = getStoredUser();
  const signedIn = isSignedIn();
  const hasStarted = messages.length > 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  async function sendMessage(text?: string) {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content }]);

    try {
      const res = await askAssistant(content);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer || "I could not generate a response.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not reach the backend yet. Once Render is healthy, I will answer using your Second Brain.",
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

  return (
    <main className="min-h-[100dvh] bg-sky-50 text-slate-950">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-gradient-to-b from-sky-100 via-blue-50 to-white shadow-2xl">
        {/* Fixed top bar */}
        <header className="fixed inset-x-0 top-0 z-40 mx-auto max-w-md border-b border-white/50 bg-sky-50/85 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/home")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-2xl text-slate-900 shadow-sm active:scale-95"
              aria-label="Go home"
            >
              ‹
            </button>

            <div className="text-center">
              <p className="text-lg font-semibold tracking-tight text-slate-950">
                Second Brain
              </p>
              <p className="text-[11px] font-medium text-sky-600">
                AI Assistant
              </p>
            </div>

            <button
              onClick={() => setProfileOpen(true)}
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/80 text-sm font-semibold text-slate-900 shadow-sm active:scale-95"
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

        {/* Scrollable chat body */}
        <section className="flex-1 overflow-y-auto px-4 pb-32 pt-24">
          {!hasStarted ? (
            <div className="pb-5">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[1.35rem] bg-slate-950 text-sm font-bold text-white shadow-xl">
                SB
              </div>

              <h1 className="mx-auto max-w-xs text-center text-4xl font-semibold leading-[0.98] tracking-[-0.04em] text-slate-950">
                Ready to organize your second brain?
              </h1>

              <p className="mx-auto mt-4 max-w-xs text-center text-sm leading-6 text-slate-600">
                Ask, capture, plan, or search your personal memory.
              </p>

              {!signedIn ? (
                <div className="mt-5 rounded-[1.75rem] bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm font-semibold text-slate-900">
                    Sign in to save memory
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Keep tasks, notes, mood, projects, and graph memory private
                    to you.
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
                    className="shrink-0 rounded-full bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm active:scale-95"
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
                    className="rounded-[1.75rem] bg-white/85 p-4 text-left shadow-sm active:scale-[0.98]"
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
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[82%] rounded-[1.35rem] rounded-br-md bg-sky-600 px-4 py-3 text-sm leading-6 text-white shadow-sm"
                    : "mr-auto max-w-[86%] rounded-[1.35rem] rounded-bl-md bg-white/90 px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm"
                }
              >
                {message.content}
              </div>
            ))}

            {loading ? (
              <div className="mr-auto max-w-[70%] rounded-[1.35rem] rounded-bl-md bg-white/90 px-4 py-3 text-sm text-slate-500 shadow-sm">
                Thinking...
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>
        </section>

        {/* Fixed bottom chat input */}
        <footer className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-gradient-to-t from-white via-white/95 to-white/40 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActionsOpen(true)}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-3xl text-slate-950 shadow-lg active:scale-95"
              aria-label="Open actions"
            >
              +
            </button>

            <form
              onSubmit={submit}
              className="flex min-w-0 flex-1 items-center rounded-full bg-white px-5 py-4 shadow-lg"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask, capture, or plan anything..."
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
    <div className="fixed inset-0 z-50 bg-slate-950/25 p-4 backdrop-blur-sm">
      <div className="mx-auto mt-auto max-w-md rounded-[2rem] bg-white p-5 shadow-2xl">
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
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/25 p-4 backdrop-blur-sm">
      <div className="mx-auto mt-auto max-w-md rounded-[2rem] bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold">Profile</p>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm"
          >
            Close
          </button>
        </div>

        {signedIn ? (
          <div className="rounded-[1.5rem] bg-sky-50 p-4">
            <div className="flex items-center gap-3">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || "Profile"}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                  SB
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950">
                  {user?.name || "Signed in"}
                </p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="block rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white"
          >
            Continue with Google
          </Link>
        )}

        <div className="mt-4 grid gap-2">
          <Link
            href="/settings/integrations"
            className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-slate-700"
          >
            Connect Notion
          </Link>

          <Link
            href="/imports/instagram"
            className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-slate-700"
          >
            Upload Instagram export
          </Link>

          {signedIn ? (
            <button
              onClick={logout}
              className="rounded-2xl bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-600"
            >
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
