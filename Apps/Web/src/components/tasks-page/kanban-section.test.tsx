// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { TaskCurrentStatus, TaskPriority, type TaskResponse } from "@/lib/api/tasks";

const mocks = vi.hoisted(() => ({ changeStatus: vi.fn(), toast: vi.fn(), logout: vi.fn() }));
vi.mock("@/actions/data-actions", () => ({ changeTaskStatusAction: mocks.changeStatus }));
vi.mock("@/actions/auth-actions", () => ({ logoutAction: mocks.logout }));
vi.mock("@/components/ui/toast", () => ({ toast: { add: mocks.toast } }));
import TasksKanbanBoard from "./kanban-section";

const task: TaskResponse = {
  id: "task-1",
  title: "Informe",
  description: "Preparar informe",
  status: TaskCurrentStatus.Todo,
  priority: TaskPriority.High,
  dueDate: null,
  projectId: "project-1",
  projectName: "Trabajo",
  projectColor: "#123456",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

function setup(tasks: TaskResponse[] = [task]) {
  const callbacks = { onEdit: vi.fn(), onSaved: vi.fn() };
  const view = render(<TasksKanbanBoard tasks={tasks} {...callbacks} />);
  return { ...callbacks, ...view };
}

function column(name: string) {
  return screen.getByRole("region", { name });
}

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("TasksKanbanBoard", () => {
  it("renders all empty columns and their counts", () => {
    setup([]);
    for (const name of ["Pendiente", "En progreso", "Completada"]) {
      const section = within(column(name));
      expect(section.getByText("No hay tareas en esta columna.")).toBeInTheDocument();
      expect(section.getByLabelText("0 tareas")).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Siguiente página" })).not.toBeInTheDocument();
  });

  it("renders each card in its status column with priority and project", () => {
    const progress = {
      ...task,
      id: "task-2",
      title: "Diseño",
      status: TaskCurrentStatus.InProgress,
      priority: TaskPriority.Urgent,
      projectName: null,
    };
    const done = {
      ...task,
      id: "task-3",
      title: "Entrega",
      status: TaskCurrentStatus.Done,
      priority: TaskPriority.Low,
    };
    setup([task, progress, done]);
    for (const [name, item, priority] of [
      ["Pendiente", task, "Alta"],
      ["En progreso", progress, "Urgente"],
      ["Completada", done, "Baja"],
    ] as const) {
      const section = within(column(name));
      expect(section.getByRole("heading", { name: item.title })).toBeInTheDocument();
      expect(section.getByText(priority)).toBeInTheDocument();
      expect(section.getByLabelText("1 tareas")).toBeInTheDocument();
      expect(
        section.getByRole("combobox", { name: `Cambiar estatus de ${item.title}` }),
      ).toHaveValue(String(item.status));
      if (item.projectName) expect(section.getByText(item.projectName)).toBeInTheDocument();
      else expect(section.queryByText("Trabajo")).not.toBeInTheDocument();
    }
    expect(within(column("Pendiente")).getByText("Preparar informe")).toBeInTheDocument();
  });

  it("moves a card only after a successful status change and calls onSaved", async () => {
    mocks.changeStatus.mockResolvedValueOnce({ success: true, data: null });
    const { onSaved } = setup();
    fireEvent.change(screen.getByRole("combobox", { name: "Cambiar estatus de Informe" }), {
      target: { value: String(TaskCurrentStatus.InProgress) },
    });
    expect(mocks.changeStatus).toHaveBeenCalledWith(task.id, TaskCurrentStatus.InProgress);
    await waitFor(() =>
      expect(
        within(column("En progreso")).getByRole("heading", { name: task.title }),
      ).toBeInTheDocument(),
    );
    expect(
      within(column("Pendiente")).queryByRole("heading", { name: task.title }),
    ).not.toBeInTheDocument();
    expect(within(column("Pendiente")).getByLabelText("0 tareas")).toBeInTheDocument();
    expect(within(column("En progreso")).getByLabelText("1 tareas")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Cambiar estatus de Informe" })).toHaveValue(
      String(TaskCurrentStatus.InProgress),
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it.each([
    { status: 500, error: "Error del servidor", expired: false },
    { status: 401, error: "No autorizado", expired: true },
  ])("keeps the card in place on a $status failure", async ({ status, error, expired }) => {
    mocks.changeStatus.mockResolvedValueOnce({ success: false, status, error });
    const { onSaved } = setup();
    fireEvent.change(screen.getByRole("combobox", { name: "Cambiar estatus de Informe" }), {
      target: { value: String(TaskCurrentStatus.Done) },
    });
    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "Error al cambiar el estatus",
        description: error,
        type: "error",
        priority: "high",
      }),
    );
    expect(
      within(column("Pendiente")).getByRole("heading", { name: task.title }),
    ).toBeInTheDocument();
    expect(
      within(column("Completada")).queryByRole("heading", { name: task.title }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Cambiar estatus de Informe" })).toHaveValue(
      String(TaskCurrentStatus.Todo),
    );
    expect(onSaved).not.toHaveBeenCalled();
    if (expired) {
      expect(screen.getByText(/tu sesión ha expirado/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
      expect(mocks.logout).toHaveBeenCalledTimes(1);
    } else {
      expect(screen.queryByText(/tu sesión ha expirado/i)).not.toBeInTheDocument();
    }
  });

  it("handles rejected requests without moving the card", async () => {
    mocks.changeStatus.mockRejectedValueOnce(new Error("network"));
    const { onSaved } = setup();
    fireEvent.change(screen.getByRole("combobox", { name: "Cambiar estatus de Informe" }), {
      target: { value: String(TaskCurrentStatus.Done) },
    });
    await waitFor(() =>
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "Error al cambiar el estatus",
        description: "No se pudo actualizar la tarea.",
        type: "error",
        priority: "high",
      }),
    );
    expect(
      within(column("Pendiente")).getByRole("heading", { name: task.title }),
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("passes the selected task to the edit callback", () => {
    const { onEdit } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Editar Informe" }));
    expect(onEdit).toHaveBeenCalledExactlyOnceWith(task);
  });

  it("disables all card controls and ignores repeated changes while saving", async () => {
    let resolve!: (value: { success: true; data: null }) => void;
    mocks.changeStatus.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const other = { ...task, id: "task-2", title: "Diseño" };
    const { onEdit, onSaved } = setup([task, other]);
    const selector = screen.getByRole("combobox", { name: "Cambiar estatus de Informe" });
    fireEvent.change(selector, { target: { value: String(TaskCurrentStatus.InProgress) } });
    expect(selector).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Cambiar estatus de Diseño" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Editar Diseño" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Arrastrar Informe" })).toBeDisabled();
    expect(
      within(column("Pendiente")).getByRole("heading", { name: task.title }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Cambiar estatus de Diseño" }), {
      target: { value: String(TaskCurrentStatus.Done) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Editar Diseño" }));
    expect(mocks.changeStatus).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
    await act(async () => resolve({ success: true, data: null }));
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("combobox", { name: "Cambiar estatus de Diseño" })).toBeEnabled();
    expect(
      within(column("En progreso")).getByRole("heading", { name: task.title }),
    ).toBeInTheDocument();
  });

  it("shows all tasks without search or pagination controls", () => {
    const tasks = Array.from({ length: 12 }, (_, index) => ({
      ...task,
      id: `task-${index}`,
      title: `Tarea ${index}`,
    }));
    setup(tasks);
    expect(within(column("Pendiente")).getByLabelText("12 tareas")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tarea 11" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Buscar...")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Buscar" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /pagination|paginación/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /next page|previous page/i }),
    ).not.toBeInTheDocument();
  });

  it("updates displayed cards when new tasks arrive", () => {
    const { rerender, onEdit, onSaved } = setup();
    const next = { ...task, id: "task-2", title: "Nueva tarea", status: TaskCurrentStatus.Done };
    rerender(<TasksKanbanBoard tasks={[next]} onEdit={onEdit} onSaved={onSaved} />);
    expect(screen.queryByRole("heading", { name: "Informe" })).not.toBeInTheDocument();
    expect(
      within(column("Completada")).getByRole("heading", { name: "Nueva tarea" }),
    ).toBeInTheDocument();
  });
});
