import Link from "next/link";

export function DataImportCard() {
  return (
    <section className="rounded-[2rem] bg-sky-950 p-5 text-white shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">
        Grow your memory
      </p>

      <h2 className="mt-3 text-2xl font-semibold tracking-tight">
        Upload your data
      </h2>

      <p className="mt-3 text-sm leading-6 text-sky-100">
        Import notes, Notion tasks, Instagram export ZIP, and saved memories into your private Second Brain.
      </p>

      <div className="mt-5 grid gap-2">
        <Link
          href="/imports/instagram"
          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
        >
          Upload Instagram ZIP
        </Link>

        <Link
          href="/settings/integrations"
          className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"
        >
          Connect Notion
        </Link>
      </div>
    </section>
  );
}
