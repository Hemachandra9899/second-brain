"use client";

export function TypingBubble() {
  return (
    <div className="mr-auto flex max-w-[70%] items-center gap-1 rounded-[1.35rem] rounded-bl-md bg-white/95 px-4 py-4 shadow-sm">
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.2s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.1s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
    </div>
  );
}
