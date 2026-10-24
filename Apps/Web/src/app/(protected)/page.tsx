"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/helper";
import { projectsApi, type ProjectResponse } from "@/lib/api/projects";
import { tasksApi, TaskCurrentStatus, type TaskResponse } from "@/lib/api/tasks";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ListChecksIcon,
  CircleCheckIcon,
  Clock01Icon,
  FolderKanbanIcon,
} from "@hugeicons/core-free-icons";

const statusLabels: Record<number, string> = {
  [TaskCurrentStatus.Todo]: "Pendiente",
  [TaskCurrentStatus.InProgress]: "En progreso",
  [TaskCurrentStatus.Done]: "Completada",
};

const statusStyles: Record<number, string> = {
  [TaskCurrentStatus.Todo]: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  [TaskCurrentStatus.InProgress]: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  [TaskCurrentStatus.Done]: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  //[TaskCurrentStatus.Cancelled]: "bg-muted text-muted-foreground",
};

function formatDate(value: string | null) {
  if (!value) return "Sin fecha límite";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(value));
}

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

  return (
    <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tus tareas y proyectos.</p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <section aria-label="Resumen" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total de tareas",
            value: counts.total,
            note: "Tareas registradas",
            icon: ListChecksIcon,
            color: "#CF9FFF",
          },
          {
            label: "Completadas",
            value: counts.completed,
            note: "Tareas finalizadas",
            icon: CircleCheckIcon,
            color: "#0BDA51",
          },
          {
            label: "Pendientes",
            value: counts.pending,
            note: "Por completar",
            icon: Clock01Icon,
            color: "#FFBF00",
          },
          {
            label: "Proyectos",
            value: projects.length,
            note: "Proyectos creados",
            icon: FolderKanbanIcon,
            color: "#5F9EA0",
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {loading ? "—" : item.value.toLocaleString("es-MX")}
              </CardTitle>
              <CardAction>
                <HugeiconsIcon icon={item.icon} strokeWidth={2} color={item.color} />
              </CardAction>
            </CardHeader>
            <CardFooter className="text-sm text-muted-foreground">{item.note}</CardFooter>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Tareas recientes</CardTitle>
              <CardDescription>Actividad más reciente</CardDescription>
            </div>
            <Link href="/tasks" className="text-sm font-medium text-primary hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-6 text-sm text-muted-foreground">Cargando tareas…</p>
            ) : tasks.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">
                Todavía no hay tareas.{" "}
                <Link href="/tasks" className="text-primary hover:underline">
                  Crea tu primera tarea.
                </Link>
              </p>
            ) : (
              <ul className="divide-y">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Límite: {formatDate(task.dueDate)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[task.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {statusLabels[task.status] ?? "Desconocido"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Proyectos</CardTitle>
              <CardDescription>Tus espacios de trabajo</CardDescription>
            </div>
            <Link href="/projects" className="text-sm font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-6 text-sm text-muted-foreground">Cargando proyectos…</p>
            ) : projects.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">Aún no hay proyectos.</p>
            ) : (
              <ul className="space-y-4">
                {projects.slice(0, 5).map((project) => (
                  <li key={project.id} className="flex items-start gap-3">
                    <span
                      className="mt-1 size-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: project.color || "#6366F1" }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{project.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {project.description || "Sin descripción"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
