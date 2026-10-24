import { apiFetch } from "./helper";

export type { PagedResponse } from "./helper";

// ============================================
// Tipos / DTOs
// ============================================

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string | null;
  color?: string; // default "#6366F1"
}

export interface UpdateProjectRequest {
  name: string;
  description?: string | null;
  color?: string; // default "#6366F1"
}

export interface ProjectSummaryResponse {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  progressPercentage: number;
}

// ===== Tipos compartidos con tasks (se importan desde ./tasks) =====
import type { PagedResponse, TaskResponse, TaskCurrentStatus, TaskPriority } from "./tasks";

// Query params para /api/projects/{id}/tasks
export interface GetProjectTasksQuery {
  Page?: number;
  PageSize?: number;
  Status?: TaskCurrentStatus;
  Priority?: TaskPriority;
  Search?: string;
  SortBy?: string;
  SortDirection?: string;
}

// ============================================
// Servicio de Projects
// ============================================

export const projectsApi = {
  /** POST /api/projects */
  create(body: CreateProjectRequest): Promise<ProjectResponse> {
    return apiFetch<ProjectResponse>("/projects", { method: "POST", body: JSON.stringify(body) });
  },

  /** GET /api/projects */
  list(): Promise<ProjectResponse[]> {
    return apiFetch<ProjectResponse[]>("/projects", { method: "GET" });
  },

  /** GET /api/projects/{id} */
  getById(id: string): Promise<ProjectResponse> {
    return apiFetch<ProjectResponse>(`/projects/${id}`, { method: "GET" });
  },

  /** PUT /api/projects/{id} */
  update(id: string, body: UpdateProjectRequest): Promise<ProjectResponse> {
    return apiFetch<ProjectResponse>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  /** DELETE /api/projects/{id} */
  remove(id: string): Promise<void> {
    return apiFetch<void>(`/projects/${id}`, { method: "DELETE" });
  },

  /** GET /api/projects/{id}/tasks */
  getTasks(id: string, query: GetProjectTasksQuery = {}): Promise<PagedResponse<TaskResponse>> {
    const params = new URLSearchParams();
    if (query.Page !== undefined) params.set("Page", String(query.Page));
    if (query.PageSize !== undefined) params.set("PageSize", String(query.PageSize));
    if (query.Status !== undefined) params.set("Status", String(query.Status));
    if (query.Priority !== undefined) params.set("Priority", String(query.Priority));
    if (query.Search) params.set("Search", query.Search);
    if (query.SortBy) params.set("SortBy", query.SortBy);
    if (query.SortDirection) params.set("SortDirection", query.SortDirection);

    const qs = params.toString();
    return apiFetch<PagedResponse<TaskResponse>>(`/projects/${id}/tasks${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
  },

  /** GET /api/projects/{id}/summary */
  getSummary(id: string): Promise<ProjectSummaryResponse> {
    return apiFetch<ProjectSummaryResponse>(`/projects/${id}/summary`, { method: "GET" });
  },
};
