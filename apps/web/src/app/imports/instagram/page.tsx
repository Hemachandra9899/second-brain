"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { uploadInstagramZip, type InstagramImportResponse } from "@/lib/api";

export default function InstagramImportPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<InstagramImportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function upload() {
    if (!file) {
      fileInputRef.current?.click();
      return;
    }

    setLoading(true);
    setNotice("");
    setResult(null);

    try {
      const res = await uploadInstagramZip(file);
      setResult(res);
      setNotice("Instagram data imported into your Second Brain.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  function chooseFile() {
    fileInputRef.current?.click();
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
            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            Brain
          </Link>
        </header>

        <section className="mt-10">
          <h1 className="font-display text-5xl leading-none tracking-[-0.05em]">
            Import Instagram memory.
          </h1>

          <p className="mt-5 text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Upload your Instagram data export. I'll turn posts, captions,
            comments, saved items, and messages into searchable memory.
          </p>
        </section>

        <section className="mt-8 rounded-[2.2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Upload ZIP
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="sr-only"
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              setFile(selected);
              setNotice(selected ? "ZIP selected. Tap Import to upload." : "");
            }}
          />

          <button
            type="button"
            onClick={chooseFile}
            className="mt-5 flex min-h-44 w-full flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-blue-200 bg-white p-6 text-center active:scale-[0.99] dark:border-zinc-700 dark:bg-zinc-950"
          >
            <span className="text-4xl">＋</span>

            <span className="mt-4 text-base font-semibold">
              {file ? file.name : "Choose Instagram ZIP"}
            </span>

            <span className="mt-2 text-xs text-zinc-500">
              Opens your phone file picker
            </span>
          </button>

          <button
            type="button"
            onClick={upload}
            disabled={loading}
            className="mt-5 w-full rounded-full bg-black px-5 py-4 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black"
          >
            {loading ? "Importing\u2026" : file ? "Import to Second Brain" : "Upload ZIP"}
          </button>

          {notice ? (
            <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:bg-zinc-800 dark:text-zinc-300">
              {notice}
            </p>
          ) : null}
        </section>

        {result ? (
          <section className="mt-8 rounded-[2.2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Imported
            </p>

            <h2 className="font-display mt-4 text-4xl leading-none tracking-[-0.05em]">
              {result.imported_items} items found
            </h2>

            <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {result.knowledge_items} memories indexed {'\u00B7'}{" "}
              {result.activity_events} activity cards created
            </p>

            <div className="mt-6 space-y-3">
              {result.preview.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="rounded-[1.5rem] bg-zinc-50 p-4 dark:bg-zinc-950"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
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
              className="mt-6 inline-flex rounded-full bg-black px-6 py-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              {'View in Home \u2192'}
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}
