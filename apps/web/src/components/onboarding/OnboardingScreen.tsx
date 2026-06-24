"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

const slides = [
  {
    tag: "Capture",
    title: "Drop every thought into one place.",
    body: "Tasks, ideas, meeting notes, links, and reminders become structured memory.",
    icon: "+",
    gradient: "from-cyan-300/30 via-sky-400/16 to-transparent",
  },
  {
    tag: "Ask",
    title: "Chat with your personal context.",
    body: "Ask about memory, tasks, projects, writing, and Notion without digging.",
    icon: "✦",
    gradient: "from-blue-400/30 via-cyan-300/14 to-transparent",
  },
  {
    tag: "Act",
    title: "Turn messy ideas into actions.",
    body: "Create tasks, sync Notion, and keep your workspace moving cleanly.",
    icon: "✓",
    gradient: "from-teal-300/28 via-cyan-300/12 to-transparent",
  },
];

export function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const last = index === slides.length - 1;

  function next() {
    if (!last) setIndex((value) => value + 1);
  }

  return (
    <main className="sb-shell flex min-h-[100dvh] items-center justify-center px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[88dvh] w-full max-w-md flex-col">
        <header className="flex items-center justify-between">
          <BrandLogo size="sm" wordmark />
          <Link href="/login" className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-bold text-white/70">
            Skip
          </Link>
        </header>

        <div className="flex flex-1 flex-col justify-center py-10">
          <div className={`sb-card relative overflow-hidden rounded-[2.2rem] p-6 bg-gradient-to-br ${slide.gradient}`}>
            <div className="flex h-60 items-center justify-center rounded-[1.8rem] border border-white/10 bg-black/24">
              <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white text-6xl font-black text-black shadow-2xl">
                {slide.icon}
              </div>
            </div>

            <p className="mt-8 text-xs font-black uppercase tracking-[0.34em] text-cyan-100/75">{slide.tag}</p>
            <h1 className="mt-4 text-[2.65rem] font-black leading-[0.95] tracking-[-0.075em] text-white">
              {slide.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-white/62">{slide.body}</p>
          </div>

          <div className="mt-8 flex justify-center gap-2">
            {slides.map((item, itemIndex) => (
              <button
                key={item.title}
                onClick={() => setIndex(itemIndex)}
                className={itemIndex === index ? "h-2 w-7 rounded-full bg-white" : "h-2 w-2 rounded-full bg-white/30"}
                aria-label={`Go to slide ${itemIndex + 1}`}
              />
            ))}
          </div>
        </div>

        {last ? (
          <Link
            href="/login"
            onClick={() => localStorage.setItem("second_brain_onboarded", "true")}
            className="rounded-[1.35rem] bg-white px-5 py-4 text-center text-base font-black text-black active:scale-[0.98]"
          >
            Get started
          </Link>
        ) : (
          <button
            onClick={next}
            className="rounded-[1.35rem] bg-white px-5 py-4 text-base font-black text-black active:scale-[0.98]"
          >
            Continue
          </button>
        )}
      </section>
    </main>
  );
}
