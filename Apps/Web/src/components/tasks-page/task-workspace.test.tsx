// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TaskCurrentStatus, TaskPriority } from "@/lib/api/tasks";

const mocks = vi.hoisted(() => ({ remove: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
const router = { replace: mocks.replace, refresh: mocks.refresh };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/my-tasks",
  useSearchParams: () => new URLSearchParams("view=list&page=2"),
}));
vi.mock("@/actions/data-actions", () => ({
  saveTaskAction: vi.fn(),
  deleteTaskAction: mocks.remove,
}));
vi.mock("@/actions/auth-actions", () => ({ logoutAction: vi.fn() }));
vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));
import TaskWorkspace from "./task-workspace";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("preserves a sort change while a search is waiting to debounce", async () => {
  render(
    <TaskWorkspace
      view="list"
      query={{ Page: 2, SortDirection: "asc" }}
      tasks={{ items: [], page: 2, pageSize: 10, totalCount: 11, totalPages: 2 }}
    />,
  );
  fireEvent.change(screen.getByPlaceholderText("Buscar..."), { target: { value: "informe" } });
  fireEvent.click(screen.getByRole("button", { name: "Orden ascendente" }));
  await waitFor(
    () =>
      expect(mocks.replace).toHaveBeenCalledWith(
        "/my-tasks?view=list&page=1&sortDirection=desc&search=informe",
        { scroll: false },
      ),
    { timeout: 1500 },
  );
});

it("returns to the previous page after deleting its last task", async () => {
  mocks.remove.mockResolvedValueOnce({ success: true, data: null });
  const task = {
    id: "f711199a-567b-4567-9abc-0123456789ab",
    title: "Última tarea",
    description: null,
    status: TaskCurrentStatus.Todo,
    priority: TaskPriority.Low,
    dueDate: null,
    projectId: null,
    projectName: null,
    projectColor: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
  render(
    <TaskWorkspace
      view="list"
      query={{ Page: 2 }}
      tasks={{ items: [task], page: 2, pageSize: 10, totalCount: 11, totalPages: 2 }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Acciones de Última tarea" }));
  fireEvent.click(await screen.findByText("Eliminar"));
  fireEvent.click(await screen.findByRole("button", { name: "Eliminar" }));
  await waitFor(() =>
    expect(mocks.replace).toHaveBeenCalledWith("/my-tasks?view=list&page=1", { scroll: false }),
  );
});
