import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";

const enabled = process.env.TASKFLOW_PRODUCTION_TEST === "1";
const calls: { path: string; token: string }[] = [];
let api: Server;
let next: ChildProcess;
let baseUrl: string;

function listen(server: Server): Promise<number> {
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve((server.address() as { port: number }).port)),
  );
}

async function freePort() {
  const probe = createServer();
  const port = await listen(probe);
  await new Promise<void>((resolve, reject) =>
    probe.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

describe.skipIf(!enabled)("production HTTP rendering", () => {
  beforeAll(async () => {
    api = createServer((req, res) => {
      const url = new URL(req.url ?? "/", "http://localhost");
      const token = req.headers.authorization?.replace(/^Bearer /, "") ?? "";
      calls.push({ path: `${url.pathname}${url.search}`, token });
      if (!["one-secret", "two-secret"].includes(token)) {
        res.writeHead(401).end();
        return;
      }
      const name = token === "one-secret" ? "Alfa" : "Beta";
      const project = {
        id: "f711199a-567b-4567-9abc-0123456789ab",
        name: `Proyecto ${name}`,
        description: null,
        color: "#123456",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      };
      const task = {
        id: "f711199a-567b-4567-9abc-0123456789ab",
        title: `Tarea ${name}`,
        description: null,
        status: 1,
        priority: 1,
        dueDate: null,
        projectId: project.id,
        projectName: project.name,
        projectColor: project.color,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
      res.setHeader("content-type", "application/json");
      if (url.pathname === "/api/projects") {
        res.end(JSON.stringify([project]));
        return;
      }
      if (url.pathname === `/api/projects/${project.id}`) {
        res.end(JSON.stringify(project));
        return;
      }
      if (url.pathname === "/api/tasks" || url.pathname === `/api/projects/${project.id}/tasks`) {
        const page = Number(url.searchParams.get("Page") ?? 1);
        res.end(
          JSON.stringify({ items: [task], page, pageSize: 10, totalCount: 11, totalPages: 2 }),
        );
        return;
      }
      res.writeHead(404).end(JSON.stringify({ error: "No encontrado" }));
    });
    const apiPort = await listen(api);
    const port = await freePort();
    baseUrl = `http://127.0.0.1:${port}`;
    const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");
    next = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "production",
        API_BASE_URL: `http://127.0.0.1:${apiPort}/api`,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: "ignore",
    });
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        await fetch(`${baseUrl}/login`);
        ready = true;
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    if (!ready) throw new Error("Production server did not start");
  }, 20000);

  afterAll(async () => {
    next?.kill();
    if (api) await new Promise<void>((resolve) => api.close(() => resolve()));
  });

  it("renders isolated dashboard data with exactly four API calls per user", async () => {
    calls.length = 0;
    const one = await fetch(baseUrl, { headers: { cookie: "auth_token=one-secret" } }).then((res) =>
      res.text(),
    );
    expect(one).toContain("Tarea Alfa");
    expect(one).toContain("Proyecto Alfa");
    expect(one).not.toContain("Tarea Beta");
    expect(calls).toHaveLength(4);
    expect(calls.every((call) => call.token === "one-secret")).toBe(true);
    calls.length = 0;
    const two = await fetch(baseUrl, { headers: { cookie: "auth_token=two-secret" } }).then((res) =>
      res.text(),
    );
    expect(two).toContain("Tarea Beta");
    expect(two).not.toContain("Tarea Alfa");
    expect(calls).toHaveLength(4);
    expect(calls.every((call) => call.token === "two-secret")).toBe(true);
  });

  it("handles missing and expired sessions without a login redirect loop", async () => {
    const missing = await fetch(baseUrl, { redirect: "manual" });
    expect(missing.status).toBe(307);
    expect(missing.headers.get("location")).toContain("/login");
    const expired = await fetch(baseUrl, {
      headers: { cookie: "auth_token=expired" },
      redirect: "manual",
    });
    expect(expired.status).toBe(200);
    expect(await expired.text()).toContain("Tu sesión ha expirado");
  });

  it("renders project details and displays the not-found UI for a missing project", async () => {
    calls.length = 0;
    const project = await fetch(
      `${baseUrl}/projects/f711199a-567b-4567-9abc-0123456789ab?view=list`,
      {
        headers: { cookie: "auth_token=one-secret" },
      },
    ).then((res) => res.text());
    expect(project).toContain("Proyecto Alfa");
    expect(project).toContain("Tarea Alfa");
    expect(calls).toHaveLength(2);
    const missing = await fetch(`${baseUrl}/projects/f711199a-567b-4567-9abc-0123456789ac`, {
      headers: { cookie: "auth_token=one-secret" },
    }).then((res) => res.text());
    expect(missing).toContain("404");
  });

  it("renders list filters on the server and skips task requests for Kanban", async () => {
    calls.length = 0;
    const list = await fetch(`${baseUrl}/my-tasks?view=list&page=2&status=3`, {
      headers: { cookie: "auth_token=one-secret" },
    }).then((res) => res.text());
    expect(list).toContain("Tarea Alfa");
    expect(calls).toHaveLength(1);
    expect(calls[0].path).toContain("Page=2");
    expect(calls[0].path).toContain("Status=3");
    calls.length = 0;
    await fetch(`${baseUrl}/my-tasks?view=kanban`, {
      headers: { cookie: "auth_token=one-secret" },
    }).then((res) => res.text());
    expect(calls).toHaveLength(0);
  });
});
