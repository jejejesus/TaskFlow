"use client";

import DeleteDialog from "@/components/projects-page/delete-dialog";
import ProjectFormDialog from "@/components/projects-page/project-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ApiError, ProjectResponse, projectsApi } from "@/lib/api/projects";
import { AlertCircleIcon, Delete02Icon, Edit03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

export default function Page() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const params = useParams<{ projectSlug: string }>();
  const router = useRouter();

  const [project, setProject] = useState<ProjectResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projectFormDialogState, setProjectFormDialogState] = useState(false);
  const [deleteProject, setDeleteProject] = useState<ProjectResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    projectsApi
      .getById(params.projectSlug)
      .then((response) => setProject(response))
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : "No se pudo cargar el proyecto.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params]);

  function handleEditProject() {
    setProjectFormDialogState(true);
  }

  function handleProjectSaved(saved: ProjectResponse) {
    setProject(saved);
  }

  async function handleConfirmDelete() {
    if (!project || deleting) return;

    setDeleting(true);

    try {
      await projectsApi.remove(project.id);

      toast.add({
        title: "Proyecto eliminado",
        type: "success",
      });
    } catch (cause: unknown) {
      toast.add({
        title: "Error al eliminar el proyecto",
        description: cause instanceof ApiError ? cause.message : "No se pudo eliminar el proyecto.",
        type: "error",
        priority: "high",
      });
    } finally {
      setDeleting(false);
      setDeleteProject(null);
      router.back();
    }
  }

  if (error)
    return (
      <Alert variant="destructive" className="max-w-md">
        <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} size={30} />
        <AlertTitle>Error al cargar proyecto</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );

  return (
    <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header>
        {loading ? (
          <Card className="border-t-3 w-full p-4">
            <CardTitle>
              <Skeleton className="h-5 w-1/4" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-full mb-1" />
            </CardDescription>
          </Card>
        ) : (
          <Card
            className="border-t-3 w-full"
            style={{ borderTopColor: project?.color || "#6366F1" }}
          >
            <CardHeader>
              <CardAction>
                <Button variant="secondary" onClick={() => handleEditProject()}>
                  <HugeiconsIcon icon={Edit03Icon} />
                  Editar
                </Button>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        className="ml-2"
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteProject(project ?? null)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} />
                      </Button>
                    }
                  />
                  <TooltipContent>
                    <p>Eliminar proyecto</p>
                  </TooltipContent>
                </Tooltip>
              </CardAction>
              <CardTitle>{project?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-3">{project?.description}</CardDescription>
            </CardContent>
          </Card>
        )}
      </header>

      {project && (
        <>
          <ProjectFormDialog
            key={project.id}
            open={projectFormDialogState}
            onOpenChange={(open) => {
              setProjectFormDialogState(open);
            }}
            project={project}
            onSaved={handleProjectSaved}
          />

          <DeleteDialog
            project={deleteProject}
            onOpenChange={() => {
              setDeleteProject(null);
            }}
            onConfirm={handleConfirmDelete}
            deleting={deleting}
          />
        </>
      )}
    </main>
  );
}
