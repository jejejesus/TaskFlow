import "server-only";

import { cookies } from "next/headers";
import { ApiError, parseApiResponse, type PagedResponse } from "./helper";
import { buildTaskQuery, type GetTasksQuery, type TaskResponse } from "./tasks";
import type { ProjectResponse } from "./projects";
import { fetchServerApi } from "./fetch-server";

function apiBaseUrl(): string {
  const base = (process.env.API_BASE_URL || "https://localhost:7120/api").replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

export async function serverApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) throw new ApiError(401, "Tu sesión ha expirado.");

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetchServerApi(`${apiBaseUrl()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor.");
  }
  return parseApiResponse<T>(response);
}

export const serverTasks = {
  list(query: GetTasksQuery = {}) {
    return serverApiFetch<PagedResponse<TaskResponse>>(`/tasks${buildTaskQuery(query)}`);
  },
  forProject(id: string, query: GetTasksQuery = {}) {
    return serverApiFetch<PagedResponse<TaskResponse>>(
      `/projects/${encodeURIComponent(id)}/tasks${buildTaskQuery(query)}`,
    );
  },
};

export const serverProjects = {
  list() {
    return serverApiFetch<ProjectResponse[]>("/projects");
  },
  get(id: string) {
    return serverApiFetch<ProjectResponse>(`/projects/${encodeURIComponent(id)}`);
  },
};
