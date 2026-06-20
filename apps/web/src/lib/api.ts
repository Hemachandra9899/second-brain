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

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${path} failed: ${text}`);
  }

  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: {
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE ${path} failed: ${text}`);
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
  return apiPatch<Task>(`/tasks/${id}`, input);
}

export async function deleteTask(id: string) {
  return apiDelete<{ ok: boolean }>(`/tasks/${id}`);
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
  return apiPost<KnowledgeAnswerResponse>("/knowledge/ask", { query });
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
  project_name?: string | null;
  project_id?: string | null;
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
  return apiDelete<{ ok: boolean }>(`/knowledge/items/${id}`);
}

export type MemoryCard = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  source_item_ids: string[];
  created_at?: string | null;
};

export async function consolidateMemory() {
  return apiPost<{ ok: boolean; cards_created: number; cards: MemoryCard[] }>("/memory/consolidate", {});
}

export async function getMemoryCards() {
  return apiGet<MemoryCard[]>("/memory/cards");
}

export async function deleteMemoryCard(id: string) {
  return apiDelete<{ ok: boolean }>(`/memory/cards/${id}`);
}

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  created_at?: string | null;
};

export type Goal = {
  id: string;
  project_id?: string | null;
  title: string;
  description?: string | null;
  target_date?: string | null;
  status: string;
  created_at?: string | null;
};

export async function getProjects() {
  return apiGet<Project[]>("/projects");
}

export async function createProject(input: {
  name: string;
  description?: string;
  status?: string;
}) {
  return apiPost<Project>("/projects", input);
}

export async function updateProject(id: string, input: {
  name?: string;
  description?: string;
  status?: string;
}) {
  return apiPatch<Project>(`/projects/${id}`, input);
}

export async function deleteProject(id: string) {
  return apiDelete<{ ok: boolean }>(`/projects/${id}`);
}

export async function getGoals() {
  return apiGet<Goal[]>("/projects/goals");
}

export async function createGoal(input: {
  title: string;
  project_id?: string;
  description?: string;
  target_date?: string;
  status?: string;
}) {
  return apiPost<Goal>("/projects/goals", input);
}

export async function updateGoal(id: string, input: {
  title?: string;
  description?: string;
  target_date?: string;
  status?: string;
}) {
  return apiPatch<Goal>(`/projects/goals/${id}`, input);
}

export async function deleteGoal(id: string) {
  return apiDelete<{ ok: boolean }>(`/projects/goals/${id}`);
}

export type KnowledgeAnswerResponse = {
  answer: string;
  sources: {
    source_type?: string;
    source_id?: string;
    title?: string;
    text?: string;
    score?: number;
  }[];
  related_tasks: { id: string; title: string; status: string; priority: string }[];
  related_notes: { id: string; title: string; source_type: string }[];
  related_memory_cards: { id: string; title: string; summary: string }[];
  graph_context: { from: string; to: string; type: string }[];
  suggested_next_action?: string | null;
};

export type NotionStatus = {
  connected: boolean;
  workspace_name?: string | null;
  workspace_id?: string | null;
  workspace_icon?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;
};

export async function getNotionStatus() {
  return apiGet<NotionStatus>("/integrations/notion/status");
}

export async function getNotionConnectUrl() {
  return apiGet<{ auth_url: string }>("/integrations/notion/connect");
}

export async function disconnectNotion() {
  return apiDelete<{ ok: boolean }>("/integrations/notion/disconnect");
}
