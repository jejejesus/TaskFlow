---
kind: error_handling
name: Exception-based Error Handling with Controller-Level Catch Blocks
category: error_handling
scope:
    - '**'
source_files:
    - Services/Services.Api/Controllers/AuthController.cs
    - Services/Services.Api/Controllers/ProjectsController.cs
    - Services/Services.Api/Controllers/TasksController.cs
    - Services/Services.Application/Services/ProjectService.cs
    - Services/Services.Application/Services/TaskService.cs
    - Services/Services.Infrastructure/Identity/JwtTokenGenerator.cs
    - Services/Services.Api/Program.cs
    - Apps/Web/src/components/ui/toast.tsx
---

## Approach

The TaskFlow codebase uses a straightforward exception-driven error model across its ASP.NET Core API and Next.js frontend:

- **Backend (ASP.NET Core)**: Business-layer services throw standard .NET exceptions (`ValidationException`, `KeyNotFoundException`, `InvalidOperationException`, `ArgumentException`) which controllers catch and translate into HTTP responses. There is no global exception middleware, no custom exception types, and no centralized error DTO.
- **Frontend (Next.js)**: Errors are surfaced via React `toast` notifications from `react-hot-toast`; there is no centralized error boundary or retry logic.

## Key Files and Packages

- `Services/Services.Api/Controllers/AuthController.cs` — catches `ValidationException` → 400, `UnauthorizedAccessException` → 401.
- `Services/Services.Api/Controllers/ProjectsController.cs` — catches `KeyNotFoundException` → 404, `ValidationException` → 400, `InvalidOperationException` → 409 Conflict.
- `Services/Services.Api/Controllers/TasksController.cs` — same pattern: `KeyNotFoundException` → 404, `ValidationException` → 400.
- `Services/Services.Application/Services/ProjectService.cs` — throws `ValidationException` for invalid IDs, `KeyNotFoundException` when project not found, `InvalidOperationException` when deleting a project that has tasks.
- `Services/Services.Application/Services/TaskService.cs` — throws `ValidationException` for invalid priority/page/search parameters, `KeyNotFoundException` for missing projects/tasks, `ArgumentException` for required parameter validation.
- `Services/Services.Infrastructure/Identity/JwtTokenGenerator.cs` — throws `InvalidOperationException` when JWT secret key is too short.
- `Services/Services.Api/Program.cs` — registers authentication/authorization but defines no exception handler pipeline; no `UseExceptionHandler` call exists.
- `Apps/Web/src/components/ui/toast.tsx` — thin wrapper around `react-hot-toast` used by UI components to display errors.

## Architecture and Conventions

### Exception taxonomy

| Exception | Meaning | HTTP Response | Source |
|---|---|---:|---|
| `ValidationException` | Invalid input / business rule violation | 400 Bad Request | Services layer + controller catch blocks |
| `KeyNotFoundException` | Resource not found (project/task) | 404 Not Found | Repository lookup helpers in services |
| `InvalidOperationException` | State-incompatible operation (e.g. delete project with tasks, bad JWT key) | 409 Conflict (in delete) or unhandled | Service/business rules |
| `ArgumentException` | Missing required parameter | 400 Bad Request | `GetSummaryAsync` parameter checks |
| `UnauthorizedAccessException` | Wrong credentials | 401 Unauthorized | Auth flow |

### Controller-level translation pattern

Every mutating endpoint wraps the service call in a `try/catch` block and returns an anonymous object `{ error = ... }` as the response body. Read endpoints sometimes omit the try/catch when they only delegate to services that do not throw these exceptions. The shape of error responses is ad-hoc — each catch block constructs its own inline JSON object rather than using a shared error envelope.

### No global error middleware

`Program.cs` configures `UseHttpsRedirection`, `UseAuthentication`, `UseAuthorization`, and `MapControllers`, but does not call `app.UseExceptionHandler(...)`. Unhandled exceptions therefore fall through to ASP.NET Core's default developer exception page (in development) or produce a generic 500 response (in production). The `Middleware/` directory under `Services.Api` is empty.

### Frontend error presentation

The Next.js app uses `react-hot-toast` (via `components/ui/toast.tsx`) to show user-facing messages. Authentication actions in `src/actions/auth-actions.ts` surface failures through toast notifications. There are no React error boundaries or centralized error handlers in the client-side code visible in this snapshot.

## Conventions and Constraints

- Services throw domain-specific standard exceptions rather than returning `Result<T>` or nullable wrappers; callers (controllers) are responsible for translating them to HTTP status codes.
- Validation failures consistently use `System.ComponentModel.DataAnnotations.ValidationException` with Spanish-language messages (e.g. "El identificador del usuario no es válido.").
- Missing-resource cases consistently use `KeyNotFoundException` with Spanish messages (e.g. "El proyecto no existe.", "La tarea no existe.").
- Business-rule violations (e.g. deleting a project that still has tasks) use `InvalidOperationException` with descriptive Spanish messages.
- Controllers return error bodies as inline anonymous objects shaped like `{ error = "..." }` — there is no shared `ErrorResponse` type defined in the repository.
- The `Services/Application/Exceptions/` directory exists but is empty, indicating planned but not yet implemented custom exception types.
- No `panic`/`recover` equivalent exists (this is C#); `throw` is the sole propagation mechanism.
- Authorization failures are handled by ASP.NET Core's built-in `[Authorize]` attribute and `UnauthorizedAccessException`, not by custom middleware.