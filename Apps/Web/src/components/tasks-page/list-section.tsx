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
import { TaskRemove01Icon, MoreVerticalIcon } from "@hugeicons/core-free-icons";
import {
  statusLabels,
  statusStyles,
  priorityLabels,
  priorityStyles,
} from "@/lib/util-constants/tasks-constants";
import { GetTasksQuery, PagedResponse, TaskResponse } from "@/lib/api/tasks";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import { Spinner } from "../ui/spinner";
import { Badge } from "../ui/badge";
import TasksPagination from "./list-pagination";
import TaskQuery from "./list-query";

function formatDate(value: Date | null) {
  if (!value) return "Sin fecha límite";
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function TasksList({
  tasks,
  loading = false,
  queryParams,
  onEditTask,
  onQueryChange,
  onPageChange,
}: {
  tasks: PagedResponse<TaskResponse>;
  loading?: boolean;
  queryParams: GetTasksQuery;
  onEditTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onQueryChange: (updates: Partial<GetTasksQuery>) => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <section className="flex flex-1 flex-col gap-6">
      <TaskQuery queryParams={queryParams} onQueryChange={onQueryChange} />

      {!loading && tasks.items.length <= 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={TaskRemove01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Aún no tienes tareas</EmptyTitle>
            <EmptyDescription>
              No has creado o no te han asignado tareas todavía. Inicia creando una tarea o un
              proyecto.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <Button>Crear tarea</Button>
            <Button variant="outline">Crear proyecto</Button>
          </EmptyContent>
        </Empty>
      ) : loading && tasks.items.length <= 0 ? (
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
                      <Badge className="py-3" variant="secondary">
                        <span
                          className="size-3 shrink-0 rounded-sm"
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
                            <span className="sr-only">Open menu</span>
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditTask(task.id)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive">Eliminar</DropdownMenuItem>
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
