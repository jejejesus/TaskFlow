"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Edit03Icon, DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { changeTaskStatusAction } from "@/actions/data-actions";
import { LocalDate } from "@/components/local-date";
import { SessionExpired } from "@/components/session-expired";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskCurrentStatus, type TaskResponse } from "@/lib/api/tasks";
import { priorityLabels, priorityStyles, statusLabels } from "@/lib/util-constants/tasks-constants";

const statuses = [TaskCurrentStatus.Todo, TaskCurrentStatus.InProgress, TaskCurrentStatus.Done];

export default function TasksKanbanBoard({
  tasks,
  onEdit,
  onSaved,
}: {
  tasks: TaskResponse[];
  onEdit: (task: TaskResponse) => void;
  onSaved: () => void;
}) {
  const [items, setItems] = useState(tasks);
  const [pending, setPending] = useState(false);
  const [expired, setExpired] = useState(false);
  const pendingRef = useRef(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    setItems(tasks);
  }, [tasks]);

  async function changeStatus(task: TaskResponse, status: TaskCurrentStatus) {
    if (pendingRef.current || task.status === status) return;
    pendingRef.current = true;
    setPending(true);
    setExpired(false);
    try {
      const result = await changeTaskStatusAction(task.id, status);
      if (!result.success) {
        setExpired(result.status === 401);
        toast.add({
          title: "Error al cambiar el estatus",
          description: result.error,
          type: "error",
          priority: "high",
        });
        return;
      }
      setItems((current) =>
        current.map((item) => (item.id === task.id ? { ...item, status } : item)),
      );
      onSaved();
    } catch {
      toast.add({
        title: "Error al cambiar el estatus",
        description: "No se pudo actualizar la tarea.",
        type: "error",
        priority: "high",
      });
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const task = items.find((item) => item.id === active.id);
    const status = over?.data.current?.status as TaskCurrentStatus | undefined;
    if (task && status !== undefined) void changeStatus(task, status);
  }

  return (
    <section className="flex flex-col gap-6" aria-label="Tablero de tareas">
      {expired && <SessionExpired />}
      <DndContext
        sensors={sensors}
        collisionDetection={(args) => {
          const collisions = pointerWithin(args);
          return collisions.length ? collisions : rectIntersection(args);
        }}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          {statuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={items.filter((task) => task.status === status)}
              pending={pending}
              onEdit={onEdit}
              onChangeStatus={changeStatus}
            />
          ))}
        </div>
      </DndContext>
    </section>
  );
}

function KanbanColumn({
  status,
  tasks,
  pending,
  onEdit,
  onChangeStatus,
}: {
  status: TaskCurrentStatus;
  tasks: TaskResponse[];
  pending: boolean;
  onEdit: (task: TaskResponse) => void;
  onChangeStatus: (task: TaskResponse, status: TaskCurrentStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}`, data: { status } });

  return (
    <section
      ref={setNodeRef}
      aria-label={statusLabels[status]}
      className={`min-h-48 rounded-xl border p-3 transition-colors ${
        isOver ? "border-primary bg-primary/5" : "bg-muted/40"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <h2 className="font-semibold">{statusLabels[status]}</h2>
        <Badge variant="secondary" aria-label={`${tasks.length} tareas`}>
          {tasks.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            No hay tareas en esta columna.
          </p>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              pending={pending}
              onEdit={onEdit}
              onChangeStatus={onChangeStatus}
            />
          ))
        )}
      </div>
    </section>
  );
}

function KanbanCard({
  task,
  pending,
  onEdit,
  onChangeStatus,
}: {
  task: TaskResponse;
  pending: boolean;
  onEdit: (task: TaskResponse) => void;
  onChangeStatus: (task: TaskResponse, status: TaskCurrentStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: pending,
  });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), zIndex: isDragging ? 10 : undefined }}
      className={`relative rounded-lg border bg-card p-3 shadow-sm ${isDragging ? "opacity-80 shadow-lg" : ""}`}
    >
      <div className="flex items-start gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="-ml-1 cursor-grab touch-none active:cursor-grabbing"
          aria-label={`Arrastrar ${task.title}`}
          disabled={pending}
          {...attributes}
          {...listeners}
        >
          <HugeiconsIcon icon={DragDropVerticalIcon} />
        </Button>
        <h3 className="min-w-0 flex-1 pt-1 font-medium wrap-break-word">{task.title}</h3>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Editar ${task.title}`}
          onClick={() => onEdit(task)}
          disabled={pending}
        >
          <HugeiconsIcon icon={Edit03Icon} />
        </Button>
      </div>
      {task.description && (
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{task.description}</p>
      )}
      <div className="mt-3 mb-2 flex flex-wrap items-center gap-2">
        <Badge className={priorityStyles[task.priority]}>{priorityLabels[task.priority]}</Badge>
        {task.projectName && (
          <Badge variant="secondary">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: task.projectColor || "#6366F1" }}
            />
            {task.projectName}
          </Badge>
        )}
      </div>
      {task.dueDate && (
        <p className="mb-2 text-sm text-muted-foreground">
          Vencimiento: <LocalDate value={task.dueDate} />
        </p>
      )}
      <Select
        aria-label={`Cambiar estatus de ${task.title}`}
        value={task.status}
        disabled={pending}
        onValueChange={(value) => onChangeStatus(task, Number(value) as TaskCurrentStatus)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Todos">
            {(value: string) => statusLabels[Number(value)]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger>
          <SelectGroup>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </article>
  );
}
