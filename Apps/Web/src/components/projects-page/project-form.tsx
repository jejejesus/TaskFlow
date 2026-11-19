"use client";

import { CreateProjectRequest, ProjectResponse } from "@/lib/api/projects";
import { saveProjectAction } from "@/actions/data-actions";
import { SessionExpired } from "@/components/session-expired";
import { SubmitEvent, useEffect, useState } from "react";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ColorPicker } from "@/components/ui/color-picker";

export default function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectResponse | null;
  onSaved?: (project: ProjectResponse) => void;
}) {
  const isEditing = Boolean(project);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    if (!open) return;
    setSubmitting(false);
    setError(null);
    setExpired(false);
    if (project) {
      setName(project.name);
      setDescription(project.description ?? "");
      setColor(project.color ?? "#6366F1");
    } else {
      setName("");
      setDescription("");
      setColor("#6366F1");
    }
  }, [open, project]);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);

    const payload: CreateProjectRequest = {
      name: name,
      description: description,
      color: color,
    };

    try {
      const result = await saveProjectAction(project?.id ?? null, payload);
      if (!result.success) {
        setError(result.error);
        setExpired(result.status === 401);
        return;
      }
      toast.add({
        title: isEditing ? "Proyecto editado" : "Proyecto creado",
        description: result.data.name,
        type: "success",
      });
      onSaved?.(result.data);
      onOpenChange(false);
    } catch {
      setError("No se pudo guardar el proyecto.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit} className="contents">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar proyecto" : "Nuevo proyecto"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Actualiza los datos del proyecto."
                : "Completa los datos para crear un nuevo proyecto."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {expired && <SessionExpired />}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">
                Nombre <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={submitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
                disabled={submitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="color">Color</FieldLabel>
              <ColorPicker
                id="accent-color"
                value={color}
                onValueChange={(e) => setColor(e || "")}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={submitting}>
                  Cancelar
                </Button>
              }
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner />
                  Guardando
                </>
              ) : (
                <>Guardar</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteDialog({
  project,
  onOpenChange,
  onConfirm,
  deleting,
  error,
  expired,
}: {
  project: ProjectResponse | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deleting: boolean;
  error?: string | null;
  expired?: boolean;
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
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {expired && <SessionExpired />}
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
