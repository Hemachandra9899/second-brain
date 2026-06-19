"use client";

import { useState } from "react";
import { createTask } from "@/lib/api";

export default function TasksPage() {
  const [title, setTitle] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const task = await createTask({ title });
    setResult(task);
    setTitle("");
  }

  return (
    <main>
      <h1>Tasks</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
        <button type="submit">Create</button>
      </form>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </main>
  );
}
