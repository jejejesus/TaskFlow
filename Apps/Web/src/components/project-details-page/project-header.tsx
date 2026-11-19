"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Delete02Icon, Edit03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { deleteProjectAction } from "@/actions/data-actions";
import ProjectFormDialog, { DeleteDialog } from "@/components/projects-page/project-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import type { ProjectResponse } from "@/lib/api/projects";

export function ProjectHeader({ project }: { project: ProjectResponse }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  async function confirmDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      const result = await deleteProjectAction(project.id);
      if (!result.success) {
        setError(result.error);
        setExpired(result.status === 401);
        return;
      }
      toast.add({ title: "Proyecto eliminado", type: "success" });
      setDeleteOpen(false);
      router.push("/projects");
      router.refresh();
    } catch {
      setError("No se pudo eliminar el proyecto.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card className="border-t-3 w-full" style={{ borderTopColor: project.color || "#6366F1" }}>
        <CardHeader>
          <CardAction className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <HugeiconsIcon icon={Edit03Icon} />
              Editar
            </Button>
            <Button
              variant="destructive"
              size="icon"
              aria-label="Eliminar proyecto"
              onClick={() => {
                setError(null);
                setExpired(false);
                setDeleteOpen(true);
              }}
            >
              <HugeiconsIcon icon={Delete02Icon} />
            </Button>
          </CardAction>
          <CardTitle>{project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>{project.description}</CardDescription>
        </CardContent>
      </Card>
      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onSaved={() => router.refresh()}
      />
      <DeleteDialog
        project={deleteOpen ? project : null}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        deleting={deleting}
        error={error}
        expired={expired}
      />
    </>
  );
}
