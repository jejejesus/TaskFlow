// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TaskCurrentStatus, TaskPriority } from "@/lib/api/tasks";

const actions = vi.hoisted(() => ({ save: vi.fn(), remove: vi.fn() }));
vi.mock("@/actions/data-actions", () => ({
  saveTaskAction: actions.save,
  deleteTaskAction: actions.remove,
}));
vi.mock("@/actions/auth-actions", () => ({ logoutAction: vi.fn() }));
vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));
import TaskFormDialog from "./task-form";
import TasksList, { TaskQuery } from "./list-section";

const task = {
  id: "f711199a-567b-4567-9abc-0123456789ab",
  title: "Informe",
  description: null,
  status: TaskCurrentStatus.Todo,
  priority: TaskPriority.Low,
  dueDate: "2026-05-01T12:00:00.000Z",
  projectId: "f711199a-567b-4567-9abc-0123456789ab",
  projectName: "Trabajo",
  projectColor: "#123456",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("shared task controls", () => {
  it("preserves an existing assignment and ISO date when editing", async () => {
    actions.save.mockResolvedValueOnce({ success: true, data: task });
    const onOpenChange = vi.fn();
    render(<TaskFormDialog open onOpenChange={onOpenChange} task={task} />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(actions.save).toHaveBeenCalledWith(
      task.id,
      expect.objectContaining({ projectId: task.projectId, dueDate: task.dueDate }),
    );
  });

  it("duplicates the task with its project and date", async () => {
    actions.save.mockResolvedValueOnce({ success: true, data: task });
    const onSaved = vi.fn();
    render(
      <TasksList
        tasks={{ items: [task], page: 1, pageSize: 10, totalCount: 1, totalPages: 1 }}
        queryParams={{}}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSaved={onSaved}
        onQueryChange={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Acciones de Informe" }));
    fireEvent.click(await screen.findByText("Duplicar"));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(actions.save).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        title: "Informe - Copia",
        projectId: task.projectId,
        dueDate: task.dueDate,
      }),
    );
  });

  it("debounces search and resets pagination", () => {
    vi.useFakeTimers();
    const change = vi.fn();
    render(<TaskQuery queryParams={{ Page: 3 }} onQueryChange={change} />);
    fireEvent.change(screen.getByPlaceholderText("Buscar..."), { target: { value: "informe" } });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(change).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(change).toHaveBeenCalledWith({ Search: "informe", Page: 1 });
  });

  it("keeps the task dialog open on failure and preserves the default project", async () => {
    actions.save.mockResolvedValueOnce({ success: false, error: "No autorizado", status: 401 });
    const onOpenChange = vi.fn();
    render(
      <TaskFormDialog
        open
        onOpenChange={onOpenChange}
        defaultProjectId="f711199a-567b-4567-9abc-0123456789ab"
      />,
    );
    fireEvent.change(screen.getByLabelText(/Título/), { target: { value: "Informe" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("No autorizado"));
    expect(screen.getByText(/sesión ha expirado/i)).toBeTruthy();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(actions.save).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        title: "Informe",
        projectId: "f711199a-567b-4567-9abc-0123456789ab",
        priority: TaskPriority.Low,
      }),
    );
  });
});
