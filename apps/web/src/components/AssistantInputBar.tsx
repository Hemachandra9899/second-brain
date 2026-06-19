"use client";

import { FormEvent, useState } from "react";

type Props = {
  onSend: (message: string) => Promise<void> | void;
  placeholder?: string;
};

export function AssistantInputBar({ onSend, placeholder = "Type a message..." }: Props) {
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = message.trim();
    if (!value) return;

    setMessage("");
    await onSend(value);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-20 left-1/2 z-30 flex w-[92%] max-w-md -translate-x-1/2 items-center gap-3 rounded-full bg-white/85 p-2 shadow-xl backdrop-blur-xl md:static md:w-full md:max-w-none md:translate-x-0"
    >
      <button type="button" className="grid h-11 w-11 place-items-center rounded-full bg-sky-100 text-xl text-sky-700">
        +
      </button>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-slate-400"
      />

      <button type="submit" className="grid h-11 w-11 place-items-center rounded-full bg-sky-500 text-white">
        →
      </button>
    </form>
  );
}
