"use client";

import { useEffect, useRef, useState } from "react";
import { deleteTaskAction, saveTaskAction } from "@/actions/data-actions";
import { LocalDate } from "@/components/local-date";
import { SessionExpired } from "@/components/session-expired";
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
  Search01Icon,
  Sorting01Icon,
  Sorting02Icon,
} from "@hugeicons/core-free-icons";
import {
  statusLabels,
  statusStyles,
  priorityLabels,
  priorityStyles,
  taskSortFieldLabels,
} from "@/lib/util-constants/tasks-constants";
import {
  CreateTaskRequest,
  GetTasksQuery,
  PagedResponse,
  TaskResponse,
  TaskAllowedSortFields,
} from "@/lib/api/tasks";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Field, FieldLabel } from "@/components/ui/field";
import { DeleteDialog } from "./task-form";

export default function TasksList({
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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  async function handleDuplicateTask(task: TaskResponse) {
    const duplicated: CreateTaskRequest = {
      title: task.title.trim() + " - Copia",
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      projectId: task.projectId,
    };

    try {
      const result = await saveTaskAction(null, duplicated);
      if (!result.success) {
        setExpired(result.status === 401);
        toast.add({
          title: "Error al duplicar la tarea",
          description: result.error,
          type: "error",
          priority: "high",
        });
        return;
      }
      toast.add({ title: "Tarea duplicada", type: "success" });
      onSaved?.(result.data);
    } catch {
      toast.add({
        title: "Error al duplicar la tarea",
        description: "No se pudo duplicar la tarea.",
        type: "error",
        priority: "high",
      });
    }
  }

  async function handleConfirmDelete() {
    if (!taskToDelete || deleting) return;

    setDeleting(true);

    try {
      const result = await deleteTaskAction(taskToDelete.id);
      if (!result.success) {
        setDeleteError(result.error);
        setExpired(result.status === 401);
        return;
      }
      toast.add({ title: "Tarea eliminada", type: "success" });
      onDelete(taskToDelete.id);
      setTaskToDelete(null);
    } catch {
      setDeleteError("No se pudo eliminar la tarea.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-6">
      <TaskQuery queryParams={queryParams} onQueryChange={onQueryChange} />
      {expired && !taskToDelete && <SessionExpired />}

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
                setDeleteError(null);
              }
            }}
            onConfirm={handleConfirmDelete}
            deleting={deleting}
            error={deleteError}
            expired={expired}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarea</TableHead>
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
                  <TableCell>
                    <LocalDate value={task.dueDate} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Acciones de ${task.title}`}
                          >
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
                          onClick={() => {
                            setDeleteError(null);
                            setTaskToDelete(task);
                          }}
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

const ALL_VALUE = "all";

export function TaskQuery({
  queryParams,
  onQueryChange,
}: {
  queryParams: GetTasksQuery;
  onQueryChange: (updates: Partial<GetTasksQuery>) => void;
}) {
  const [searchInput, setSearchInput] = useState(queryParams.Search ?? "");
  const latestQuery = useRef(queryParams.Search ?? "");
  const latestChange = useRef(onQueryChange);
  useEffect(() => {
    latestQuery.current = queryParams.Search ?? "";
    latestChange.current = onQueryChange;
  }, [queryParams.Search, onQueryChange]);

  useEffect(() => {
    setSearchInput(queryParams.Search ?? "");
  }, [queryParams.Search]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (latestQuery.current !== searchInput) {
        latestChange.current({ Search: searchInput || undefined, Page: 1 });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const triggerSearchNow = () => {
    onQueryChange({ Search: searchInput || undefined, Page: 1 });
  };

  const ascDesc = queryParams.SortDirection ?? "asc";

  const toggleAscDesc = () => {
    onQueryChange({
      SortDirection: ascDesc === "asc" ? "desc" : "asc",
      Page: 1,
    });
  };

  const statusValue = queryParams.Status !== undefined ? String(queryParams.Status) : ALL_VALUE;
  const priorityValue =
    queryParams.Priority !== undefined ? String(queryParams.Priority) : ALL_VALUE;
  const sortByValue = queryParams.SortBy ?? undefined;

  return (
    <div className="flex flex-wrap gap-2">
      <Field className="w-full max-w-72">
        <FieldLabel>Buscar</FieldLabel>
        <ButtonGroup>
          <Input
            placeholder="Buscar..."
            className="w-full"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") triggerSearchNow();
            }}
          />
          <Button variant="outline" aria-label="Buscar" onClick={triggerSearchNow}>
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          </Button>
        </ButtonGroup>
      </Field>

      <Field className="w-full max-w-48">
        <FieldLabel>Estatus</FieldLabel>
        <ButtonGroup>
          <Select
            value={statusValue}
            onValueChange={(value) => {
              onQueryChange({
                Status: value === ALL_VALUE ? undefined : Number(value),
                Page: 1,
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos">
                {(value: string) =>
                  value === ALL_VALUE ? "Todos" : (statusLabels[Number(value)] ?? "Todos")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger>
              <SelectGroup>
                <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </ButtonGroup>
      </Field>

      <Field className="w-full max-w-48">
        <FieldLabel>Prioridad</FieldLabel>
        <ButtonGroup>
          <Select
            value={priorityValue}
            onValueChange={(value) => {
              onQueryChange({
                Priority: value === ALL_VALUE ? undefined : Number(value),
                Page: 1,
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas">
                {(value: string) =>
                  value === ALL_VALUE ? "Todas" : (priorityLabels[Number(value)] ?? "Todas")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger>
              <SelectGroup>
                <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                {Object.entries(priorityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </ButtonGroup>
      </Field>

      <Field className="w-full max-w-60">
        <FieldLabel>Ordenar por</FieldLabel>
        <ButtonGroup>
          <Select
            value={sortByValue}
            onValueChange={(value) => {
              onQueryChange({ SortBy: value as TaskAllowedSortFields, Page: 1 });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Fecha de creación">
                {(value: string) => taskSortFieldLabels[value]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger>
              <SelectGroup>
                {Object.entries(taskSortFieldLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={ascDesc === "asc" ? "Orden ascendente" : "Orden descendente"}
                  onClick={toggleAscDesc}
                >
                  <HugeiconsIcon
                    icon={ascDesc === "asc" ? Sorting02Icon : Sorting01Icon}
                    strokeWidth={2}
                  />
                </Button>
              }
            />
            <TooltipContent>
              <p>{ascDesc === "asc" ? "Mayor a menor" : "Menor a mayor"}</p>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </Field>
    </div>
  );
}

export function TasksPagination({
  tasks,
  onPageChange,
}: {
  tasks: PagedResponse<TaskResponse>;
  onPageChange: (page: number) => void;
}) {
  const { page: currentPage, totalPages } = tasks;

  const getVisiblePages = (): number[] => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 2) {
      return [1, 2, 3];
    }

    if (currentPage >= totalPages - 1) {
      return [totalPages - 2, totalPages - 1, totalPages];
    }

    return [currentPage - 1, currentPage, currentPage + 1];
  };

  const visiblePages = getVisiblePages();
  const showLeftEllipsis = visiblePages[0] > 1;
  const showRightEllipsis = visiblePages[visiblePages.length - 1] < totalPages;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text="Anterior"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(currentPage - 1);
            }}
            aria-disabled={currentPage === 1}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {showLeftEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {visiblePages.map((p) => (
          <PaginationItem key={p}>
            <PaginationLink
              href="#"
              isActive={p === currentPage}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(p);
              }}
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}

        {showRightEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            text="Siguiente"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(currentPage + 1);
            }}
            aria-disabled={currentPage === totalPages}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
