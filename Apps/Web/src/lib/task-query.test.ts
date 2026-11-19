import { describe, expect, it } from "vitest";
import { parseTaskRoute, updateTaskSearchParams } from "./task-query";
import {
  buildTaskQuery,
  TaskAllowedSortFields,
  TaskCurrentStatus,
  TaskPriority,
} from "./api/tasks";

describe("task route parameters", () => {
  it("uses the existing defaults and rejects invalid values", () => {
    const { view, query } = parseTaskRoute({
      view: "board",
      page: "-3",
      pageSize: "101",
      status: "4",
      priority: "0",
      sortBy: "hack",
      sortDirection: "up",
    });
    expect(view).toBe("kanban");
    expect(query).toMatchObject({
      Page: 1,
      PageSize: 10,
      Status: undefined,
      Priority: undefined,
      SortBy: TaskAllowedSortFields.CreatedAt,
      SortDirection: "asc",
    });
  });

  it("parses filters, bounded search and pagination", () => {
    const result = parseTaskRoute({
      view: "list",
      page: "2",
      pageSize: "25",
      status: "3",
      priority: "4",
      search: `  ${"x".repeat(210)}  `,
      sortBy: "duedate",
      sortDirection: "desc",
    });
    expect(result.view).toBe("list");
    expect(result.query).toMatchObject({
      Page: 2,
      PageSize: 25,
      Status: TaskCurrentStatus.Done,
      Priority: TaskPriority.Urgent,
      Search: "x".repeat(200),
      SortBy: TaskAllowedSortFields.DueDate,
      SortDirection: "desc",
    });
  });

  it("updates filters without losing unrelated URL state", () => {
    const params = updateTaskSearchParams(new URLSearchParams("view=list&page=4&status=1"), {
      Search: "a b",
      Page: 1,
      Status: undefined,
    });
    expect(params.toString()).toBe("view=list&page=1&search=a+b");
    expect(buildTaskQuery({ Page: 1, Search: "a b", SortDirection: "asc" })).toBe(
      "?Page=1&Search=a+b&SortDirection=asc",
    );
  });
});
