"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, type WritingDocument } from "@/lib/api";

function BlockView({ block }: { block: any }) {
  if (block.type === "heading") {
    return (
      <h2 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">
        {block.text}
      </h2>
    );
  }

  if (block.type === "todo") {
    return (
      <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
        <input
          type="checkbox"
          checked={Boolean(block.checked)}
          readOnly
          className="mt-1 h-4 w-4"
        />
        <span className="text-sm leading-6 text-slate-700">{block.text}</span>
      </label>
    );
  }

  return <p className="text-base leading-7 text-slate-700">{block.text}</p>;
}

export default function WritingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [doc, setDoc] = useState<WritingDocument | null>(null);

  useEffect(() => {
    apiGet<WritingDocument>(`/writing/documents/${params.id}`)
      .then(setDoc)
      .catch(() => setDoc(null));
  }, [params.id]);

  return (
    <main className="min-h-[100dvh] bg-[#f7f7f7] text-slate-950">
      <div className="mx-auto min-h-[100dvh] max-w-md px-5 pb-20 pt-10">
        <header className="flex items-center justify-between">
          <Link
            href="/home"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow-sm"
          >
            ‹
          </Link>

          <p className="text-sm font-semibold text-slate-500">Writing</p>

          <Link
            href="/writing"
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            New
          </Link>
        </header>

        {!doc ? (
          <div className="mt-8 rounded-[2rem] bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading writing document…
          </div>
        ) : (
          <section className="mt-8 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-slate-950">
              {doc.title}
            </h1>

            <div className="mt-6 space-y-4">
              {doc.blocks?.length ? (
                doc.blocks.map((block, index) => (
                  <BlockView key={index} block={block} />
                ))
              ) : (
                <p className="whitespace-pre-wrap text-base leading-7 text-slate-700">
                  {doc.cleaned_markdown || doc.raw_text}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
