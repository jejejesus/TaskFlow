"use client";

import { SubmitEvent, useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { CreateTaskRequest, TaskPriority, TaskResponse } from "@/lib/api/tasks";
import { saveTaskAction } from "@/actions/data-actions";
import { SessionExpired } from "@/components/session-expired";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { priorityLabels } from "@/lib/util-constants/tasks-constants";
import { toast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";

function formatDate(value: Date | undefined) {
  if (!value) return "Sin fecha límite";
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultProjectId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskResponse | null;
  defaultProjectId?: string;
  onSaved?: (task: TaskResponse) => void;
}) {
  const isEditing = Boolean(task);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Low);
  const [dueDate, setDueDate] = useState<Date>();

  useEffect(() => {
    if (!open) return;
    setSubmitting(false);
    setError(null);
    setExpired(false);
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setProjectId(task.projectId ?? "");
      setPriority(task.priority);
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    } else {
      setTitle("");
      setDescription("");
      setProjectId(defaultProjectId ?? "");
      setPriority(TaskPriority.Low);
      setDueDate(undefined);
    }
  }, [open, task, defaultProjectId]);

  let priorities = Object.entries(priorityLabels).map(([key, label]) => ({
    value: key,
    label,
  }));

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);

    const payload: CreateTaskRequest = {
      title: title,
      description: description,
      projectId: projectId === "" ? null : projectId,
      priority: priority,
      dueDate: dueDate?.toISOString() ?? null,
    };

    try {
      const result = await saveTaskAction(task?.id ?? null, payload);
      if (!result.success) {
        setError(result.error);
        setExpired(result.status === 401);
        return;
      }
      toast.add({
        title: isEditing ? "Tarea editada" : "Tarea creada",
        description: result.data.title,
        type: "success",
      });
      onSaved?.(result.data);
      onOpenChange(false);
    } catch {
      setError("No se pudo guardar la tarea.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit} className="contents">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Actualiza los datos de la tarea."
                : "Completa los datos para crear una nueva tarea."}
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
              <FieldLabel htmlFor="title">
                Título <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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

            <Field className="max-w-40">
              <FieldLabel htmlFor="priority">Prioridad</FieldLabel>
              <Select
                items={priorities}
                value={String(priority)}
                onValueChange={(value) => setPriority(Number(value) as TaskPriority)}
                disabled={submitting}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger>
                  <SelectGroup>
                    {priorities.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="dueDate">Vencimiento</FieldLabel>
              <Popover>
                <PopoverTrigger
                  id="dueDate"
                  render={
                    <Button
                      variant="outline"
                      data-empty={!dueDate}
                      className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                    />
                  }
                  disabled={submitting}
                >
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
                  {formatDate(dueDate)}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
                </PopoverContent>
              </Popover>
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
  task,
  onOpenChange,
  onConfirm,
  deleting,
  error,
  expired,
}: {
  task: TaskResponse | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deleting: boolean;
  error?: string | null;
  expired?: boolean;
}) {
  return (
    <AlertDialog open={Boolean(task)} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
          <AlertDialogDescription>
            La tarea {task?.title} se eliminará de manera permanente. No habrá vuelta atrás.
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
