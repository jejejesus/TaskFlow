---
kind: external_dependency
name: JWT Bearer authentication
slug: jwt-bearer-aspnet-core
category: external_dependency
category_hints:
    - auth_protocol
scope:
    - '**'
---

API auth uses ASP.NET Core's JwtBearer handler with a symmetric key stored in dotnet user-secrets (`Jwt:SecretKey`, Base64 ≥32 bytes). Issuer/Audience are set via `Jwt:Issuer` / `Jwt:Audience`; token lifetime defaults to `Jwt:ExpirationMinutes`. The web client sends the token as a Bearer Authorization header against the `/api` routes.