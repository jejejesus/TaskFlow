// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ remove: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("@/actions/data-actions", () => ({
  deleteProjectAction: mocks.remove,
  saveProjectAction: vi.fn(),
}));
vi.mock("@/actions/auth-actions", () => ({ logoutAction: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/components/ui/toast", () => ({ toast: { add: vi.fn() } }));
import { ProjectHeader } from "./project-header";

const project = {
  id: "f711199a-567b-4567-9abc-0123456789ab",
  name: "Trabajo",
  description: null,
  color: "#123456",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("project deletion", () => {
  it("keeps the dialog open and does not navigate after a conflict", async () => {
    mocks.remove.mockResolvedValueOnce({ success: false, status: 409, error: "Proyecto en uso" });
    render(<ProjectHeader project={project} />);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar proyecto" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Proyecto en uso"));
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByText("¿Eliminar proyecto?")).toBeTruthy();
  });

  it("navigates to projects only after successful deletion", async () => {
    mocks.remove.mockResolvedValueOnce({ success: true, data: null });
    render(<ProjectHeader project={project} />);
    fireEvent.click(screen.getByRole("button", { name: "Eliminar proyecto" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/projects"));
  });
});
