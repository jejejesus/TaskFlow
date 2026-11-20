# TaskFlow

TaskFlow es una aplicación en desarrollo para organizar tareas y proyectos. El repositorio incluye una API REST en ASP.NET Core y una aplicación web en Next.js; los datos se almacenan en PostgreSQL y el acceso a la API se autentica con JWT.

## Estado actual

- Registro e inicio de sesión con correo y contraseña.
- Creación, consulta, edición y eliminación de tareas y proyectos, y duplicación de tareas en la web. La API admite cambiar el estado y la asignación a un proyecto.
- Búsqueda, filtros, ordenamiento y paginación de tareas; consulta de tareas y resumen por proyecto.
- Dashboard y páginas de tareas, proyectos y detalle de proyecto.
- Vista Kanban con todas las tareas agrupadas por estatus y cambio de estatus mediante arrastre o selector.
- Los botones de Google y Apple no implementan autenticación.

## Estructura

```text
TaskFlow/
├── Services/                     # API y lógica de negocio (.NET)
│   ├── Services.Api/
│   ├── Services.Application/
│   ├── Services.Domain/
│   ├── Services.Infrastructure/
│   └── Services.slnx
├── Apps/
│   └── Web/                      # Aplicación web (Next.js)
└── README.md
```

Consulta las instrucciones y detalles de cada parte en [Services](Services/README.md) y [Apps/Web](Apps/Web/README.md).

## Requisitos

- SDK de .NET 10 y herramienta `dotnet-ef` 10.x.
- Una instancia de PostgreSQL accesible y un usuario con permisos para la base de datos y las migraciones.
- Node.js compatible con Next.js 16 (mínimo 20.9.0) y pnpm; la web declara `pnpm@12.21.0` en `package.json`.

## Inicio local

### 1. Configurar la API

Desde `Services/Services.Api`, configura User Secrets para desarrollo. Sustituye los marcadores por tus valores: la clave JWT debe ser una cadena Base64 que represente al menos 32 bytes aleatorios.

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=TaskFlow;Username=postgres;Password=TU_PASSWORD"
dotnet user-secrets set "Jwt:Issuer" "TaskFlow.Api"
dotnet user-secrets set "Jwt:Audience" "TaskFlow.Client"
dotnet user-secrets set "Jwt:SecretKey" "<CLAVE_BASE64_DE_AL_MENOS_32_BYTES>"
dotnet user-secrets set "Jwt:ExpirationMinutes" "10080"
```

No guardes credenciales reales en archivos versionados. `Services/Services.Api/appsettings.Example.json` muestra la estructura de configuración, pero no se carga automáticamente. Consulta [Services](Services/README.md) para instalar `dotnet-ef` y conocer otras opciones de configuración.

### 2. Aplicar migraciones y ejecutar la API

Desde `Services/`:

```bash
dotnet restore Services.slnx
dotnet ef database update --project Services.Infrastructure --startup-project Services.Api -- --environment Development
dotnet run --project Services.Api --launch-profile https
```

El perfil HTTPS configura `https://localhost:7120` y `http://localhost:5020`. La documentación interactiva Scalar está disponible en `/scalar/v1` y OpenAPI en `/openapi/v1.json` cuando se ejecuta en Development.

### 3. Ejecutar la web

Desde `Apps/Web/`:

```bash
pnpm install
pnpm dev
```

La aplicación suele estar disponible en `http://localhost:3000`. Por defecto se conecta a `https://localhost:7120/api`; si la API usa otra dirección, configura `API_BASE_URL` en `Apps/Web/.env.local`, incluyendo `/api`.

En desarrollo, el proceso Node deshabilita la validación TLS para aceptar certificados locales. No uses este comportamiento en producción; configura certificados confiables para la comunicación con la API.

## Comprobaciones

Desde `Services/`, ejecuta `dotnet build Services.slnx`. Desde `Apps/Web/`, están disponibles `pnpm lint`, `pnpm fmt:check` y `pnpm build`. Actualmente no hay proyectos de pruebas en la solución ni un script de pruebas configurado para la web.

## Licencia y autoría

Desarrollado por Ing. Jesús Manuel Bañuelos Ibarra. No se especifica una licencia de distribución en este repositorio.
