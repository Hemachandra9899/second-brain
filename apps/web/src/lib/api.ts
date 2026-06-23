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
  created_at?: string | null;
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

export async function completeTask(taskId: string) {
  return apiPost<CompleteTaskResponse>(`/tasks/${taskId}/complete`, {});
}

export type NotionPageCardData = {
  id: string;
  title: string;
  url: string;
};

export type CreatedTaskCardData = {
  id: string;
  title: string;
  status?: string | null;
  priority?: string | null;
  due_date?: string | null;
};

export type TaskChoice = {
  id: string;
  title: string;
  status?: string | null;
  priority?: string | null;
  due_date?: string | null;
  notion_page_id?: string | null;
};

export type CompleteTaskResponse = {
  ok: boolean;
  task: Task;
  notion_updated: boolean;
  notion_result?: {
    page_id?: string;
    page_url?: string;
    status_updated?: boolean;
    todo_block_updated?: boolean;
  } | null;
  notion_error?: string | null;
};

export type AssistantResponse = {
  answer: string;
  mood?: unknown;
  intent?: unknown;
  task_id?: string;
  notion_page_id?: string;
  notion_page?: NotionPageCardData | null;
  created_task?: CreatedTaskCardData | null;
  task_choices?: TaskChoice[];
  sources?: {
    title: string;
    url?: string;
    type: "notion" | "memory" | "task" | "writing";
  }[];
  notion_todo_page?: NotionTodoPageData | null;
  notion_todo_items?: NotionTodoItemData[];
  checked_block_id?: string;
  dream?: Dream | null;
};

function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export async function askAssistant(message: string) {
  return apiPost<AssistantResponse>("/chat", { message, timezone: getUserTimezone() });
}

export async function chat(message: string) {
  return apiPost<AssistantResponse>("/chat", { message, timezone: getUserTimezone() });
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

export type BriefTask = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  due_date?: string | null;
  source?: string | null;
  notion_page_id?: string | null;
  notion_block_id?: string | null;
  created_at?: string | null;
};

export type TodayBrief = {
  greeting: string;
  today: string;
  yesterday?: string;
  tomorrow?: string;
  summary: string;
  counts: {
    today_tasks: number;
    overdue_tasks: number;
    unfinished_yesterday: number;
    notion_todos: number;
    recent_memories?: number;
    recent_activity?: number;
  };
  today_tasks: BriefTask[];
  overdue_tasks: BriefTask[];
  unfinished_yesterday: BriefTask[];
  notion_todos: BriefTask[];
  notion_pages?: {
    id: string;
    title: string;
    notion_page_id: string;
    notion_page_url?: string | null;
  }[];
  recent_memories?: {
    id: string;
    title: string;
    summary: string;
    tags?: string | null;
    created_at?: string | null;
  }[];
  recent_activity?: {
    id: string;
    event_type: string;
    title: string;
    description?: string | null;
    source_type?: string | null;
    source_id?: string | null;
    url?: string | null;
    created_at?: string | null;
  }[];
  latest_dream?: Dream | null;
  suggested_next_action: {
    title: string;
    reason?: string | null;
    action_type: string;
    source_type?: string | null;
    source_id?: string | null;
    dream_id?: string | null;
  };
};

