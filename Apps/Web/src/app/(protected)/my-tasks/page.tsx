"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/helper";
import {
  tasksApi,
  type TaskResponse,
} from "@/lib/api/tasks";
import SearchFilter from "@/components/tasks-page/search-filter";
import { statusLabels, priorityLabels, taskSortFieldLabels, } from "@/lib/util-constants/tasks-constants";
import TasksTable from "@/components/tasks-page/table-section";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import TaskForm from "@/components/tasks-page/task-form";

export default function Page() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    tasksApi
      .list({ Page: 1, PageSize: 20 })
      .then((response) => {
        if (!cancelled) setTasks(response.items);
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
  }, []);

  return (
    <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header className="flex justify-between">
        <div className="w-full">
          <h1 className="text-2xl font-semibold tracking-tight">Mis tareas</h1>
          <p className="text-muted-foreground">
            Gestiona tus tareas y mantén el enfoque en lo importante.
          </p>
        </div>

        <Dialog>
          <DialogTrigger render={
            <Button><HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
            />Crear tarea</Button>} />
          <TaskForm />
        </Dialog>
      </header>

      <SearchFilter
        statusLabels={statusLabels}
        priorityLabels={priorityLabels}
        orderByLabels={taskSortFieldLabels}
      />

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <TasksTable tasks={tasks} loading={loading} />
    </main>
  );
}

