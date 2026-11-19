---
kind: external_dependency
name: PostgreSQL database
slug: postgresql
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

Relational datastore for TaskFlow; configured via `ConnectionStrings:DefaultConnection` in dotnet user-secrets and accessed through Npgsql EF Core provider. Connection string format uses Host/Port/Database/Username/Password keys.