"use client";

import ProjectFormDialog from "@/components/projects-page/project-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError, ProjectResponse, projectsApi } from "@/lib/api/projects";
import { Add01Icon, AlertCircleIcon, ChartGanttIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import ProjectsList from "@/components/projects-page/list-section";

export default function Page() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projectFormDialogState, setProjectFormDialogState] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    projectsApi
      .list()
      .then((response) => setProjects(response))
      .catch((cause: unknown) =>
        setError(
          cause instanceof ApiError ? cause.message : "No se pudieron cargar los proyectos.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  function handleCreateProject() {
    setEditingProject(null);
    setProjectFormDialogState(true);
  }

  function handleEditProject(project: ProjectResponse) {
    setEditingProject(project);
    setProjectFormDialogState(true);
  }

  function handleProjectSaved(saved: ProjectResponse) {
    setProjects((prev) =>
      prev.some((p) => p.id === saved.id)
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [saved, ...prev],
    );
  }

  function handleProjectDeleted(projectId: string) {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }

  let content = (
    <>
      <ProjectFormDialog
        key={editingProject?.id}
        open={projectFormDialogState}
        onOpenChange={(open) => {
          setProjectFormDialogState(open);
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
        onSaved={handleProjectSaved}
      />

      <ProjectsList
        projects={projects}
        loading={loading}
        onEdit={handleEditProject}
        onDelete={handleProjectDeleted}
      />
    </>
  );

  if (error) {
    content = (
      <Alert variant="destructive" className="max-w-md">
        <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} size={30} />
        <AlertTitle>Error al cargar projectos</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header className="flex justify-between">
        <div className="w-full">
          <h1 className="flex gap-2 text-2xl font-semibold tracking-tight">
            <HugeiconsIcon icon={ChartGanttIcon} strokeWidth={2} size={30} />
            Proyectos
          </h1>
          <p className="text-muted-foreground">
            Agrupa tus tareas en proyectos y dale contexto a tu trabajo.
          </p>
        </div>

        {!error && (
          <Button onClick={handleCreateProject}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Crear proyecto
          </Button>
        )}
      </header>

      {content}
    </main>
  );
}
