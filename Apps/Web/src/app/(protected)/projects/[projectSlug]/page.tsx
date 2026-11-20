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
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

type Props = { params: Promise<{ projectSlug: string }>; searchParams: Promise<RouteSearchParams> };

type TaskResult = {
  tasks: PagedResponse<TaskResponse> | null;
  kanbanTasks: TaskResponse[] | null;
  error: unknown;
};

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
  const { tasks, kanbanTasks, error } = await result;
  return (
    <TaskWorkspace
      view={view}
      query={query}
      projectId={projectId}
      tasks={tasks}
      kanbanTasks={kanbanTasks}
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
  const taskPromise: Promise<TaskResult> = (
    view === "kanban"
      ? serverTasks.forProjectAll(projectSlug).then((kanbanTasks) => ({
          tasks: null,
          kanbanTasks,
          error: null,
        }))
      : serverTasks.forProject(projectSlug, query).then((tasks) => ({
          tasks,
          kanbanTasks: null,
          error: null,
        }))
  ).catch((error) => ({ tasks: null, kanbanTasks: null, error }));
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
      <Suspense
        fallback={
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Spinner />
              </EmptyMedia>
              <EmptyTitle>Cargando proyecto...</EmptyTitle>
            </EmptyHeader>
          </Empty>
        }
      >
        <ProjectData {...props} />
      </Suspense>
    </main>
  );
}
