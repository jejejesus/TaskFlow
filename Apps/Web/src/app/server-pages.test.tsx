import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToReadableStream } from "react-dom/server";
import { TaskCurrentStatus } from "@/lib/api/tasks";
import { ApiError } from "@/lib/api/helper";

vi.mock("server-only", () => ({}));
vi.mock("@/actions/auth-actions", () => ({ logoutAction: vi.fn() }));
const mocks = vi.hoisted(() => ({
  tasks: vi.fn(),
  projectTasks: vi.fn(),
  projects: vi.fn(),
  project: vi.fn(),
  notFound: vi.fn(),
}));
vi.mock("@/lib/api/server", () => ({
  serverTasks: { list: mocks.tasks, forProject: mocks.projectTasks },
  serverProjects: { list: mocks.projects, get: mocks.project },
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/components/tasks-page/task-workspace", () => ({
  default: ({
    tasks,
    error,
  }: {
    tasks: { items: { title: string }[] } | null;
    error?: { message: string } | null;
  }) => (
    <div>
      {tasks?.items.map((item) => (
        <p key={item.title}>{item.title}</p>
      ))}
      {error?.message}
    </div>
  ),
}));
vi.mock("@/components/project-details-page/project-header", () => ({
  ProjectHeader: ({ project }: { project: { name: string } }) => <h2>{project.name}</h2>,
}));
import Dashboard from "./(protected)/page";
import TasksPage from "./(protected)/my-tasks/page";
import ProjectPage from "./(protected)/projects/[projectSlug]/page";

const page = {
  items: [{ title: "Tarea del servidor", id: "1", status: 1, dueDate: null }],
  page: 1,
  pageSize: 10,
  totalCount: 7,
  totalPages: 1,
};
async function html(element: React.ReactElement) {
  const stream = await renderToReadableStream(element);
  await stream.allReady;
  return new Response(stream).text();
}
beforeEach(() => {
  vi.clearAllMocks();
});

describe("server-rendered routes", () => {
  it("renders dashboard data from four parallel requests", async () => {
    mocks.tasks.mockImplementation(async (query) => ({
      ...page,
      totalCount:
        query.Status === TaskCurrentStatus.Done
          ? 2
          : query.Status === TaskCurrentStatus.Todo
            ? 3
            : 7,
    }));
    mocks.projects.mockResolvedValue([]);
    const markup = await html(<Dashboard />);
    expect(markup).toContain("Tarea del servidor");
    expect(markup).toContain("7");
    expect(mocks.tasks).toHaveBeenCalledTimes(3);
    expect(mocks.projects).toHaveBeenCalledTimes(1);
  });

  it("loads tasks only in list mode and passes validated filters", async () => {
    mocks.tasks.mockResolvedValue(page);
    const list = await html(
      <TasksPage searchParams={Promise.resolve({ view: "list", page: "2", status: "3" })} />,
    );
    expect(list).toContain("Tarea del servidor");
    expect(mocks.tasks).toHaveBeenCalledWith(expect.objectContaining({ Page: 2, Status: 3 }));
    mocks.tasks.mockClear();
    await html(<TasksPage searchParams={Promise.resolve({ view: "kanban" })} />);
    expect(mocks.tasks).not.toHaveBeenCalled();
  });

  it("starts project and task requests together and keeps project visible on task failure", async () => {
    let resolveProject!: (value: object) => void;
    mocks.project.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveProject = resolve;
        }),
    );
    mocks.projectTasks.mockRejectedValue(new ApiError(409, "Error de tareas"));
    const streamPromise = renderToReadableStream(
      <ProjectPage
        params={Promise.resolve({ projectSlug: "abc" })}
        searchParams={Promise.resolve({ view: "list" })}
      />,
    );
    await vi.waitFor(() => expect(mocks.projectTasks).toHaveBeenCalled());
    resolveProject({ id: "abc", name: "Proyecto visible" });
    const stream = await streamPromise;
    await stream.allReady;
    const markup = await new Response(stream).text();
    expect(markup).toContain("Proyecto visible");
    expect(markup).toContain("Error de tareas");
  });
});
