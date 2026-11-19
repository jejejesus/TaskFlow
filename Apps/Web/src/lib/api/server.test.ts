import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, parseApiResponse } from "./helper";

const cookieMock = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: cookieMock }));
import { serverApiFetch } from "./server";
import { fetchServerApi } from "./fetch-server";

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "http://localhost:4321/api");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("API errors", () => {
  it("preserves API error and problem detail messages", async () => {
    await expect(
      parseApiResponse(
        new Response(JSON.stringify({ error: "Proyecto en uso" }), {
          status: 409,
          headers: { "content-type": "application/json" },
        }),
      ),
    ).rejects.toMatchObject({ status: 409, message: "Proyecto en uso" });
    await expect(
      parseApiResponse(
        new Response(JSON.stringify({ detail: "No encontrado" }), {
          status: 404,
          headers: { "content-type": "application/problem+json" },
        }),
      ),
    ).rejects.toMatchObject({ status: 404, message: "No encontrado" });
    await expect(parseApiResponse(new Response(null, { status: 204 }))).resolves.toBeUndefined();
  });
});

describe("development TLS", () => {
  it("limits the self-signed certificate exception to loopback in development", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NODE_ENV", "development");
    await fetchServerApi("https://localhost:7120/api/tasks");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      redirect: "manual",
      dispatcher: expect.anything(),
    });
    await fetchServerApi("https://example.com/api/tasks");
    expect(fetchMock.mock.calls[1][1]).not.toHaveProperty("dispatcher");
    vi.stubEnv("NODE_ENV", "production");
    await fetchServerApi("https://localhost:7120/api/tasks");
    expect(fetchMock.mock.calls[2][1]).not.toHaveProperty("dispatcher");
  });
});

describe("authenticated server transport", () => {
  it("isolates tokens and disables caching for simultaneous requests", async () => {
    cookieMock
      .mockResolvedValueOnce({ get: () => ({ value: "user-one" }) })
      .mockResolvedValueOnce({ get: () => ({ value: "user-two" }) });
    const fetchMock = vi
      .fn()
      .mockImplementation(
        async (_url, init: RequestInit) =>
          new Response(
            JSON.stringify({ authorization: new Headers(init.headers).get("Authorization") }),
            { headers: { "content-type": "application/json" } },
          ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const [one, two] = await Promise.all([
      serverApiFetch<{ authorization: string }>("/tasks"),
      serverApiFetch<{ authorization: string }>("/projects"),
    ]);
    expect(one.authorization).toBe("Bearer user-one");
    expect(two.authorization).toBe("Bearer user-two");
    expect(fetchMock.mock.calls.every((call) => call[1].cache === "no-store")).toBe(true);
  });

  it("fails without a cookie, preserves 401 and distinguishes network errors", async () => {
    cookieMock.mockResolvedValueOnce({ get: () => undefined });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(serverApiFetch("/tasks")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
    cookieMock.mockResolvedValue({ get: () => ({ value: "expired" }) });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(serverApiFetch("/tasks")).rejects.toMatchObject({ status: 401 });
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(serverApiFetch("/tasks")).rejects.toEqual(
      new ApiError(0, "No se pudo conectar con el servidor."),
    );
  });
});
