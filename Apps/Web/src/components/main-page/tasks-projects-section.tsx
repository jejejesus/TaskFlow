import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectResponse } from "@/lib/api/projects";
import { TaskResponse } from "@/lib/api/tasks";
import { Skeleton } from "../ui/skeleton";
import { statusLabels, statusStyles } from "@/lib/util-constants/tasks-constants";

function formatDate(value: Date | null) {
  if (!value) return "Sin fecha límite";
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

type SummaryProps = {
  tasks: TaskResponse[];
  projects: ProjectResponse[];
  loading?: boolean;
};

export default function TaskProjects({ tasks, projects, loading = false }: SummaryProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Tareas recientes</CardTitle>
            <CardDescription>Actividad más reciente</CardDescription>
          </div>
          <Link href="/my-tasks" className="text-sm font-medium text-primary hover:underline">
            Ver todas
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ul className="divide-y">
              {[...Array(4).keys()].map((key) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 w-full">
                    <Skeleton className="h-4 w-1/2 mb-1" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <div>
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </li>
              ))}
            </ul>
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
                      Vencimiento: {formatDate(task.dueDate)}
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
            <ul className="space-y-4">
              {[...Array(3).keys()].map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <div className="w-full">
                    <Skeleton className="h-4 w-1/3 mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </li>
              ))}
            </ul>
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
  );
}
