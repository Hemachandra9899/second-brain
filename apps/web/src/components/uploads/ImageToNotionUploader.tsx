"use client";

import { useRef, useState } from "react";
import { uploadImageToNotion, type NotionImageUploadResponse } from "@/lib/api";

export function ImageToNotionUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [result, setResult] = useState<NotionImageUploadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  function chooseImage() {
    inputRef.current?.click();
  }

  function onFileSelected(selected: File | null) {
    setFile(selected);
    setResult(null);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (selected) {
      setPreviewUrl(URL.createObjectURL(selected));
      setNotice("Image selected. Tap Save to Notion.");
    }
  }

  async function saveToNotion() {
    if (!file) {
      chooseImage();
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const res = await uploadImageToNotion({
        file,
        title: file.name,
        caption,
      });

      setResult(res);
      setNotice("Saved image to Notion.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[2.2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
      <p className="text-xs font-semibold uppercase tracking-wide text-pink-500">
        Image memory
      </p>

      <h2 className="font-display mt-4 text-4xl leading-none tracking-[-0.05em]">
        Save image to Notion.
      </h2>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => onFileSelected(e.target.files?.[0] || null)}
      />

      <button
        type="button"
        onClick={chooseImage}
        className="mt-6 flex min-h-56 w-full items-center justify-center overflow-hidden rounded-[1.8rem] bg-zinc-100 text-center dark:bg-zinc-950"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-semibold text-zinc-500">
            Choose image from phone
          </span>
        )}
      </button>

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Optional caption..."
        className="mt-4 min-h-24 w-full resize-none rounded-[1.5rem] bg-zinc-50 p-4 text-sm outline-none dark:bg-zinc-950"
      />

      <button
        onClick={saveToNotion}
        disabled={loading}
        className="mt-4 w-full rounded-full bg-black px-5 py-4 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black"
      >
        {loading ? "Saving\u2026" : file ? "Save to Notion" : "Upload image"}
      </button>

      {notice ? (
        <p className="mt-4 rounded-2xl bg-pink-50 px-4 py-3 text-sm font-medium text-pink-700 dark:bg-zinc-800 dark:text-zinc-300">
          {notice}
        </p>
      ) : null}

      {result ? (
        <div className="mt-5 rounded-[1.6rem] bg-zinc-50 p-4 dark:bg-zinc-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-500">
            Created in Notion
          </p>

          <h3 className="font-display mt-2 text-2xl leading-none">
            {result.notion_page.title}
          </h3>

          <a
            href={result.notion_page.url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
          >
            {'Open in Notion \u2192'}
          </a>
        </div>
      ) : null}
    </section>
  );
}
