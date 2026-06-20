"use client";

import { useEffect, useState } from "react";

const cards = [
  {
    title: "Recent capture",
    body: "Your latest tasks, notes, and ideas appear here as memory activity.",
    cta: "Capture something",
    href: "/capture",
  },
  {
    title: "Connected sources",
    body: "Connect Notion or upload Instagram data to grow your Second Brain.",
    cta: "Manage sources",
    href: "/settings/integrations",
  },
  {
    title: "Memory cards",
    body: "Consolidate raw notes into durable memory cards.",
    cta: "Open memory",
    href: "/memory",
  },
];

export function RecentActivityCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % cards.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, []);

  const card = cards[index];

  return (
    <section className="rounded-[2rem] bg-white/85 p-5 shadow-sm backdrop-blur transition-all duration-300">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
        Recent activity
      </p>

      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {card.title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-600">{card.body}</p>

      <a
        href={card.href}
        className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
      >
        {card.cta} →
      </a>

      <div className="mt-5 flex gap-2">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={
              i === index
                ? "h-2 w-6 rounded-full bg-sky-600"
                : "h-2 w-2 rounded-full bg-slate-300"
            }
            aria-label={`Show card ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
