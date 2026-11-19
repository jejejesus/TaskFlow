export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export class ApiError extends Error {
  status: number;
  details?: ProblemDetails;
  constructor(status: number, message: string, details?: ProblemDetails) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface ProblemDetails {
  error?: string | null;
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor.");
  }
  return parseApiResponse<T>(res);
}

export async function parseApiResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json") || contentType.includes("+json");

  if (!res.ok) {
    let details: ProblemDetails | undefined;
    if (isJson) {
      try {
        details = (await res.json()) as ProblemDetails;
      } catch {
        // The API may return an empty or malformed error response.
      }
    }
    throw new ApiError(
      res.status,
      details?.error ?? details?.detail ?? details?.title ?? `Error de servidor (${res.status}).`,
      details,
    );
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") return undefined as T;
  return (isJson ? await res.json() : undefined) as T;
}
