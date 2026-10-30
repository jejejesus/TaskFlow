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

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CreateTaskRequest,
  TaskPriority,
  TaskResponse,
  tasksApi,
  UpdateTaskRequest,
} from "@/lib/api/tasks";
import { ApiError } from "@/lib/api/helper";
import { Textarea } from "../ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { priorityLabels } from "@/lib/util-constants/tasks-constants";

function formatDate(value: Date | undefined) {
  if (!value) return "Sin fecha límite";
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

type TaskFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskResponse | null;
  onSaved?: (task: TaskResponse) => void;
};

export default function TaskFormDialog({ open, onOpenChange, task, onSaved }: TaskFormDialogProps) {
  const isEditing = Boolean(task);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Low);
  const [dueDate, setDueDate] = useState<Date>();

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitting(false);
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority);
      setDueDate(task.dueDate ?? undefined);
    } else {
      setTitle("");
      setDescription("");
      setPriority(TaskPriority.Low);
    }
  }, [open, task]);

  let priorities = Object.entries(priorityLabels).map(([key, label]) => ({
    value: key,
    label,
  }));

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const payload: CreateTaskRequest | UpdateTaskRequest = {
      title: title,
      description: description,
      priority: priority,
      dueDate: dueDate ?? null,
      projectId: task?.projectId ?? null,
    };

    console.log(payload);

    try {
      const saved = task ? await tasksApi.update(task.id, payload) : await tasksApi.create(payload);

      onSaved?.(saved);
      onOpenChange(false);
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : "No se pudo guardar la tarea.");
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
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Título</FieldLabel>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Descripción</FieldLabel>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="priority">Prioridad</FieldLabel>
              <Select
                items={priorities}
                value={String(priority)}
                onValueChange={(value) => setPriority(Number(value) as TaskPriority)}
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
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              }
            />
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
