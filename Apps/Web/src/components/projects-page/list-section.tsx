import { ApiError, ProjectResponse, projectsApi } from "@/lib/api/projects";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "../ui/button";
import { MoreVerticalIcon, TaskRemove01Icon } from "@hugeicons/core-free-icons";
import { Spinner } from "../ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useState } from "react";
import { toast } from "../ui/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";

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

  async function handleConfirmDelete() {
    if (!projectToDelete || deleting) return;

    setDeleting(true);

    try {
      await projectsApi.remove(projectToDelete.id);

      toast.add({
        title: "Proyecto eliminado",
        type: "success",
      });

      onDelete?.(projectToDelete.id);
    } catch (cause: unknown) {
      toast.add({
        title: "Error al eliminar el proyecto",
        description: cause instanceof ApiError ? cause.message : "No se pudo eliminar el proyecto.",
        type: "error",
        priority: "high",
      });
    } finally {
      setDeleting(false);
      setProjectToDelete(null);
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
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Spinner />
            </EmptyMedia>
            <EmptyTitle>Cargando proyectos...</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <DeleteDialog
            project={projectToDelete}
            onOpenChange={(open) => {
              if (!open) {
                setProjectToDelete(null);
              }
            }}
            onConfirm={handleConfirmDelete}
            deleting={deleting}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proyecto</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Badge
                      className="py-3"
                      variant="secondary"
                      style={{ backgroundColor: project.color || "#6366F1" }}
                    >
                      {project.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{project.description}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" className="size-8">
                            <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(project)}>Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setProjectToDelete(project)}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </section>
  );
}

function DeleteDialog({
  project,
  onOpenChange,
  onConfirm,
  deleting,
}: {
  project: ProjectResponse | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <AlertDialog open={Boolean(project)} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
          <AlertDialogDescription>
            El proyecto {project?.name} se eliminará de manera permanente. No habrá vuelta atrás.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" disabled={deleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner />
                Eliminando
              </>
            ) : (
              <>Eliminar</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
