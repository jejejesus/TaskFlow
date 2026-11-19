import {
  TaskAllowedSortFields,
  TaskCurrentStatus,
  TaskPriority,
  type GetTasksQuery,
} from "@/lib/api/tasks";

export type RouteSearchParams = Record<string, string | string[] | undefined>;
export type ViewMode = "kanban" | "list";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function integer(value: string | undefined, fallback: number, max: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : fallback;
}

export function parseTaskRoute(params: RouteSearchParams): {
  view: ViewMode;
  query: GetTasksQuery;
} {
  const status = integer(first(params.status), 0, 3);
  const priority = integer(first(params.priority), 0, 4);
  const sortBy = first(params.sortBy);
  const sortDirection = first(params.sortDirection);
  const validSort = Object.values(TaskAllowedSortFields).includes(sortBy as TaskAllowedSortFields);

  return {
    view: first(params.view) === "list" ? "list" : "kanban",
    query: {
      Page: integer(first(params.page), 1, 2_000_000),
      PageSize: integer(first(params.pageSize), 10, 100),
      Status: status ? (status as TaskCurrentStatus) : undefined,
      Priority: priority ? (priority as TaskPriority) : undefined,
      Search: first(params.search)?.trim().slice(0, 200) || undefined,
      SortBy: validSort ? (sortBy as TaskAllowedSortFields) : TaskAllowedSortFields.CreatedAt,
      SortDirection: sortDirection === "desc" ? "desc" : "asc",
    },
  };
}

const queryKeys: Record<keyof GetTasksQuery, string> = {
  Page: "page",
  PageSize: "pageSize",
  Status: "status",
  Priority: "priority",
  Search: "search",
  SortBy: "sortBy",
  SortDirection: "sortDirection",
};

export function updateTaskSearchParams(
  current: URLSearchParams,
  updates: Partial<GetTasksQuery>,
): URLSearchParams {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(updates) as [
    keyof GetTasksQuery,
    string | number | undefined,
  ][]) {
    if (value === undefined || value === "") params.delete(queryKeys[key]);
    else params.set(queryKeys[key], String(value));
  }
  return params;
}
