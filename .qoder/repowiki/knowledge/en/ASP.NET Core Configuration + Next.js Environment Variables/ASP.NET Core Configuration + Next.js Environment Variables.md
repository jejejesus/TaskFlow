---
kind: configuration_system
name: ASP.NET Core Configuration + Next.js Environment Variables
category: configuration_system
scope:
    - '**'
source_files:
    - Services/Services.Api/appsettings.json
    - Services/Services.Api/appsettings.Development.json
    - Services/Services.Api/appsettings.Example.json
    - Services/Services.Api/appsettings.Example.Development.json
    - Services/Services.Api/Program.cs
    - Services/Services.Infrastructure/DependencyInjection.cs
    - Services/Services.Infrastructure/Identity/JwtOptions.cs
    - Apps/Web/.env
    - Apps/Web/next.config.ts
---

# Configuration System

## Approach

The repository uses two separate configuration mechanisms, one per runtime:

- **Backend (ASP.NET Core)**: standard `Microsoft.Extensions.Configuration` pipeline loading JSON `appsettings*.json` files plus environment variables, with strongly-typed options via `IConfiguration.GetSection<T>()` and `services.Configure<T>()`.
- **Frontend (Next.js)**: a single `.env` file consumed at build/runtime by the Next.js app to supply the API base URL.

There is no shared configuration store, no YAML/TOML/feature-flag system, and no secrets manager integration beyond plain-text values in config files.

## Backend Configuration Files

| File | Purpose |
|---|---|
| `Services/Services.Api/appsettings.json` | Baseline config — only `Logging` and `AllowedHosts`. |
| `Services/Services.Api/appsettings.Development.json` | Development overrides — includes `ConnectionStrings:DefaultConnection` and `Jwt` section. |
| `Services/Services.Api/appsettings.Example.json` | Template for production/staging — contains placeholder `<HOST>` / `<PASSWORD>` values. |
| `Services/Services.Api/appsettings.Example.Development.json` | Example development override (only logging). |

The ASP.NET Core default configuration sources are used; no custom `IConfigurationBuilder` is constructed in `Program.cs`, so the standard precedence applies (`appsettings.json` → `appsettings.{Environment}.json` → environment variables).

## Strongly-Typed Options

`Services.Infrastructure/Identity/JwtOptions.cs` defines the typed options class:

```csharp
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public string SecretKey { get; init; } = string.Empty;
    public int ExpirationMinutes { get; init; } = 10080;
}
```

It is bound from the `Jwt` configuration section in `Services.Infrastructure.DependencyInjection.AddInfrastructure`:

```csharp
var jwt = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("No se encontró la configuración JWT.");
```

and also registered via `services.Configure<JwtOptions>(...)` for consumers that prefer `IOptions<JwtOptions>`.

## Validation & Fail-Fast Behavior

`DependencyInjection.cs` performs all validation at startup (not lazy):

1. `connectionString = configuration.GetConnectionString("DefaultConnection")` throws `InvalidOperationException` with message `"No se encontró DefaultConnection."` if missing.
2. The `Jwt` section must be present; otherwise `InvalidOperationException("No se encontró la configuración JWT.")` is thrown.
3. After binding, each of `Issuer`, `Audience`, `SecretKey` must be non-empty and `ExpirationMinutes > 0`; otherwise `InvalidOperationException("La configuración JWT está incompleta.")` is thrown.
4. `SecretKey` must be a valid Base64 string; otherwise `FormatException` is wrapped in `InvalidOperationException("Jwt:SecretKey debe ser una cadena Base64 válida.")`.
5. The decoded key must be at least 32 bytes; otherwise `InvalidOperationException("Jwt:SecretKey debe contener al menos 32 bytes.")` is thrown.

These checks happen inside `AddInfrastructure`, which is invoked from `Program.cs` before `builder.Build()` completes, so misconfiguration fails fast during application startup.

## Startup Wiring

`Services/Services.Api/Program.cs` wires configuration indirectly through dependency injection:

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration); // reads ConnectionStrings.DefaultConnection and Jwt
builder.Services.AddApplication();
```

Environment-specific behavior is gated on `app.Environment.IsDevelopment()`, enabling OpenAPI/Scalar docs only in development.

## Frontend Configuration

`Apps/Web/.env` contains a single variable:

```env
API_BASE_URL=https://localhost:7120/api
```

This is the only frontend configuration file; there is no `.env.local`, `.env.production`, or other layered env files checked into source control.

`next.config.ts` configures Next.js build-time options (`cacheComponents`, `partialPrefetching`, Turbopack CSS loaders) but does not read any environment variables itself.

## Conventions Observed

- Configuration keys mirror the strongly-typed option classes: the `Jwt` section maps directly to `JwtOptions.Issuer`, `Audience`, `SecretKey`, `ExpirationMinutes`.
- Connection strings are accessed via `IConfiguration.GetConnectionString(name)` rather than reading the raw `ConnectionStrings` section, following ASP.NET Core conventions.
- Each environment gets its own `appsettings.{Environment}.json` overlay rather than relying solely on environment variables.
- Example templates (`appsettings.Example.json`) are provided as a reference for deployment, with placeholders instead of real secrets.
- Secrets (JWT secret, DB password) live in plain text in `appsettings.Development.json` — no encryption, no Azure Key Vault, no .NET User Secrets usage.
- All configuration validation is eager and throws descriptive `InvalidOperationException`s at startup; there is no `IValidateOptions` implementation.
- The backend has no feature flags, no dynamic reload, and no external configuration providers (no Azure App Configuration, Consul, etc.).

## Rules Enforced by Code

- `DefaultConnection` connection string is mandatory; absence aborts startup with `InvalidOperationException("No se encontró DefaultConnection.")` — enforced in `Services.Infrastructure.DependencyInjection.AddInfrastructure` line 23–26.
- `Jwt:Issuer`, `Jwt:Audience`, `Jwt:SecretKey` must be non-empty and `Jwt:ExpirationMinutes` must be positive — enforced by the null/whitespace/zero check at lines 56–63.
- `Jwt:SecretKey` must be a Base64-encoded byte array of at least 32 bytes — enforced by the try/catch around `Convert.FromBase64String` and the length check at lines 67–82.
- Only the `Jwt` section is explicitly typed; other settings (e.g., `Logging`, `AllowedHosts`) are consumed via built-in ASP.NET Core services without custom validation.