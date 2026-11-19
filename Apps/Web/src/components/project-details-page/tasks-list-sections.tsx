import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  TaskRemove01Icon,
  MoreVerticalIcon,
  Edit03Icon,
  Delete02Icon,
  Copy02Icon,
} from "@hugeicons/core-free-icons";
import {
  statusLabels,
  statusStyles,
  priorityLabels,
  priorityStyles,
} from "@/lib/util-constants/tasks-constants";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {} from "@hugeicons/core-free-icons";
import { DeleteDialog } from "../tasks-page/task-form";
import {
  ApiError,
  CreateTaskRequest,
  GetTasksQuery,
  PagedResponse,
  TaskResponse,
  tasksApi,
} from "@/lib/api/tasks";
import { toast } from "../ui/toast";
import { TaskQuery, TasksPagination } from "../tasks-page/list-section";

function formatDate(value: Date | null) {
  if (!value) return "Sin fecha límite";
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function ProjectTasksList({
  tasks,
  loading = false,
  queryParams,
  onEdit,
  onDelete,
  onSaved,
  onQueryChange,
  onPageChange,
}: {
  tasks: PagedResponse<TaskResponse>;
  loading?: boolean;
  queryParams: GetTasksQuery;
  onEdit: (task: TaskResponse) => void;
  onDelete: (taskId: string) => void;
  onSaved?: (task: TaskResponse) => void;
  onQueryChange: (updates: Partial<GetTasksQuery>) => void;
  onPageChange: (page: number) => void;
}) {
  const [taskToDelete, setTaskToDelete] = useState<TaskResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDuplicateTask(task: TaskResponse) {
    const duplicated: CreateTaskRequest = {
      title: task.title.trim() + " - Copia",
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      projectId: task.projectId,
    };

    try {
      let saved = await tasksApi.create(duplicated);

      toast.add({
        title: "Tarea dupliada",
        type: "success",
      });

      onSaved?.(saved);
    } catch (cause: unknown) {
      toast.add({
        title: "Error al duplicar la tarea",
        description: cause instanceof ApiError ? cause.message : "No se pudo duplicar la tarea.",
        type: "error",
        priority: "high",
      });
    }
  }

  async function handleConfirmDelete() {
    if (!taskToDelete || deleting) return;

    setDeleting(true);

    try {
      await tasksApi.remove(taskToDelete.id);

      toast.add({
        title: "Tarea eliminada",
        type: "success",
      });

      onDelete?.(taskToDelete.id);
    } catch (cause: unknown) {
      toast.add({
        title: "Error al eliminar la tarea",
        description: cause instanceof ApiError ? cause.message : "No se pudo eliminar la tarea.",
        type: "error",
        priority: "high",
      });
    } finally {
      setDeleting(false);
      setTaskToDelete(null);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-6">
      <TaskQuery queryParams={queryParams} onQueryChange={onQueryChange} />

      {!loading && tasks.items.length <= 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={TaskRemove01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Sin tareas</EmptyTitle>
            <EmptyDescription>
              No tienes tareas asignadas todavía o no hay tareas con los filtros seleccionados.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : loading ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Spinner />
            </EmptyMedia>
            <EmptyTitle>Cargando tareas...</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <DeleteDialog
            task={taskToDelete}
            onOpenChange={(open) => {
              if (!open) {
                setTaskToDelete(null);
              }
            }}
            onConfirm={handleConfirmDelete}
            deleting={deleting}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarea</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.items.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>
                    {task.projectName && (
                      <Badge className="py-3 pr-3" variant="secondary">
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: task.projectColor || "#6366F1" }}
                        />
                        {task.projectName}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={statusStyles[task.status] ?? "bg-muted text-muted-foreground"}
                    >
                      {statusLabels[task.status] ?? "Desconocido"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={priorityStyles[task.priority] ?? "bg-muted text-muted-foreground"}
                    >
                      {priorityLabels[task.priority] ?? "Desconocido"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(task.dueDate)}</TableCell>
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
                        <DropdownMenuItem onClick={() => onEdit(task)}>
                          <HugeiconsIcon icon={Edit03Icon} />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateTask(task)}>
                          <HugeiconsIcon icon={Copy02Icon} />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setTaskToDelete(task)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TasksPagination tasks={tasks} onPageChange={onPageChange} />
        </>
      )}
    </section>
  );
}
