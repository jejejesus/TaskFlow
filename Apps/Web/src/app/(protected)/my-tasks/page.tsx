import { Suspense } from "react";
import { CheckListIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import TaskWorkspace from "@/components/tasks-page/task-workspace";
import { serverTasks } from "@/lib/api/server";
import { ApiError } from "@/lib/api/helper";
import { parseTaskRoute, type RouteSearchParams } from "@/lib/task-query";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

async function TasksData({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
  const { view, query } = parseTaskRoute(await searchParams);
  try {
    if (view === "kanban") {
      const kanbanTasks = await serverTasks.listAll();
      return <TaskWorkspace view={view} query={query} tasks={null} kanbanTasks={kanbanTasks} />;
    }
    const tasks = await serverTasks.list(query);
    return <TaskWorkspace view={view} query={query} tasks={tasks} />;
  } catch (error) {
    return (
      <TaskWorkspace
        view={view}
        query={query}
        tasks={null}
        error={{
          message: error instanceof ApiError ? error.message : "No se pudieron cargar las tareas.",
          status: error instanceof ApiError ? error.status : undefined,
        }}
      />
    );
  }
}

export default function Page({ searchParams }: { searchParams: Promise<RouteSearchParams> }) {
  return (
    <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header>
        <h1 className="flex gap-2 text-2xl font-semibold tracking-tight">
          <HugeiconsIcon icon={CheckListIcon} size={30} />
          Mis tareas
        </h1>
        <p className="text-muted-foreground">
          Gestiona tus tareas y mantén el enfoque en lo importante.
        </p>
      </header>
      <Suspense
        fallback={
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Spinner />
              </EmptyMedia>
              <EmptyTitle>Cargando tareas...</EmptyTitle>
            </EmptyHeader>
          </Empty>
        }
      >
        <TasksData searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
