const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const token = localStorage.getItem("second_brain_token");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: {
      ...authHeaders(),
    },
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
      ...authHeaders(),
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
      ...authHeaders(),
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
    headers: {
      ...authHeaders(),
    },
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
  return apiPost<{ answer: string; mood?: unknown }>("/chat", { message });
}

export async function chat(message: string) {
  return apiPost<{ answer: string; mood?: unknown }>("/chat", { message });
}

export async function askKnowledge(query: string) {
  return apiPost<{ answer: string; sources: unknown[]; graph_context: unknown[] }>("/knowledge/ask", { query });
}

export async function bootstrapNotion() {
  return apiPost("/integrations/notion/bootstrap", {});
}

export type KnowledgeItem = {
  id: string;
  title: string;
  raw_text: string;
  source_type: string;
  source_id?: string | null;
  created_at?: string | null;
};

export async function getKnowledgeItems() {
  return apiGet<KnowledgeItem[]>("/knowledge/items");
}

export async function createKnowledgeItem(input: {
  title: string;
  raw_text: string;
  source_type?: string;
  source_id?: string;
}) {
  return apiPost<KnowledgeItem>("/knowledge/items", input);
}

export async function detectMood(text: string, recentContext?: string) {
  return apiPost<{ mood: string; theme: unknown }>("/mood/detect", {
    text,
    recent_context: recentContext,
  });
}

export async function getLatestMood() {
  return apiGet<{ mood: string; theme: unknown; created_at?: string | null }>("/mood/latest");
}

export type CaptureResponse = {
  capture_type: string;
  summary?: string;
  suggested_next_action?: string;
  created_task?: Task | null;
  created_knowledge_item?: KnowledgeItem | null;
  answer?: any;
};

export async function captureAnything(text: string) {
  return apiPost<CaptureResponse>("/capture", { text });
}

export type TodayBrief = {
  greeting: string;
  summary: string;
  priorities: {
    title: string;
    reason: string;
    source_type: string;
  }[];
  mood_note: string;
  suggested_next_action: string;
};

export async function getTodayBrief() {
  return apiGet<TodayBrief>("/brief/today");
}

export async function deleteKnowledgeItem(id: string) {
  const res = await fetch(`${API_URL}/knowledge/items/${id}`, {
    method: "DELETE",
    headers: {
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error("Failed to delete knowledge item");
  }

  return res.json();
}
