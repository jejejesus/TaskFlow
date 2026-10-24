"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/helper";
import { TaskCurrentStatus, tasksApi, type TaskResponse } from "@/lib/api/tasks";

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
    <main>
      <h1>Tareas ({tasks.length})</h1>
      {loading ? (
        <p>Cargando tareas…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : tasks.length === 0 ? (
        <p>No hay tareas.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <strong>{task.title}</strong> — estado: {statusLabels[task.status] ?? task.status}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

const statusLabels: Record<number, string> = {
  [TaskCurrentStatus.Todo]: "Pendiente",
  [TaskCurrentStatus.InProgress]: "En progreso",
  [TaskCurrentStatus.Done]: "Completada",
};
