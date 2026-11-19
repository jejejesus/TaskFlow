---
kind: logging_system
name: Logging System — Minimal ASP.NET Core Logging, No Custom Logger
category: logging_system
scope:
    - '**'
source_files:
    - Services/Services.Api/Program.cs
    - Services/Services.Api/appsettings.json
---

## Overview

TaskFlow uses the built-in ASP.NET Core `ILogger` infrastructure with no third-party logging framework (Serilog, NLog, Winston, Pino, etc.) and no custom logger abstraction. The backend configures only default log levels; the frontend has no application-level logging.

## Backend (ASP.NET Core)

- **Framework**: Microsoft.Extensions.Logging (default ASP.NET Core logging).
- **Configuration file**: `Services/Services.Api/appsettings.json` sets:
  - `Logging:LogLevel:Default` = `Information`
  - `Logging:LogLevel:Microsoft.AspNetCore` = `Warning`
- **Startup wiring**: `Program.cs` calls `WebApplication.CreateBuilder(args)` and `builder.Services.AddControllers()` but performs no additional logging configuration — no `AddLogging`, no custom providers, no sinks, no structured-log enrichment.
- **Middleware directory** (`Services/Services.Api/Middleware/`) is empty; there is no request-logging middleware (e.g., Serilog.Sinks.Console, OpenTelemetry, or a custom `UseRequestLogging`).
- **Usage in code**: A grep across all `.cs` files for `ILogger`, `LoggerFactory`, `Serilog`, `NLog`, `log\.`, `Console.WriteLine`, `Debug.WriteLine` returned zero matches — meaning controllers, services, repositories, and identity components do not currently emit any log entries themselves.

## Frontend (Next.js / TypeScript)

- A grep across all `.ts`/`.tsx` files for `console.log`, `logger`, `winston`, `pino`, `bunyan` returned zero matches — the web app does not use any logging library and emits no application logs from its source.

## Conventions and Constraints

- **Observed convention**: Logging is entirely delegated to the ASP.NET Core host defaults — HTTP request/response diagnostics are handled by the framework's built-in logging at `Information` level, while framework warnings are suppressed to `Warning`.
- **Enforced rule**: There is no project dependency on any logging framework beyond what `Microsoft.AspNetCore.App` provides; adding a new sink or structured logger would require explicit changes to `Program.cs` and `appsettings.json` since none exist today.
- **Constraint**: Because no `ILogger` instances are injected anywhere in the codebase, there is no existing pattern to follow for adding application logs — any future logging will need to establish conventions from scratch.