"use client";

import { useState } from "react";
import Link from "next/link";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";

export default function WritingPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <main className="min-h-[100dvh] bg-[#f7f7f7] text-slate-950">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-32 pt-10">
        <header className="flex items-center justify-between">
          <Link
            href="/home"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow-sm"
          >
            ‹
          </Link>

          <p className="text-sm font-semibold text-slate-500">Writing block</p>

          <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            Save
          </button>
        </header>

        <section className="mt-8 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full bg-transparent text-4xl font-semibold tracking-[-0.06em] outline-none placeholder:text-slate-300"
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write messy thoughts, todos, goals, plans..."
            className="mt-6 min-h-[55vh] w-full resize-none bg-transparent text-lg leading-8 text-slate-700 outline-none placeholder:text-slate-300"
          />
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <button className="rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            Clean up
          </button>

          <button className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm ring-1 ring-slate-200">
            Send to Notion
          </button>
        </section>
      </div>

      <MobileBottomBar />
    </main>
  );
}
