import { Suspense } from "react";
import { ChartGanttIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { serverProjects } from "@/lib/api/server";
import { DataError } from "@/components/data-error";
import { ProjectsWorkspace } from "@/components/projects-page/projects-workspace";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

async function ProjectsData() {
  try {
    const projects = await serverProjects.list();
    return <ProjectsWorkspace projects={projects} />;
  } catch (error) {
    return <DataError error={error} title="Error al cargar proyectos" />;
  }
}

export default function Page() {
  return (
    <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header>
        <h1 className="flex gap-2 text-2xl font-semibold tracking-tight">
          <HugeiconsIcon icon={ChartGanttIcon} size={30} />
          Proyectos
        </h1>
        <p className="text-muted-foreground">
          Agrupa tus tareas en proyectos y dale contexto a tu trabajo.
        </p>
      </header>
      <Suspense
        fallback={
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Spinner />
              </EmptyMedia>
              <EmptyTitle>Cargando proyectos...</EmptyTitle>
            </EmptyHeader>
          </Empty>
        }
      >
        <ProjectsData />
      </Suspense>
    </main>
  );
}
