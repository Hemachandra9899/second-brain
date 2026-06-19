"use client";

import { useState } from "react";
import { chat } from "@/lib/api";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await chat(message);
    setAnswer(res.answer);
    setMessage("");
  }

  return (
    <main>
      <h1>Chat</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask anything"
        />
        <button type="submit">Send</button>
      </form>
      {answer && <p>{answer}</p>}
    </main>
  );
}
