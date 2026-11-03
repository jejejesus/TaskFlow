"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/helper";
import { projectsApi, type ProjectResponse } from "@/lib/api/projects";
import { tasksApi, TaskCurrentStatus, type TaskResponse } from "@/lib/api/tasks";
import { Summary } from "@/components/main-page/summary-section";
import TaskProjects from "@/components/main-page/tasks-projects-section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";

export default function Page() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [counts, setCounts] = useState({ total: 0, completed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      tasksApi.list({ Page: 1, PageSize: 6 }),
      tasksApi.list({ Page: 1, PageSize: 1 }),
      tasksApi.list({ Page: 1, PageSize: 1, Status: TaskCurrentStatus.Done }),
      tasksApi.list({ Page: 1, PageSize: 1, Status: TaskCurrentStatus.Todo }),
      projectsApi.list(),
    ])
      .then(([recent, all, completed, pending, projectList]) => {
        if (cancelled) return;
        setTasks(recent.items);
        setCounts({
          total: all.totalCount,
          completed: completed.totalCount,
          pending: pending.totalCount,
        });
        setProjects(projectList);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof ApiError ? cause.message : "No se pudo cargar el dashboard.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  let content = (
    <>
      <Summary counts={counts} projectCount={projects.length} loading={loading} />

      <TaskProjects tasks={tasks} projects={projects} loading={loading} />
    </>
  );

  if (error) {
    content = (
      <Alert variant="destructive" className="max-w-md">
        <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} size={30} />
        <AlertTitle>Error al cargar datos</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tus tareas y proyectos.</p>
      </header>

      {content}
    </main>
  );
}
