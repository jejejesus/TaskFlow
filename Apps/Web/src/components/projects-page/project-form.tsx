"use client";

import {
  ApiError,
  CreateProjectRequest,
  ProjectResponse,
  projectsApi,
  UpdateProjectRequest,
} from "@/lib/api/projects";
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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");

  useEffect(() => {
    if (!open) return;
    setSubmitting(false);
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

    const payload: CreateProjectRequest | UpdateProjectRequest = {
      name: name,
      description: description,
      color: color,
    };

    try {
      const saved = project
        ? await projectsApi.update(project.id, payload)
        : await projectsApi.create(payload);

      toast.add({
        title: isEditing ? "Proyecto editado" : "Proyecto creado",
        description: saved.name,
        type: "success",
      });

      onSaved?.(saved);
    } catch (cause: unknown) {
      toast.add({
        title: "Error al guardar el proyecto",
        description: cause instanceof ApiError ? cause.message : "No se pudo guardar el proyecto.",
        type: "error",
        priority: "high",
      });
    } finally {
      setSubmitting(false);
      onOpenChange(false);
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
