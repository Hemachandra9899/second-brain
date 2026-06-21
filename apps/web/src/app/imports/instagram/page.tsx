"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { uploadInstagramZip, type InstagramImportResponse } from "@/lib/api";

export default function InstagramImportPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<InstagramImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  function openPicker() {
    inputRef.current?.click();
  }

  async function importFile(selected: File) {
    setFile(selected);
    setLoading(true);
    setResult(null);
    setNotice(`Uploading ${selected.name}...`);

    try {
      const res = await uploadInstagramZip(selected);
      setResult(res);
      setNotice("Instagram ZIP imported into your Second Brain.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Instagram import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-blue-50 text-zinc-950 dark:bg-[#050505] dark:text-white">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-20 pt-10">
        <header className="flex items-center justify-between">
          <Link
            href="/home"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow-sm dark:bg-zinc-900"
          >
            ‹
          </Link>

          <p className="text-sm font-semibold text-zinc-500">
            Instagram import
          </p>

          <Link
            href="/"
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Brain
          </Link>
        </header>

        <section className="mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
            Second Brain
          </p>

          <h1 className="font-display mt-3 text-5xl leading-none tracking-[-0.05em]">
            Import Instagram memory.
          </h1>

          <p className="mt-5 text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Upload your Instagram export ZIP. I&rsquo;ll extract useful captions,
            comments, saved items, and messages into searchable memory.
          </p>
        </section>

        <section className="mt-8 rounded-[2.2rem] bg-white p-6 shadow-sm ring-1 ring-blue-100 dark:bg-zinc-900 dark:ring-white/10">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Upload ZIP
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed,application/octet-stream"
            className="sr-only"
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;

              if (!selected) {
                setNotice("No file selected.");
                return;
              }

              if (!selected.name.toLowerCase().endsWith(".zip")) {
                setNotice("Please choose the Instagram .zip export file.");
                return;
              }

              void importFile(selected);
            }}
          />

          <button
            type="button"
            onClick={openPicker}
            disabled={loading}
            className="mt-5 flex min-h-44 w-full flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-blue-200 bg-blue-50 p-6 text-center active:scale-[0.99] disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950"
          >
            <span className="text-4xl">＋</span>

            <span className="mt-4 text-base font-semibold">
              {file ? file.name : "Choose Instagram ZIP"}
            </span>

            <span className="mt-2 text-xs text-zinc-500">
              {loading ? "Uploading now..." : "Opens your phone file picker"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (file) void importFile(file);
              else openPicker();
            }}
            disabled={loading}
            className="mt-5 w-full rounded-full bg-blue-600 px-5 py-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? "Importing..." : file ? "Import again" : "Upload ZIP"}
          </button>

          {notice ? (
            <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:bg-zinc-800 dark:text-zinc-300">
              {notice}
            </p>
          ) : null}
        </section>

        {result ? (
          <section className="mt-8 rounded-[2.2rem] bg-white p-6 shadow-sm ring-1 ring-blue-100 dark:bg-zinc-900 dark:ring-white/10">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Imported
            </p>

            <h2 className="font-display mt-4 text-4xl leading-none tracking-[-0.05em]">
              {result.imported_items} items found
            </h2>

            <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {result.knowledge_items} memories indexed &middot;{" "}
              {result.activity_events} activity cards created
            </p>

            <div className="mt-6 space-y-3">
              {result.preview.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="rounded-[1.5rem] bg-blue-50 p-4 dark:bg-zinc-950"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                    {item.source_type}
                  </p>
                  <h3 className="mt-2 font-semibold">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                    {item.preview}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/home"
              className="mt-6 inline-flex rounded-full bg-blue-600 px-6 py-4 text-sm font-semibold text-white"
            >
              View in Home &rarr;
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}
