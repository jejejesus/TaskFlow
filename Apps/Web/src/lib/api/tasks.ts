import { apiFetch, PagedResponse } from "./helper";

export type { PagedResponse } from "./helper";

// ============================================
// Tipos / DTOs
// ============================================

/**
 * Enum en C#: probablemente 0,1,2... Ajusta los valores
 * según los defina tu backend. Ejemplo típico:
 *   Pending = 0, InProgress = 1, Completed = 2, Cancelled = 3
 */
export enum TaskCurrentStatus {
  Todo = 1,
  InProgress = 2,
  Done = 3,
}

/**
 * Enum en C#: probablemente 0,1,2...
 *   Low = 0, Medium = 1, High = 2, Urgent = 3
 */
export enum TaskPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Urgent = 4,
}

export enum TaskAllowedSortFields {
  CreatedAt = 1,
  Title = 2,
  DueDate = 3,
  Priority = 4,
  Status = 5,
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: TaskCurrentStatus;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: string | null;
  projectName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null; // ISO string
  projectId: string | null;
}

export interface UpdateTaskRequest {
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: string | null;
}

export interface ChangeTaskStatusRequest {
  status: TaskCurrentStatus;
}

export interface GetTasksQuery {
  Page?: number;
  PageSize?: number;
  Status?: TaskCurrentStatus;
  Priority?: TaskPriority;
  Search?: string;
  SortBy?: string;
  SortDirection?: string;
}

// ============================================
// Servicio de Tasks
// ============================================

export const tasksApi = {
  /** POST /api/tasks */
  create(body: CreateTaskRequest): Promise<TaskResponse> {
    return apiFetch<TaskResponse>("/tasks", { method: "POST", body: JSON.stringify(body) });
  },

  /** GET /api/tasks */
  list(query: GetTasksQuery = {}): Promise<PagedResponse<TaskResponse>> {
    const params = new URLSearchParams();
    if (query.Page !== undefined) params.set("Page", String(query.Page));
    if (query.PageSize !== undefined) params.set("PageSize", String(query.PageSize));
    if (query.Status !== undefined) params.set("Status", String(query.Status));
    if (query.Priority !== undefined) params.set("Priority", String(query.Priority));
    if (query.Search) params.set("Search", query.Search);
    if (query.SortBy) params.set("SortBy", query.SortBy);
    if (query.SortDirection) params.set("SortDirection", query.SortDirection);

    const qs = params.toString();
    return apiFetch<PagedResponse<TaskResponse>>(`/tasks${qs ? `?${qs}` : ""}`, { method: "GET" });
  },

  /** GET /api/tasks/{id} */
  getById(id: string): Promise<TaskResponse> {
    return apiFetch<TaskResponse>(`/tasks/${id}`, { method: "GET" });
  },

  /** PUT /api/tasks/{id} */
  update(id: string, body: UpdateTaskRequest): Promise<TaskResponse> {
    return apiFetch<TaskResponse>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },

  /** DELETE /api/tasks/{id} */
  remove(id: string): Promise<void> {
    return apiFetch<void>(`/tasks/${id}`, { method: "DELETE" });
  },

  /** PATCH /api/tasks/{id}/status */
  changeStatus(id: string, body: ChangeTaskStatusRequest): Promise<TaskResponse> {
    return apiFetch<TaskResponse>(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
};
