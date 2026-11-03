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
import { toast } from "../ui/toast";
import { Spinner } from "../ui/spinner";

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
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskResponse | null;
  onSaved?: (task: TaskResponse) => void;
}) {
  const isEditing = Boolean(task);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Low);
  const [dueDate, setDueDate] = useState<Date>();

  useEffect(() => {
    if (!open) return;
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

      toast.add({
        title: isEditing ? "Tarea editada" : "Tarea creada",
        description: saved.title,
        type: "success",
      });

      onSaved?.(saved);
    } catch (cause: unknown) {
      toast.add({
        title: "Error al guardar la tarea",
        description: cause instanceof ApiError ? cause.message : "No se pudo guardar la tarea.",
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
            <DialogTitle>{isEditing ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Actualiza los datos de la tarea."
                : "Completa los datos para crear una nueva tarea."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Título</FieldLabel>
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
