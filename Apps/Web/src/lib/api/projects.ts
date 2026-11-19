import { apiFetch } from "./helper";

export type { PagedResponse } from "./helper";
export { ApiError } from "./helper";

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
  color?: string;
}

export interface UpdateProjectRequest {
  name: string;
  description?: string | null;
  color?: string;
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
import { buildTaskQuery } from "./tasks";
import type { PagedResponse, TaskResponse, GetTasksQuery } from "./tasks";

// Query params para /api/projects/{id}/tasks
export type GetProjectTasksQuery = GetTasksQuery;

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
    return apiFetch<PagedResponse<TaskResponse>>(`/projects/${id}/tasks${buildTaskQuery(query)}`, {
      method: "GET",
    });
  },

  /** GET /api/projects/{id}/summary */
  getSummary(id: string): Promise<ProjectSummaryResponse> {
    return apiFetch<ProjectSummaryResponse>(`/projects/${id}/summary`, { method: "GET" });
  },
};
