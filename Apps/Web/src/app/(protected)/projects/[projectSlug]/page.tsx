import { Suspense } from "react";
import { notFound } from "next/navigation";
import { serverProjects, serverTasks } from "@/lib/api/server";
import { ApiError } from "@/lib/api/helper";
import { parseTaskRoute, type RouteSearchParams } from "@/lib/task-query";
import { DataError } from "@/components/data-error";
import { ProjectHeader } from "@/components/project-details-page/project-header";
import TaskWorkspace from "@/components/tasks-page/task-workspace";
import type { GetTasksQuery, PagedResponse, TaskResponse } from "@/lib/api/tasks";
import type { ViewMode } from "@/lib/task-query";

type Props = { params: Promise<{ projectSlug: string }>; searchParams: Promise<RouteSearchParams> };

type TaskResult = { tasks: PagedResponse<TaskResponse> | null; error: unknown };

async function ProjectTasks({
  result,
  view,
  query,
  projectId,
}: {
  result: Promise<TaskResult>;
  view: ViewMode;
  query: GetTasksQuery;
  projectId: string;
}) {
  const { tasks, error } = await result;
  return (
    <TaskWorkspace
      view={view}
      query={query}
      projectId={projectId}
      tasks={tasks}
      error={
        error
          ? {
              message:
                error instanceof ApiError ? error.message : "No se pudieron cargar las tareas.",
              status: error instanceof ApiError ? error.status : undefined,
            }
          : null
      }
    />
  );
}

async function ProjectData({ params, searchParams }: Props) {
  const [{ projectSlug }, routeParams] = await Promise.all([params, searchParams]);
  const { view, query } = parseTaskRoute(routeParams);
  const projectPromise = serverProjects.get(projectSlug);
  const taskPromise: Promise<TaskResult> =
    view === "list"
      ? serverTasks.forProject(projectSlug, query).then(
          (tasks) => ({ tasks, error: null }),
          (error) => ({ tasks: null, error }),
        )
      : Promise.resolve({ tasks: null, error: null });
  let project;
  try {
    project = await projectPromise;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return <DataError error={error} title="Error al cargar proyecto" />;
  }
  return (
    <>
      <ProjectHeader project={project} />
      <Suspense fallback={<p role="status">Cargando tareas...</p>}>
        <ProjectTasks result={taskPromise} view={view} query={query} projectId={project.id} />
      </Suspense>
    </>
  );
}

export default function Page(props: Props) {
  return (
    <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <Suspense fallback={<p role="status">Cargando proyecto...</p>}>
        <ProjectData {...props} />
      </Suspense>
    </main>
  );
}
