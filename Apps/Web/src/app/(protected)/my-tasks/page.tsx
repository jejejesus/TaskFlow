"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/helper";
import {
  TaskAllowedSortFields,
  TaskCurrentStatus,
  TaskPriority,
  tasksApi,
  type TaskResponse,
} from "@/lib/api/tasks";
import SearchFilter from "@/components/tasks-page/search-filter";

export default function Page() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    tasksApi
      .list({ Page: 1, PageSize: 20 })
      .then((response) => {
        if (!cancelled) setTasks(response.items);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof ApiError ? cause.message : "No se pudieron cargar las tareas.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mis tareas</h1>
        <p className="text-muted-foreground">
          Gestiona tus tareas y mantén el enfoque en lo importante.
        </p>
      </header>

      <SearchFilter
        statusLabels={statusLabels}
        priorityLabels={priorityLabels}
        orderByLabels={sortFieldLabels}
      />

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </main>
  );
}

const statusLabels: Record<number, string> = {
  [TaskCurrentStatus.Todo]: "Pendiente",
  [TaskCurrentStatus.InProgress]: "En progreso",
  [TaskCurrentStatus.Done]: "Completada",
};

const priorityLabels: Record<number, string> = {
  [TaskPriority.Low]: "Baja",
  [TaskPriority.Medium]: "Media",
  [TaskPriority.High]: "Alta",
  [TaskPriority.Urgent]: "Urgente",
};

const sortFieldLabels: Record<number, string> = {
  [TaskAllowedSortFields.CreatedAt]: "Fecha de creación",
  [TaskAllowedSortFields.Title]: "Título",
  [TaskAllowedSortFields.DueDate]: "Fecha límite",
  [TaskAllowedSortFields.Priority]: "Prioridad",
  [TaskAllowedSortFields.Status]: "Estatus",
};
