import { KanbanIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export default function Page() {
  return (
    <main className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header className="flex justify-between">
        <div className="w-full">
          <h1 className="flex gap-2 text-2xl align-middle font-semibold tracking-tight">
            <HugeiconsIcon icon={KanbanIcon} strokeWidth={2} size={30} />
            Tablero Kanban
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus tareas y mantén el enfoque en lo importante.
          </p>
        </div>
      </header>
    </main>
  );
}
