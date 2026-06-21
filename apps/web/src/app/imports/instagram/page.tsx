"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  uploadInstagramZip,
  getInstagramImportJob,
  type InstagramImportStartResponse,
  type InstagramImportJob,
} from "@/lib/api";

export default function InstagramImportPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [start, setStart] = useState<InstagramImportStartResponse | null>(null);
  const [job, setJob] = useState<InstagramImportJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  function openPicker() {
    inputRef.current?.click();
  }

  async function pollJob(jobId: string) {
    const interval = window.setInterval(async () => {
      try {
        const next = await getInstagramImportJob(jobId);
        setJob(next);

        if (next.status === "completed" || next.status === "failed") {
          window.clearInterval(interval);

          if (next.status === "completed") {
            setNotice("Instagram import completed.");
          } else {
            setNotice(next.error || "Instagram import failed.");
          }

          setLoading(false);
        }
      } catch {
        window.clearInterval(interval);
        setNotice("Could not check import status.");
        setLoading(false);
      }
    }, 2000);
  }

  async function importFile(selected: File) {
    setFile(selected);
    setLoading(true);
    setStart(null);
    setJob(null);
    setNotice(`Uploading ${selected.name}...`);

    try {
      const res = await uploadInstagramZip(selected);
      setStart(res);
      setNotice("Import started. Processing in background...");
      void pollJob(res.job_id);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Instagram import failed.");
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

              const MAX_ZIP_MB = 150;
              const MAX_ZIP_BYTES = MAX_ZIP_MB * 1024 * 1024;

              if (selected.size > MAX_ZIP_BYTES) {
                setNotice(
                  `This ZIP is ${Math.round(selected.size / 1024 / 1024)}MB. Please upload an Instagram export under ${MAX_ZIP_MB}MB.`
                );
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

        {job ? (
          <section className="mt-8 rounded-[2.2rem] bg-white p-6 shadow-sm ring-1 ring-blue-100 dark:bg-zinc-900 dark:ring-white/10">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Import progress
            </p>

            <div className="mt-5 rounded-[1.5rem] bg-blue-50 p-4 text-sm text-blue-700">
              <p className="font-semibold">
                Status: {job.status}
              </p>

              <p className="mt-2">
                {job.processed_items} / {job.total_items || "?"} items processed
              </p>

              <p className="mt-1">
                {job.knowledge_items} memories created
              </p>

              {job.error ? (
                <p className="mt-2 text-red-600">
                  {job.error}
                </p>
              ) : null}
            </div>

            {job.status === "completed" && job.knowledge_items > 0 ? (
              <Link
                href="/home"
                className="mt-6 inline-flex rounded-full bg-blue-600 px-6 py-4 text-sm font-semibold text-white"
              >
                View in Home &rarr;
              </Link>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
