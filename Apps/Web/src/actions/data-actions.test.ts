import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/helper";
import { TaskPriority } from "@/lib/api/tasks";

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/api/server", () => ({ serverApiFetch: mocks.fetch }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import {
  deleteProjectAction,
  deleteTaskAction,
  saveProjectAction,
  saveTaskAction,
} from "./data-actions";

const id = "f711199a-567b-4567-9abc-0123456789ab";
const task = {
  title: "  Nueva tarea  ",
  description: null,
  priority: TaskPriority.Low,
  dueDate: null,
  projectId: id,
};

beforeEach(() => {
  mocks.fetch.mockReset();
  mocks.revalidate.mockReset();
});

describe("mutation actions", () => {
  it("validates inputs before calling the authenticated API", async () => {
    expect(await saveTaskAction(null, { ...task, title: " " })).toMatchObject({ success: false });
    expect(await deleteProjectAction("bad-id")).toMatchObject({ success: false });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("saves tasks with their project and revalidates all affected paths", async () => {
    mocks.fetch.mockResolvedValue({ id, title: "Nueva tarea" });
    expect(await saveTaskAction(null, task)).toMatchObject({ success: true });
    expect(mocks.fetch).toHaveBeenCalledWith(
      "/tasks",
      expect.objectContaining({ method: "POST", body: expect.stringContaining(id) }),
    );
    expect(mocks.revalidate.mock.calls.map(([path]) => path)).toEqual([
      "/",
      "/my-tasks",
      "/projects",
      "/projects/[projectSlug]",
    ]);
  });

  it("returns authorization and conflict errors without invalidating", async () => {
    mocks.fetch.mockRejectedValueOnce(new ApiError(401, "Sesión expirada"));
    expect(await deleteTaskAction(id)).toMatchObject({
      success: false,
      status: 401,
      error: "Sesión expirada",
    });
    mocks.fetch.mockRejectedValueOnce(new ApiError(409, "Proyecto en uso"));
    expect(await deleteProjectAction(id)).toMatchObject({
      success: false,
      status: 409,
      error: "Proyecto en uso",
    });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("does not report a successful write as failed if invalidation fails", async () => {
    mocks.fetch.mockResolvedValue({ id, name: "Proyecto" });
    mocks.revalidate.mockImplementation(() => {
      throw new Error("revalidation unavailable");
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await saveProjectAction(id, { name: "Proyecto", color: "#123456" })).toMatchObject({
      success: true,
    });
    log.mockRestore();
  });
});
