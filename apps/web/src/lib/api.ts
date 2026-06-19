const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`GET ${path} failed`);
  }

  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${text}`);
  }

  return res.json();
}

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  due_date?: string | null;
  source?: string | null;
};

export async function getTasks() {
  return apiGet<Task[]>("/tasks");
}

export async function createTask(input: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  sync_to_notion?: boolean;
}) {
  return apiPost<Task>("/tasks", input);
}

export async function patchTask(
  id: string,
  input: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    due_date?: string;
    sync_to_notion?: boolean;
  }
) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("Failed to update task");
  }

  return res.json();
}

export async function deleteTask(id: string) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete task");
  }

  return res.json();
}

export async function getScheduledTasks() {
  return apiGet<Task[]>("/tasks/scheduled");
}

export async function syncTaskToNotion(id: string) {
  return apiPost<Task>(`/tasks/${id}/sync/notion`, {});
}

export async function askAssistant(message: string) {
  return apiPost<{ answer: string }>("/chat", { message });
}

export async function askKnowledge(query: string) {
  return apiPost<{ answer: string; sources: unknown[] }>("/knowledge/ask", { query });
}

export async function bootstrapNotion() {
  return apiPost("/integrations/notion/bootstrap", {});
}
