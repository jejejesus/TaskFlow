"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api/helper";
import { serverApiFetch } from "@/lib/api/server";
import { TaskPriority, type CreateTaskRequest, type TaskResponse } from "@/lib/api/tasks";
import type { CreateProjectRequest, ProjectResponse } from "@/lib/api/projects";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; status?: number };

const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorResult(cause: unknown): ActionResult<never> {
  if (cause instanceof ApiError)
    return { success: false, error: cause.message, status: cause.status };
  return { success: false, error: "No se pudo completar la operación." };
}

function refreshData() {
  try {
    revalidatePath("/", "page");
    revalidatePath("/my-tasks", "page");
    revalidatePath("/projects", "page");
    revalidatePath("/projects/[projectSlug]", "page");
  } catch (error) {
    // The write has already succeeded; never report it as a failed mutation.
    console.error("Unable to revalidate task data", error);
  }
}

export async function saveTaskAction(
  id: string | null,
  input: CreateTaskRequest,
): Promise<ActionResult<TaskResponse>> {
  if (
    (id !== null && (typeof id !== "string" || !guidPattern.test(id))) ||
    !input ||
    typeof input.title !== "string" ||
    !input.title.trim() ||
    input.title.trim().length > 200 ||
    (input.description !== null &&
      (typeof input.description !== "string" || input.description.length > 2000)) ||
    ![TaskPriority.Low, TaskPriority.Medium, TaskPriority.High, TaskPriority.Urgent].includes(
      input.priority,
    ) ||
    (input.projectId !== null &&
      (typeof input.projectId !== "string" || !guidPattern.test(input.projectId))) ||
    (input.dueDate !== null &&
      (typeof input.dueDate !== "string" || !Number.isFinite(Date.parse(input.dueDate))))
  ) {
    return { success: false, error: "Los datos de la tarea no son válidos." };
  }

  try {
    const data = await serverApiFetch<TaskResponse>(id ? `/tasks/${id}` : "/tasks", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify({
        title: input.title.trim(),
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate,
        projectId: input.projectId,
      }),
    });
    refreshData();
    return { success: true, data };
  } catch (cause) {
    return errorResult(cause);
  }
}

export async function deleteTaskAction(id: string): Promise<ActionResult<null>> {
  if (typeof id !== "string" || !guidPattern.test(id)) {
    return { success: false, error: "El identificador de la tarea no es válido." };
  }
  try {
    await serverApiFetch<void>(`/tasks/${id}`, { method: "DELETE" });
    refreshData();
    return { success: true, data: null };
  } catch (cause) {
    return errorResult(cause);
  }
}

export async function saveProjectAction(
  id: string | null,
  input: CreateProjectRequest,
): Promise<ActionResult<ProjectResponse>> {
  if (
    (id !== null && (typeof id !== "string" || !guidPattern.test(id))) ||
    !input ||
    typeof input.name !== "string" ||
    !input.name.trim() ||
    input.name.trim().length > 150 ||
    (input.description != null &&
      (typeof input.description !== "string" || input.description.length > 1000)) ||
    (input.color != null &&
      (typeof input.color !== "string" || !/^#[0-9a-f]{6}$/i.test(input.color)))
  ) {
    return { success: false, error: "Los datos del proyecto no son válidos." };
  }

  try {
    const data = await serverApiFetch<ProjectResponse>(id ? `/projects/${id}` : "/projects", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify({
        name: input.name.trim(),
        description: input.description,
        color: input.color,
      }),
    });
    refreshData();
    return { success: true, data };
  } catch (cause) {
    return errorResult(cause);
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult<null>> {
  if (typeof id !== "string" || !guidPattern.test(id)) {
    return { success: false, error: "El identificador del proyecto no es válido." };
  }
  try {
    await serverApiFetch<void>(`/projects/${id}`, { method: "DELETE" });
    refreshData();
    return { success: true, data: null };
  } catch (cause) {
    return errorResult(cause);
  }
}
