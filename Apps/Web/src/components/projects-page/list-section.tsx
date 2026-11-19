"use client";

import type { ProjectResponse } from "@/lib/api/projects";
import { deleteProjectAction } from "@/actions/data-actions";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
  Delete02Icon,
  Edit03Icon,
  MoreVerticalIcon,
  TaskRemove01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "../ui/card";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteDialog } from "./project-form";

export default function ProjectsList({
  projects,
  loading = false,
  onEdit,
  onDelete,
}: {
  projects: ProjectResponse[];
  loading?: boolean;
  onEdit: (project: ProjectResponse) => void;
  onDelete: (projectId: string) => void;
}) {
  const [projectToDelete, setProjectToDelete] = useState<ProjectResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  async function handleConfirmDelete() {
    if (!projectToDelete || deleting) return;

    setDeleting(true);

    try {
      const result = await deleteProjectAction(projectToDelete.id);
      if (!result.success) {
        setError(result.error);
        setExpired(result.status === 401);
        return;
      }
      toast.add({ title: "Proyecto eliminado", type: "success" });
      onDelete(projectToDelete.id);
      setProjectToDelete(null);
    } catch {
      setError("No se pudo eliminar el proyecto.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-6">
      {!loading && projects.length <= 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={TaskRemove01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Aún no tienes proyectos</EmptyTitle>
            <EmptyDescription>
              No has creado ningún proyecto todavía. Inicia creando un proyecto.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : loading ? (
        <div className="flex flex-wrap gap-3">
          {[...Array(4).keys()].map((key) => (
            <Card className="border-t-3 w-sm h-30" key={key}>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-5 w-2/3 mb-1" />
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-4/5 mb-1" />
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <DeleteDialog
            project={projectToDelete}
            onOpenChange={(open) => {
              if (!open) {
                setProjectToDelete(null);
                setError(null);
              }
            }}
            onConfirm={handleConfirmDelete}
            deleting={deleting}
            error={error}
            expired={expired}
          />

          <div className="flex flex-wrap gap-3">
            {projects.map((project) => (
              <Card
                className="border-t-3 w-sm h-30"
                style={{ borderTopColor: project.color || "#6366F1" }}
                key={project.id}
              >
                <CardHeader>
                  <CardAction>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="size-8">
                            <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          render={
                            <Link href={`/projects/${project.id}?view=kanban`}>
                              <HugeiconsIcon icon={ViewIcon} />
                              Ver
                            </Link>
                          }
                        />
                        <DropdownMenuItem onClick={() => onEdit(project)}>
                          <HugeiconsIcon icon={Edit03Icon} />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setError(null);
                            setExpired(false);
                            setProjectToDelete(project);
                          }}
                        >
                          <HugeiconsIcon icon={Delete02Icon} />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardAction>
                  <CardTitle>
                    <Link className="hover:underline" href={`/projects/${project.id}?view=kanban`}>
                      {project.name}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-3">{project.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