export async function getTodayBrief() {
  const timezone = encodeURIComponent(getUserTimezone());
  return apiGet<TodayBrief>(`/brief/today?timezone=${timezone}`);
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
  default_database_id?: string | null;
  default_data_source_id?: string | null;
  default_database_title?: string | null;
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

export type NotionDatabase = {
  id: string;
  title: string;
  url?: string;
};

export async function getNotionDatabases() {
  return apiGet<{ databases: NotionDatabase[] }>("/integrations/notion/databases");
}

export async function setDefaultNotionDatabase(database_id: string, title?: string) {
  return apiPost("/integrations/notion/default-database", {
    database_id,
    title,
  });
}

export type WritingBlock = {
  type: "heading" | "paragraph" | "bullet" | "todo" | "quote" | "code";
  text: string;
  checked?: boolean;
};

export type WritingDocument = {
  id: string;
  title: string;
  raw_text: string;
  cleaned_markdown?: string | null;
  blocks: WritingBlock[];
  source_type: string;
  notion_page_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type WritingCleanResponse = {
  title: string;
  cleaned_markdown: string;
  blocks: WritingBlock[];
  tasks?: {
    title: string;
    description?: string;
    priority?: string;
    due_date?: string | null;
  }[];
  topics?: string[];
  projects?: string[];
  goals?: string[];
};

export async function cleanWriting(text: string) {
  return apiPost<WritingCleanResponse>("/writing/clean", { text });
}

export async function createWritingDocument(input: {
  title?: string;
  raw_text: string;
  cleaned_markdown?: string;
  blocks?: WritingBlock[];
  source_type?: string;
}) {
  return apiPost<WritingDocument>("/writing/documents", input);
}

export async function getWritingDocuments() {
  return apiGet<WritingDocument[]>("/writing/documents");
}

export async function extractWritingTasks(documentId: string) {
  return apiPost<{
    ok: boolean;
    tasks_created: number;
    tasks: CreatedTaskCardData[];
  }>(`/writing/documents/${documentId}/extract`, {});
}

export type ActivityEvent = {
  id: string;
  event_type: string;
  title: string;
  description?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  url?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string | null;
};

export async function getRecentActivity() {
  return apiGet<ActivityEvent[]>("/activity/recent");
}

export type BrainSource = {
  title: string;
  type: "notion" | "memory" | "task" | "writing" | "knowledge" | string;
  id?: string | null;
  url?: string | null;
  preview?: string | null;
};

export type BrainAskResponse = {
  answer: string;
  sources: BrainSource[];
};

export async function askBrain(query: string, source_hint?: string) {
  return apiPost<BrainAskResponse>("/brain/ask", {
    query,
    source_hint,
    timezone: getUserTimezone(),
  });
}

export async function syncWritingToNotion(documentId: string) {
  return apiPost<{
    ok: boolean;
    writing_document: WritingDocument;
    notion_page: NotionPageCardData;
  }>(`/writing/documents/${documentId}/sync/notion`, {});
}

export type InstagramImportStartResponse = {
  ok: boolean;
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  message?: string;
};

export type InstagramImportJob = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  filename?: string | null;
  total_items: number;
  processed_items: number;
  knowledge_items: number;
  activity_events: number;
  error?: string | null;
};

export type NotionImageUploadResponse = {
  ok: boolean;
  notion_page: {
    id: string;
    title: string;
    url: string;
  };
  file_upload_id: string;
};

export async function uploadImageToNotion(input: {
  file: File;
  title?: string;
  caption?: string;
}) {
  const form = new FormData();
  form.append("file", input.file);
  form.append("title", input.title || input.file.name);
  if (input.caption) form.append("caption", input.caption);

  const res = await fetch(`${API_URL}/uploads/image/notion`, {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Image upload failed");
  }

  return res.json() as Promise<NotionImageUploadResponse>;
}

export async function uploadInstagramZip(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_URL}/imports/instagram`, {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
    body: form,
  });

  if (!res.ok) {
    let message = "Instagram import failed";

    try {
      const data = await res.json();
      message = data.detail || JSON.stringify(data);
    } catch {
      message = await res.text();
    }

    throw new Error(message || "Instagram import failed");
  }

  return res.json() as Promise<InstagramImportStartResponse>;
}

export async function getInstagramImportJob(jobId: string) {
  return apiGet<InstagramImportJob>(`/imports/instagram/jobs/${jobId}`);
}

// --- Notion Todo Pages ---

export type NotionTodoPageData = {
  id: string;
  title: string;
  notion_page_id: string;
  url?: string | null;
};

export type NotionTodoItemData = {
  id: string;
  title: string;
  checked: boolean;
  notion_block_id: string;
};

export type CreateTodoPageRequest = {
  title: string;
  todos: string[];
  data_source_id: string;
};

export type CreateTodoPageResponse = {
  ok: boolean;
  page: NotionTodoPageData;
  todos: NotionTodoItemData[];
};

export async function createNotionTodoPage(
  input: CreateTodoPageRequest
) {
  return apiPost<CreateTodoPageResponse>(
    "/integrations/notion/todo-pages",
    input
  );
}

export async function getNotionTodoPages() {
  return apiGet<{ ok: boolean; pages: NotionTodoPageData[] }>(
    "/integrations/notion/todo-pages"
  );
}

export async function getNotionTodoPage(id: string) {
  return apiGet<{
    ok: boolean;
    page: NotionTodoPageData;
    todos: NotionTodoItemData[];
  }>(`/integrations/notion/todo-pages/${id}`);
}

export async function addTodosToNotionPage(
  pageId: string,
  todos: string[]
) {
  return apiPost<{ ok: boolean; todos: NotionTodoItemData[] }>(
    `/integrations/notion/todo-pages/${pageId}/todos`,
    { todos }
  );
}

export async function checkNotionTodo(
  pageId: string,
  blockId: string,
  checked: boolean
) {
  return apiPatch<{ ok: boolean; checked: boolean }>(
    `/integrations/notion/todo-pages/${pageId}/todos/${blockId}`,
    { checked }
  );
}

export async function renameNotionTodoPage(
  pageId: string,
  title: string
) {
  return apiPatch<{ ok: boolean; page: NotionTodoPageData }>(
    `/integrations/notion/todo-pages/${pageId}/title`,
    { title }
  );
}

export async function connectExistingNotionPage(
  input: {
    notion_page_id: string;
    title: string;
    data_source_id: string;
  }
) {
  return apiPost<CreateTodoPageResponse>(
    "/integrations/notion/todo-pages/connect",
    input
  );
}

// --- Dream Mode ---

export type DreamSuggestedAction = {
  title: string;
  reason?: string | null;
  action_type?: string | null;
  source_type?: string | null;
  source_id?: string | null;
};

export type Dream = {
  id: string;
  dream_date: string;
  dream_type: "nightly" | "think" | "weekly" | string;
  title: string;
  summary: string;
  patterns: string[];
  forgotten_items: string[];
  suggested_actions: DreamSuggestedAction[];
  tomorrow_plan: string[];
  related_ids: Record<string, string[]>;
  created_at?: string | null;
};

export async function runDream(mode: "nightly" | "think" | "weekly" = "nightly") {
  return apiPost<Dream>("/dreams/run", { mode });
}

export async function getLatestDream() {
  return apiGet<{ dream: Dream | null }>("/dreams/latest");
}

export async function getDreams() {
  return apiGet<{ dreams: Dream[] }>("/dreams");
}

export async function acceptDreamAction(dreamId: string, actionIndex: number) {
  return apiPost<{ success: boolean; result: { action: DreamSuggestedAction; created: unknown } }>(
    `/dreams/${dreamId}/actions/${actionIndex}/accept`,
    {}
  );
}

// --- Brain Map + Think ---

export type BrainMapNode = {
  id: string;
  label: string;
  type: "brain" | "hub" | "task" | "memory" | "writing" | "notion" | "dream" | string;
  subtitle?: string | null;
};

export type BrainMapEdge = {
  source: string;
  target: string;
  label: string;
};

export type BrainMap = {
  nodes: BrainMapNode[];
  edges: BrainMapEdge[];
  counts: {
    tasks: number;
    memories: number;
    writings: number;
    notion_pages: number;
    dreams: number;
  };
};

export type BrainThinkResponse = {
  answer: string;
  sources: {
    id: string;
    type: string;
    title: string;
    preview?: string | null;
    date?: string | null;
  }[];
  gaps: string[];
};

export async function getBrainMap() {
  return apiGet<BrainMap>("/brain/map");
}

export async function brainThink(query: string) {
  return apiPost<BrainThinkResponse>("/brain/think", {
    query,
  });
}

// --- Local Brain Index ---

export type LocalBrainItem = {
  id: string;
  source_type: string;
  source_id: string;
  source_url?: string | null;
  title: string;
  preview: string;
  tags?: string | null;
  score?: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type LocalBrainSearchResponse = {
  query: string;
  source_type: string;
  results: LocalBrainItem[];
  count: number;
};

export type LocalBrainThinkResponse = {
  answer: string;
  sources: LocalBrainItem[];
  gaps: string[];
};

export type LocalBrainHealth = {
  score: number;
  item_count: number;
  open_tasks: number;
  tasks_without_due_date: number;
  failed_imports: number;
  latest_dream_at?: string | null;
  issues: string[];
};

export async function reindexLocalBrain() {
  return apiPost<{
    ok: boolean;
    indexed: number;
    count_by_type: Record<string, number>;
  }>("/brain/local/reindex", {});
}

export async function searchLocalBrain(query: string, sourceType = "all") {
  const params = new URLSearchParams({
    query,
    source_type: sourceType,
    limit: "12",
  });

  return apiGet<LocalBrainSearchResponse>(`/brain/local/search?${params}`);
}

export async function thinkLocalBrain(query: string) {
  return apiPost<LocalBrainThinkResponse>("/brain/local/think", {
    query,
  });
}

export async function getLocalBrainHealth() {
  return apiGet<LocalBrainHealth>("/brain/local/health");
}

// --- Local Brain Graph ---

export type LocalBrainGraphNode = {
  id: string;
  label: string;
  type: string;
  subtitle?: string | null;
  source_id?: string | null;
  source_url?: string | null;
};

export type LocalBrainGraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  reason?: string | null;
  weight: number;
};

export type LocalBrainGraph = {
  nodes: LocalBrainGraphNode[];
  edges: LocalBrainGraphEdge[];
  counts: {
    nodes: number;
    edges: number;
  };
};

export async function getLocalBrainGraph() {
  return apiGet<LocalBrainGraph>("/brain/local/graph");
}

export async function rebuildLocalBrainRelationships() {
  return apiPost<{
    ok: boolean;
    items_checked: number;
    edges_created: number;
  }>("/brain/local/relationships/rebuild", {});
}

// --- Brain Actions ---

export type BrainAction = {
  action_type: "create_task" | "move_task_to_today" | string;
  title: string;
  reason?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  source_item_id?: string | null;
  target_item_id?: string | null;
  items?: {
    id: string;
    source_type: string;
    source_id: string;
    title: string;
    preview?: string | null;
    source_url?: string | null;
  }[];
};

export type BrainActionsResponse = {
  actions: BrainAction[];
  count: number;
};

export async function getBrainActions() {
  return apiGet<BrainActionsResponse>("/brain/local/actions");
}

export async function acceptBrainAction(action: BrainAction) {
  return apiPost<{
    ok: boolean;
    message: string;
    task?: {
      id: string;
      title: string;
      status?: string | null;
      due_date?: string | null;
    };
  }>("/brain/local/actions/accept", {
    action,
  });
}

// --- Brain Project Builder ---

export type BrainProjectSuggestion = {
  title: string;
  description: string;
  item_ids: string[];
  task_ids: string[];
  source_types: string[];
  items: {
    id: string;
    source_type: string;
    source_id: string;
    title: string;
    preview?: string | null;
  }[];
};

export async function getBrainProjectSuggestions() {
  return apiGet<{
    suggestions: BrainProjectSuggestion[];
    count: number;
  }>("/brain/local/project-suggestions");
}

export async function acceptBrainProjectSuggestion(
  suggestion: BrainProjectSuggestion
) {
  return apiPost<{
    ok: boolean;
    message: string;
    project: {
      id: string;
      name: string;
      description?: string | null;
      status: string;
    };
    linked_tasks: {
      id: string;
      title: string;
      status?: string | null;
      due_date?: string | null;
    }[];
  }>("/brain/local/project-suggestions/accept", {
    suggestion,
  });
}

// --- Brain Capture ---

export async function captureToBrain(text: string) {
  return apiPost<{
    ok: boolean;
    created: {
      type: string;
      id: string;
      title: string;
    };
    classification: Record<string, unknown>;
  }>("/brain/local/capture", {
    text,
  });
}

// --- Project Brain ---

export type ProjectBrain = {
  project: {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    created_at?: string | null;
  };
  counts: {
    tasks: number;
    open_tasks: number;
    related_items: number;
    connections: number;
    source_counts: Record<string, number>;
  };
  tasks: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    due_date?: string | null;
    source?: string | null;
    notion_page_id?: string | null;
  }[];
  related_items: {
    id: string;
    source_type: string;
    source_id: string;
    source_url?: string | null;
    title: string;
    preview: string;
    tags?: string | null;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    label: string;
    reason?: string | null;
    weight: number;
  }[];
  next_action: {
    title: string;
    reason: string;
    action_type: string;
    source_id?: string | null;
  };
};

export type BrainTimelineEvent = {
  id: string;
  type: string;
  source_type: string;
  title: string;
  preview?: string | null;
  created_at?: string | null;
};

export async function getBrainTimeline() {
  return apiGet<{
    events: BrainTimelineEvent[];
    count: number;
  }>("/brain/local/timeline");
}

export async function getProjectBrain(projectId: string) {
  return apiGet<ProjectBrain>(`/projects/${projectId}/brain`);
}

export type ProjectThinkResponse = {
  answer: string;
  sources: {
    type: string;
    id: string;
    title: string;
    preview?: string | null;
    status?: string | null;
    due_date?: string | null;
    url?: string | null;
  }[];
  gaps: string[];
  next_action: {
    title: string;
    reason: string;
    action_type: string;
    source_id?: string | null;
  };
};

export async function thinkProjectBrain(projectId: string, query: string) {
  return apiPost<ProjectThinkResponse>(`/projects/${projectId}/brain/think`, {
    query,
  });
}

// --- Brain Inbox ---

export type BrainInboxItem = {
  id: string;
  raw_text: string;
  suggested_type: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: string | null;
  tags?: string[];
  status: string;
  created_item_type?: string | null;
  created_item_id?: string | null;
  created_at?: string | null;
};

export async function createBrainInboxItem(text: string) {
  return apiPost<{
    ok: boolean;
    item: BrainInboxItem;
  }>("/brain/local/inbox", {
    text,
  });
}

export async function getBrainInbox() {
  return apiGet<{
    items: BrainInboxItem[];
    count: number;
  }>("/brain/local/inbox");
}

export async function acceptBrainInboxItem(itemId: string) {
  return apiPost<{
    ok: boolean;
    message: string;
    item: BrainInboxItem;
  }>(`/brain/local/inbox/${itemId}/accept`, {});
}

export async function dismissBrainInboxItem(itemId: string) {
  return apiPost<{
    ok: boolean;
    message: string;
    item: BrainInboxItem;
  }>(`/brain/local/inbox/${itemId}/dismiss`, {});
}

export async function applyProjectBrainAction(
  projectId: string,
  action: {
    title: string;
    reason: string;
    action_type: string;
    source_id?: string | null;
  }
) {
  return apiPost<{
    ok: boolean;
    message: string;
    task?: {
      id: string;
      title: string;
      status?: string | null;
      due_date?: string | null;
    };
  }>(`/projects/${projectId}/brain/action`, {
    action,
  });
}
