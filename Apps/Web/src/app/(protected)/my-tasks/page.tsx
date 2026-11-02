"use client";

import { useEffect, useState } from "react";
import {
  GetTasksQuery,
  TaskAllowedSortFields,
  tasksApi,
  ApiError,
  TaskResponse,
  PagedResponse,
} from "@/lib/api/tasks";
import TaskList from "@/components/tasks-page/list-section";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, CheckListIcon, ListIcon, KanbanIcon } from "@hugeicons/core-free-icons";
import TaskFormDialog from "@/components/tasks-page/task-form";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() {
  const [tasks, setTasks] = useState<PagedResponse<TaskResponse>>({
    items: [],
    page: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryParams, setQueryParams] = useState<GetTasksQuery>({
    Page: 1,
    PageSize: 10,
    Status: undefined,
    Priority: undefined,
    SortBy: TaskAllowedSortFields.CreatedAt,
    SortDirection: "asc",
  });

  const [taskFormDialogState, setTaskFormDialogState] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    console.log(queryParams);
    tasksApi
      .list(queryParams)
      .then((response) => {
        if (!cancelled) setTasks(response);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof ApiError ? cause.message : "No se pudieron cargar las tareas.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [queryParams]);

  function handleCreateTask() {
    setEditingTask(null);
    setTaskFormDialogState(true);
  }

  function handleEditTask(taskId: string) {
    const task = tasks.items.find((t) => t.id === taskId) ?? null;
    setEditingTask(task);
    setTaskFormDialogState(true);
  }

  function handleTaskSaved(saved: TaskResponse) {
    setTasks((prev) => {
      const exists = prev.items.some((t) => t.id === saved.id);

      const newItems = exists
        ? prev.items.map((t) => (t.id === saved.id ? saved : t))
        : [saved, ...prev.items];

      return {
        ...prev,
        items: newItems,
      };
    });
  }

  function handleQueryChange(updates: Partial<GetTasksQuery>) {
    setQueryParams((prev) => ({ ...prev, ...updates }));
    console.log(queryParams);
  }

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > tasks.totalPages || newPage === queryParams.Page) return;
    setQueryParams((prev) => ({ ...prev, Page: newPage }));
  }

  if (error) {
    return (
      <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex justify-between">
          <div className="w-full">
            <h1 className="flex gap-2 text-2xl font-semibold tracking-tight">
              <HugeiconsIcon icon={CheckListIcon} strokeWidth={2} size={30} />
              Mis tareas
            </h1>
            <p className="text-muted-foreground">
              Gestiona tus tareas y mantén el enfoque en lo importante.
            </p>
          </div>
        </header>

        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      </main>
    );
  }

  return (
    <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header className="flex justify-between">
        <div className="w-full">
          <h1 className="flex gap-2 text-2xl font-semibold tracking-tight">
            <HugeiconsIcon icon={CheckListIcon} strokeWidth={2} size={30} />
            Mis tareas
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus tareas y mantén el enfoque en lo importante.
          </p>
        </div>

        <Button onClick={handleCreateTask}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Crear tarea
        </Button>
      </header>

      <TaskFormDialog
        key={editingTask?.id}
        open={taskFormDialogState}
        onOpenChange={(open) => {
          setTaskFormDialogState(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        onSaved={handleTaskSaved}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="list">
            <HugeiconsIcon icon={ListIcon} strokeWidth={2} />
            Lista
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <HugeiconsIcon icon={KanbanIcon} strokeWidth={2} />
            Kanban
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <TaskList
            tasks={tasks}
            loading={loading}
            queryParams={queryParams}
            onEditTask={handleEditTask}
            onQueryChange={handleQueryChange}
            onPageChange={handlePageChange}
          />
        </TabsContent>
        <TabsContent value="kanban"></TabsContent>
      </Tabs>
    </main>
  );
}
