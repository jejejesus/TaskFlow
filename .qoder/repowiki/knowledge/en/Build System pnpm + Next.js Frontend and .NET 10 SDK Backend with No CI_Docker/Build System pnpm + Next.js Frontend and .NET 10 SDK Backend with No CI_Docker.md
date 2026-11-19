---
kind: build_system
name: 'Build System: pnpm + Next.js Frontend and .NET 10 SDK Backend with No CI/Docker'
category: build_system
scope:
    - '**'
source_files:
    - Apps/Web/package.json
    - Apps/Web/next.config.ts
    - Apps/Web/tsconfig.json
    - Services/Services.slnx
    - Services/Services.Api/Services.Api.csproj
---

# Build System

## Overview

TaskFlow is a two-part application with no shared build orchestration, no CI pipeline, and no containerization:

- **Frontend** (`Apps/Web`): Next.js 16 / React 19 app built via `pnpm`.
- **Backend** (`Services`): ASP.NET Core 10 REST API split into four .NET projects (Api, Application, Domain, Infrastructure) managed by an MSBuild solution file (`Services.slnx`).

There is no Makefile, no `build.sh`, no `Dockerfile`, no `docker-compose.yml`, and no GitHub Actions or other CI configuration in the repository. The only CI-related artifact is a `.gitignore` line referencing `docker-compose.override.yml` (which does not exist), indicating Docker compose was considered but never materialized.

## Frontend Build (Apps/Web)

The frontend uses `pnpm` as its package manager (enforced by `packageManager: "pnpm@12.21.0"` in `package.json`) and exposes these npm scripts:

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve production output |
| `lint` | `oxlint` | Linting |
| `lint:fix` | `oxlint --fix` | Auto-fix lint issues |
| `fmt` | `oxfmt` | Formatting |
| `fmt:check` | `oxfmt --check` | Check formatting without fixing |

Next.js is configured for Turbopack (`next.config.ts` enables `turbopack.rules` with `@tailwindcss/turbopack` loader for `*.css`) and enables `cacheComponents` and `partialPrefetching`. TypeScript compilation is handled by `tsconfig.json` and `next-env.d.ts`.

## Backend Build (Services)

The backend is built with the .NET SDK targeting `net10.0` (see `Services.Api/Services.Api.csproj`). The solution file `Services/Services.slnx` declares four projects under a virtual `/src/` folder:

- `Services.Api` — Web entry point; references Application and Infrastructure.
- `Services.Application` — Use cases / DTOs / interfaces.
- `Services.Domain` — Entities, enums, value objects.
- `Services.Infrastructure` — EF Core persistence, Identity/JWT, repositories.

Project reference direction is Api → Application → Domain and Api → Infrastructure → Domain, forming a layered dependency graph. Package versions (e.g. `Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.12, `Scalar.AspNetCore` 2.18.0, `Microsoft.EntityFrameworkCore.Design` 10.0.12) are pinned directly in each `.csproj` rather than centralized in a `Directory.Packages.props` file.

EF Core migrations live under `Services.Infrastructure/Persistence/Migrations/` and are applied through the standard `dotnet ef` toolchain (design-time package `Microsoft.EntityFrameworkCore.Design` is referenced with `PrivateAssets=all`).

## Conventions Observed

- Frontend dependencies are managed exclusively by `pnpm` at `Apps/Web/package.json`; there is no monorepo workspace root at the repository top level — `Apps/Web/pnpm-workspace.yaml` exists but the repo has no sibling packages.
- Backend project files use the SDK-style `<Project Sdk="Microsoft.NET.Sdk.Web">` format with Nullable and ImplicitUsings enabled globally in `Services.Api/Services.Api.csproj`.
- There is no cross-compilation configuration, no multi-targeting, and no platform-specific build flags beyond the default .NET SDK behavior.
- No release automation exists: there are no version bump scripts, changelog generators, tag-based releases, or artifact publishing steps in this repository.
- No container image is defined; despite the `.gitignore` mentioning `docker-compose.override.yml`, no Docker Compose files are present.
- No CI workflow files exist under `.github/workflows/` (the directory is absent).

## Constraints Enforced by Tooling

- The frontend requires `pnpm@12.21.0` because `package.json` pins the `packageManager` field (enforced by pnpm's integrity check).
- The backend requires the .NET 10 SDK because `TargetFramework=net10.0` is declared in the Api project.
- The frontend build enforces formatting via `oxfmt --check` (used as `fmt:check` script) and linting via `oxlint`.
- EF Core migration scaffolding and design-time operations require the `Microsoft.EntityFrameworkCore.Design` package, which is included only for build/design-time assets.