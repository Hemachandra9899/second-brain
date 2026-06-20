"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { askAssistant } from "@/lib/api";
import { getStoredUser, isSignedIn, logout } from "@/lib/auth";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const chips = [
  "Plan my day",
  "Capture idea",
  "Search memory",
  "Create task",
  "Import data",
];

const insights = [
  {
    title: "Today Brief",
    body: "Ask what matters next across your tasks, memories, mood, and projects.",
  },
  {
    title: "Memory Search",
    body: "Search your personal context graph and source-backed knowledge.",
  },
];

export function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hey, I am your Second Brain. Ask me anything, or capture a task, idea, note, link, or memory.",
    },
  ]);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const user = getStoredUser();
  const signedIn = isSignedIn();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
            "Backend is not reachable yet. Once Render is fixed, I will answer from your Second Brain.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,#ffd6e8_0%,#f7dce8_28%,#edf7ff_68%,#f8fbff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden border-x border-white/50 bg-white/10 shadow-2xl backdrop-blur">
        <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-5">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/45 text-2xl shadow-sm backdrop-blur"
            aria-label="Open menu"
          >
            ‹
          </button>

          <div className="text-center">
            <p className="text-lg font-semibold tracking-tight">AI Assistant</p>
            <p className="text-[11px] font-medium text-pink-600">
              Second Brain model ↻
            </p>
          </div>

          <button
            onClick={() => setProfileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/45 text-lg shadow-sm backdrop-blur"
            aria-label="Open profile"
          >
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name || "Profile"}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              "•••"
            )}
          </button>
        </header>

        <section className="px-5 pt-4 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-slate-950 text-base font-bold text-white shadow-xl">
            SB
          </div>

          <h1 className="mx-auto max-w-sm text-5xl font-semibold leading-[0.95] tracking-[-0.045em] text-slate-950">
            Ready to organize your second brain?
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-600">
            Capture tasks, search memory, plan your day, and connect your knowledge.
          </p>
        </section>

        <section className="mt-8 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              className="shrink-0 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur"
            >
              {chip}
            </button>
          ))}
        </section>

        {!signedIn ? (
          <section className="px-5 pt-4">
            <div className="rounded-[2rem] bg-white/65 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold">Save your memory</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Sign in to keep tasks, knowledge, mood, and memories private to you.
              </p>
              <Link
                href="/login"
                className="mt-3 inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
              >
                Continue with Google
              </Link>
            </div>
          </section>
        ) : null}

        <section className="mt-8 px-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Quick insights</h2>
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-full bg-white/50 px-3 py-1 text-sm"
            >
              ≡
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {insights.map((item) => (
              <button
                key={item.title}
                onClick={() => sendMessage(item.title)}
                className="rounded-[1.75rem] bg-white/75 p-4 text-left shadow-sm backdrop-blur transition active:scale-[0.98]"
              >
                <div className="mb-5 h-20 rounded-[1.25rem] bg-gradient-to-br from-sky-100 via-pink-100 to-white" />
                <p className="text-lg font-semibold tracking-tight">{item.title}</p>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
                  {item.body}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="flex-1 space-y-3 px-5 pb-32 pt-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={
                message.role === "user"
                  ? "ml-10 rounded-[1.75rem] bg-slate-950 px-4 py-3 text-sm leading-6 text-white shadow-sm"
                  : "mr-10 rounded-[1.75rem] bg-white/75 px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm backdrop-blur"
              }
            >
              {message.content}
            </div>
          ))}

          {loading ? (
            <div className="mr-10 rounded-[1.75rem] bg-white/75 px-4 py-3 text-sm text-slate-500 shadow-sm">
              Thinking...
            </div>
          ) : null}

          <div ref={bottomRef} />
        </section>

        <footer className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-gradient-to-t from-white via-white/95 to-transparent px-4 pb-5 pt-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(true)}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-3xl shadow-lg"
            >
              +
            </button>

            <form
              className="flex min-w-0 flex-1 items-center rounded-full bg-white px-4 py-3 shadow-lg"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask, capture, or plan anything..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              <button type="submit" className="ml-2 text-xl">
                {loading ? "…" : "↗"}
              </button>
            </form>
          </div>
        </footer>

        {menuOpen ? <MenuSheet onClose={() => setMenuOpen(false)} /> : null}
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

function MenuSheet({ onClose }: { onClose: () => void }) {
  const items: [string, string][] = [
    ["Home overview", "/home"],
    ["Capture anything", "/capture"],
    ["Memory cards", "/memory"],
    ["Projects", "/projects"],
    ["Tasks", "/tasks"],
    ["Knowledge base", "/knowledge"],
    ["Mood", "/mood"],
    ["Import Instagram ZIP", "/imports/instagram"],
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/25 p-4 backdrop-blur-sm">
      <div className="mx-auto mt-16 max-w-md rounded-[2rem] bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold">Second Brain</p>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1">
            Close
          </button>
        </div>

        <div className="grid gap-2">
          {items.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
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
      <div className="mx-auto mt-16 max-w-md rounded-[2rem] bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-semibold">Profile</p>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1">
            Close
          </button>
        </div>

        {signedIn ? (
          <div className="rounded-[1.5rem] bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || "Profile"}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">
                  SB
                </div>
              )}
              <div>
                <p className="font-semibold">{user?.name || "Signed in"}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
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
            className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
          >
            Connect Notion
          </Link>

          <Link
            href="/imports/instagram"
            className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
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
