const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function createTask(input: {
  title: string;
  description?: string;
  sync_to_notion?: boolean;
}) {
  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("Failed to create task");
  }

  return res.json();
}

export async function chat(message: string) {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    throw new Error("Chat failed");
  }

  return res.json();
}
