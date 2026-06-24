"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";

const slides = [
  {
    eyebrow: "Capture",
    title: "Save every thought before it disappears.",
    body: "Drop ideas, links, notes, tasks, and messy thoughts into one private AI memory.",
    image:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80",
  },
  {
    eyebrow: "Ask",
    title: "Chat with your own memory, not a blank model.",
    body: "Search your notes, tasks, projects, writing, and connected knowledge through one simple chat.",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
  },
  {
    eyebrow: "Sync",
    title: "Connect Notion and turn ideas into action.",
    body: "Create pages, todos, daily briefs, and project plans without leaving your Second Brain.",
    image:
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80",
  },
];

export function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const slide = slides[index];
  const last = index === slides.length - 1;

  function finish() {
    localStorage.setItem("sb_onboarding_done", "1");
    router.push("/login");
  }

  return (
    <main className="sb-shell min-h-[100dvh] px-5 py-6">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-md flex-col">
        <header className="flex items-center justify-between">
          <BrandLogo size="sm" showText />
          <button
            onClick={finish}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60"
          >
            Skip
          </button>
        </header>

        <div className="flex flex-1 flex-col justify-center py-7 sb-fade-up" key={slide.title}>
          <div className="relative h-[24rem] overflow-hidden rounded-[2.2rem] border border-white/10 bg-white/5 shadow-2xl">
            <img src={slide.image} alt="Second Brain onboarding" className="h-full w-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/90">
                {slide.eyebrow}
              </p>
              <h1 className="mt-3 text-[2.45rem] font-semibold leading-[0.95] tracking-[-0.07em] text-white">
                {slide.title}
              </h1>
              <p className="mt-4 text-[15px] leading-6 text-white/64">{slide.body}</p>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-center gap-2">
            {slides.map((item, dotIndex) => (
              <button
                key={item.title}
                onClick={() => setIndex(dotIndex)}
                className={
                  dotIndex === index
                    ? "h-2.5 w-8 rounded-full bg-white"
                    : "h-2.5 w-2.5 rounded-full bg-white/25"
                }
                aria-label={`Go to onboarding slide ${dotIndex + 1}`}
              />
            ))}
          </div>
        </div>

        <footer className="pb-[calc(env(safe-area-inset-bottom)+0.8rem)]">
          <button
            onClick={() => (last ? finish() : setIndex((value) => value + 1))}
            className="sb-accent-button w-full rounded-[1.4rem] px-5 py-4 text-base font-black active:scale-[0.99]"
          >
            {last ? "Get started" : "Continue"}
          </button>
        </footer>
      </section>
    </main>
  );
}
