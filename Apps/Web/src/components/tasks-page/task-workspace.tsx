"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Add01Icon, KanbanIcon, ListIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SessionExpired } from "@/components/session-expired";
import TaskFormDialog from "@/components/tasks-page/task-form";
import TasksList from "@/components/tasks-page/list-section";
import TasksKanbanBoard from "@/components/tasks-page/kanban-section";
import { updateTaskSearchParams, type ViewMode } from "@/lib/task-query";
import type { GetTasksQuery, PagedResponse, TaskResponse } from "@/lib/api/tasks";

type ListError = { message: string; status?: number };

export default function TaskWorkspace({
  view,
  query,
  tasks,
  kanbanTasks,
  error,
  projectId,
  showCreate = true,
}: {
  view: ViewMode;
  query: GetTasksQuery;
  tasks: PagedResponse<TaskResponse> | null;
  kanbanTasks?: TaskResponse[] | null;
  error?: ListError | null;
  projectId?: string;
  showCreate?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const searchString = search.toString();
  const latestSearch = useRef(searchString);
  useEffect(() => {
    latestSearch.current = searchString;
  }, [searchString]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaskResponse | null>(null);

  const updateQuery = useCallback(
    (updates: Partial<GetTasksQuery>) => {
      const params = updateTaskSearchParams(new URLSearchParams(latestSearch.current), updates);
      latestSearch.current = params.toString();
      router.replace(`${pathname}?${latestSearch.current}`, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    if (view === "kanban" && searchString && searchString !== "view=kanban") {
      latestSearch.current = "view=kanban";
      router.replace(`${pathname}?view=kanban`, { scroll: false });
    }
  }, [view, searchString, pathname, router]);

  useEffect(() => {
    if (view === "list" && tasks && (query.Page ?? 1) > Math.max(1, tasks.totalPages)) {
      updateQuery({ Page: Math.max(1, tasks.totalPages) });
    }
  }, [view, tasks, query.Page, updateQuery]);

  function changeView(value: string) {
    const params = new URLSearchParams(value === "kanban" ? "" : latestSearch.current);
    params.set("view", value);
    latestSearch.current = params.toString();
    router.replace(`${pathname}?${latestSearch.current}`, { scroll: false });
  }

  function afterDelete() {
    if (tasks && tasks.items.length === 1 && (query.Page ?? 1) > 1) {
      updateQuery({ Page: (query.Page ?? 1) - 1 });
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {showCreate && (
        <div>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <HugeiconsIcon icon={Add01Icon} />
            Crear tarea
          </Button>
        </div>
      )}
      <TaskFormDialog
        key={editing?.id ?? projectId ?? "new"}
        open={open}
        onOpenChange={setOpen}
        task={editing}
        defaultProjectId={projectId}
        onSaved={() => router.refresh()}
      />
      <Tabs value={view} onValueChange={changeView}>
        <TabsList>
          <TabsTrigger value="kanban">
            <HugeiconsIcon icon={KanbanIcon} />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list">
            <HugeiconsIcon icon={ListIcon} />
            Lista
          </TabsTrigger>
        </TabsList>
        <TabsContent value="kanban">
          {error ? (
            error.status === 401 ? (
              <SessionExpired />
            ) : (
              <Alert variant="destructive" role="alert">
                <AlertTitle>Error al cargar tareas</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )
          ) : (
            kanbanTasks && (
              <TasksKanbanBoard
                tasks={kanbanTasks}
                onEdit={(task) => {
                  setEditing(task);
                  setOpen(true);
                }}
                onSaved={() => router.refresh()}
              />
            )
          )}
        </TabsContent>
        <TabsContent value="list">
          {error ? (
            error.status === 401 ? (
              <SessionExpired />
            ) : (
              <Alert variant="destructive" role="alert">
                <AlertTitle>Error al cargar tareas</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )
          ) : (
            tasks && (
              <TasksList
                tasks={tasks}
                queryParams={query}
                onEdit={(task) => {
                  setEditing(task);
                  setOpen(true);
                }}
                onDelete={afterDelete}
                onSaved={() => router.refresh()}
                onQueryChange={updateQuery}
                onPageChange={(page) => updateQuery({ Page: page })}
              />
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
