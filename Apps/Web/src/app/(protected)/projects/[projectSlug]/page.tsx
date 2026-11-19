"use client";

import ProjectTasksList from "@/components/project-details-page/tasks-list-sections";
import { DeleteDialog } from "@/components/projects-page/project-form";
import ProjectFormDialog from "@/components/projects-page/project-form";
import TaskFormDialog from "@/components/tasks-page/task-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ApiError, PagedResponse, ProjectResponse, projectsApi } from "@/lib/api/projects";
import { GetTasksQuery, TaskAllowedSortFields, TaskResponse, tasksApi } from "@/lib/api/tasks";
import {
  Add01Icon,
  AlertCircleIcon,
  Delete02Icon,
  Edit03Icon,
  KanbanIcon,
  ListIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type ViewMode = "kanban" | "list";

export default function Page() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  const params = useParams<{ projectSlug: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const viewParam = searchParams.get("view");
  const currentView: ViewMode = viewParam === "list" ? "list" : "kanban";

  const [project, setProject] = useState<ProjectResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projectFormDialogState, setProjectFormDialogState] = useState(false);
  const [deleteProject, setDeleteProject] = useState<ProjectResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [tasks, setTasks] = useState<PagedResponse<TaskResponse>>({
    items: [],
    page: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
  });
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [tasksQueryParams, setTasksQueryParams] = useState<GetTasksQuery>({
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
    setLoading(true);
    setError(null);

    projectsApi
      .getById(params.projectSlug)
      .then((response) => setProject(response))
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : "No se pudo cargar el proyecto.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params]);

  useEffect(() => {
    if (project) {
      setLoadingTasks(true);
      setTasksError(null);

      projectsApi
        .getTasks(project.id, tasksQueryParams)
        .then((response) => setTasks(response))
        .catch((cause: unknown) => {
          setTasksError(
            cause instanceof ApiError ? cause.message : "No se pudieron cargar las tareas.",
          );
        })
        .finally(() => {
          setLoadingTasks(false);
        });
    }
  }, [project, tasksQueryParams]);

  function handleViewChange(newView: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleEditProject() {
    setProjectFormDialogState(true);
  }

  function handleProjectSaved(saved: ProjectResponse) {
    setProject(saved);
  }

  function handleCreateTask() {
    setEditingTask(null);
    setTaskFormDialogState(true);
  }

  function handleEditTask(task: TaskResponse) {
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

  function handleTaskDeleted(taskId: string) {
    setTasks((prev) => ({
      ...prev,
      items: prev.items.filter((t) => t.id !== taskId),
      totalCount: (prev.totalCount ?? 0) - 1,
    }));
  }

  function handleTasksQueryChange(updates: Partial<GetTasksQuery>) {
    setTasksQueryParams((prev) => ({ ...prev, ...updates }));
  }

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > tasks.totalPages || newPage === tasksQueryParams.Page) return;
    setTasksQueryParams((prev) => ({ ...prev, Page: newPage }));
  }

  async function handleConfirmDelete() {
    if (!project || deleting) return;

    setDeleting(true);

    try {
      await projectsApi.remove(project.id);

      toast.add({
        title: "Proyecto eliminado",
        type: "success",
      });
    } catch (cause: unknown) {
      toast.add({
        title: "Error al eliminar el proyecto",
        description: cause instanceof ApiError ? cause.message : "No se pudo eliminar el proyecto.",
        type: "error",
        priority: "high",
      });
    } finally {
      setDeleting(false);
      setDeleteProject(null);
      router.back();
    }
  }

  if (error)
    return (
      <Alert variant="destructive" className="max-w-md">
        <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} size={30} />
        <AlertTitle>Error al cargar proyecto</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );

  return (
    <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header>
        {loading ? (
          <Card className="border-t-3 w-full p-4">
            <CardTitle>
              <Skeleton className="h-5 w-1/4" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-full mb-1" />
            </CardDescription>
          </Card>
        ) : (
          <Card
            className="border-t-3 w-full"
            style={{ borderTopColor: project?.color || "#6366F1" }}
          >
            <CardHeader>
              {!error && (
                <CardAction>
                  <Button variant="secondary" onClick={() => handleEditProject()}>
                    <HugeiconsIcon icon={Edit03Icon} />
                    Editar
                  </Button>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          className="ml-2"
                          variant="destructive"
                          size="icon"
                          onClick={() => setDeleteProject(project ?? null)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} />
                        </Button>
                      }
                    />
                    <TooltipContent>
                      <p>Eliminar proyecto</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button className="ml-2" variant="secondary" onClick={handleCreateTask}>
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                    Crear tarea
                  </Button>
                </CardAction>
              )}
              <CardTitle>{project?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-3">{project?.description}</CardDescription>
            </CardContent>
          </Card>
        )}
      </header>

      {(!error || !tasksError) && (
        <>
          <ProjectFormDialog
            key={project?.id}
            open={projectFormDialogState}
            onOpenChange={(open) => {
              setProjectFormDialogState(open);
            }}
            project={project}
            onSaved={handleProjectSaved}
          />

          <DeleteDialog
            project={deleteProject}
            onOpenChange={() => {
              setDeleteProject(null);
            }}
            onConfirm={handleConfirmDelete}
            deleting={deleting}
          />

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

          <Tabs value={currentView} onValueChange={handleViewChange}>
            <TabsList>
              <TabsTrigger value="kanban">
                <HugeiconsIcon icon={KanbanIcon} strokeWidth={2} />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list">
                <HugeiconsIcon icon={ListIcon} strokeWidth={2} />
                Lista
              </TabsTrigger>
            </TabsList>
            <TabsContent value="kanban"></TabsContent>
            <TabsContent value="list">
              <ProjectTasksList
                tasks={tasks}
                loading={loadingTasks}
                queryParams={tasksQueryParams}
                onEdit={handleEditTask}
                onDelete={handleTaskDeleted}
                onSaved={handleTaskSaved}
                onQueryChange={handleTasksQueryChange}
                onPageChange={handlePageChange}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </main>
  );
}
