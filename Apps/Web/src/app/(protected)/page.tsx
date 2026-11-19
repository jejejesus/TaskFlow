import { Suspense } from "react";
import { serverProjects, serverTasks } from "@/lib/api/server";
import { TaskCurrentStatus } from "@/lib/api/tasks";
import { Summary } from "@/components/main-page/summary-section";
import TaskProjects from "@/components/main-page/tasks-projects-section";
import { DataError } from "@/components/data-error";

async function DashboardData() {
  try {
    const [recent, completed, pending, projects] = await Promise.all([
      serverTasks.list({ Page: 1, PageSize: 6 }),
      serverTasks.list({ Page: 1, PageSize: 1, Status: TaskCurrentStatus.Done }),
      serverTasks.list({ Page: 1, PageSize: 1, Status: TaskCurrentStatus.Todo }),
      serverProjects.list(),
    ]);
    return (
      <>
        <Summary
          counts={{
            total: recent.totalCount,
            completed: completed.totalCount,
            pending: pending.totalCount,
          }}
          projectCount={projects.length}
        />
        <TaskProjects tasks={recent.items} projects={projects} />
      </>
    );
  } catch (error) {
    return <DataError error={error} title="Error al cargar datos" />;
  }
}

export default function Page() {
  return (
    <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tus tareas y proyectos.</p>
      </header>
      <Suspense
        fallback={
          <>
            <Summary counts={{ total: 0, completed: 0, pending: 0 }} projectCount={0} loading />
            <TaskProjects tasks={[]} projects={[]} loading />
          </>
        }
      >
        <DashboardData />
      </Suspense>
    </main>
  );
}
