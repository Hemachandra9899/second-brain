"use client";

import { useState } from "react";
import Link from "next/link";
import {
  cleanWriting,
  createWritingDocument,
  extractWritingTasks,
  syncWritingToNotion,
  type WritingBlock,
  type WritingDocument,
  type NotionPageCardData,
} from "@/lib/api";

function BlocksPreview({ blocks }: { blocks: WritingBlock[] }) {
  if (!blocks.length) return null;

  return (
    <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
        Cleaned block
      </p>

      <div className="mt-4 space-y-3">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h2
                key={index}
                className="text-2xl font-semibold tracking-[-0.04em] text-slate-950"
              >
                {block.text}
              </h2>
            );
          }

          if (block.type === "todo") {
            return (
              <label
                key={index}
                className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3"
              >
                <input
                  type="checkbox"
                  checked={Boolean(block.checked)}
                  readOnly
                  className="mt-1 h-4 w-4"
                />
                <span className="text-sm leading-6 text-slate-700">
                  {block.text}
                </span>
              </label>
            );
          }

          return (
            <p key={index} className="text-sm leading-6 text-slate-700">
              {block.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default function WritingPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [blocks, setBlocks] = useState<WritingBlock[]>([]);
  const [cleanedMarkdown, setCleanedMarkdown] = useState("");
  const [savedDoc, setSavedDoc] = useState<WritingDocument | null>(null);
  const [notionPage, setNotionPage] = useState<NotionPageCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleClean() {
    if (!body.trim()) return;

    setLoading(true);
    setNotice("");

    try {
      const cleaned = await cleanWriting(body);
      setTitle((prev) => prev || cleaned.title || "Writing");
      setBlocks(cleaned.blocks || []);
      setCleanedMarkdown(cleaned.cleaned_markdown || "");
      setNotice("Cleaned into a writing block.");
    } catch {
      setNotice("Could not clean this yet. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!body.trim()) return;

    setLoading(true);
    setNotice("");

    try {
      const doc = await createWritingDocument({
        title: title || "Untitled",
        raw_text: body,
        cleaned_markdown: cleanedMarkdown,
        blocks,
        source_type: "manual",
      });

      setSavedDoc(doc);
      setNotice("Saved to your Second Brain.");
    } catch {
      setNotice("Could not save this writing block.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExtractTasks() {
    if (!savedDoc) {
      setNotice("Save the writing block first, then extract tasks.");
      return;
    }

    setLoading(true);

    try {
      const res = await extractWritingTasks(savedDoc.id);
      setNotice(`Created ${res.tasks_created} task(s).`);
    } catch {
      setNotice("Could not extract tasks yet.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncNotion() {
    if (!savedDoc) {
      setNotice("Save the writing block first, then sync to Notion.");
      return;
    }

    setLoading(true);

    try {
      const res = await syncWritingToNotion(savedDoc.id);
      setNotionPage(res.notion_page);
      setNotice("Synced to Notion.");
    } catch {
      setNotice("Could not sync to Notion yet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#f7f7f7] text-slate-950">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-28 pt-10">
        <header className="flex items-center justify-between">
          <Link
            href="/home"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow-sm"
          >
            ‹
          </Link>

          <p className="text-sm font-semibold text-slate-500">Writing block</p>

          <button
            onClick={handleSave}
            disabled={loading || !body.trim()}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
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
            className="mt-6 min-h-[42vh] w-full resize-none bg-transparent text-lg leading-8 text-slate-700 outline-none placeholder:text-slate-300"
          />
        </section>

        {notice ? (
          <div className="mt-4 rounded-2xl bg-sky-50 px-4 py-3 text-sm font-medium text-sky-800">
            {notice}
          </div>
        ) : null}

        <section className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={handleClean}
            disabled={loading || !body.trim()}
            className="rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            Clean
          </button>

          <button
            onClick={handleExtractTasks}
            disabled={loading || !savedDoc}
            className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm ring-1 ring-slate-200 disabled:opacity-40"
          >
            Tasks
          </button>

          <button
            onClick={handleSyncNotion}
            disabled={loading || !savedDoc}
            className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm ring-1 ring-slate-200 disabled:opacity-40"
          >
            Notion
          </button>
        </section>

        <BlocksPreview blocks={blocks} />

        {notionPage ? (
          <div className="mt-4 overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-slate-200">
            <div className="bg-gradient-to-br from-sky-100 to-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                Synced to Notion
              </p>
              <h3 className="mt-2 text-xl font-semibold leading-tight tracking-tight text-slate-950">
                {notionPage.title}
              </h3>
            </div>
            <div className="p-3">
              <a
                href={notionPage.url}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white active:scale-[0.98]"
              >
                Open in Notion →
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
