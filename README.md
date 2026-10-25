# TaskFlow

TaskFlow es una aplicación para organizar tareas y proyectos. El repositorio contiene una API REST en ASP.NET Core y una interfaz web en Next.js. La API usa PostgreSQL, Entity Framework Core e inicio de sesión con JWT.

## Funcionalidades

- Registro, inicio y cierre de sesión.
- Gestión de tareas: creación, consulta, edición, cambio de estado y eliminación.
- Filtros por estado y prioridad, búsqueda por título, orden y paginación.
- Gestión de proyectos y consulta de sus tareas y resumen.
- Aislamiento de tareas y proyectos por usuario autenticado.
- Interfaz web con dashboard, tareas y proyectos.
- Documentación interactiva de la API con Scalar en desarrollo.

## Estructura

```text
TaskFlow/
├── Services/
│   ├── Services.Api/             # Controladores HTTP, autenticación y OpenAPI
│   ├── Services.Application/     # Casos de uso, DTOs e interfaces
│   ├── Services.Domain/          # Entidades, estados y reglas del dominio
│   ├── Services.Infrastructure/  # PostgreSQL, EF Core, Identity y repositorios
│   └── Services.slnx
├── Apps/
│   └── Web/                      # Aplicación Next.js
└── README.md
```

## Requisitos

- .NET 10 SDK
- PostgreSQL
- Node.js compatible con Next.js 16 y pnpm

## Configurar y ejecutar la API

Desde la raíz del repositorio, configura los valores de `Services.Api` mediante User Secrets o variables de entorno. La aplicación requiere:

- `ConnectionStrings:DefaultConnection`: cadena de conexión de PostgreSQL.
- `Jwt:Issuer` y `Jwt:Audience`: emisor y audiencia del token.
- `Jwt:SecretKey`: clave en Base64 que represente al menos 32 bytes.
- `Jwt:ExpirationMinutes`: duración del token en minutos.

Ejemplo para desarrollo con User Secrets (ejecutar desde `Services/Services.Api`):

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=TaskFlow;Username=postgres;Password=TU_PASSWORD"
dotnet user-secrets set "Jwt:Issuer" "TaskFlow.Api"
dotnet user-secrets set "Jwt:Audience" "TaskFlow.Client"
dotnet user-secrets set "Jwt:SecretKey" "<CLAVE_BASE64_DE_AL_MENOS_32_BYTES>"
dotnet user-secrets set "Jwt:ExpirationMinutes" "10080"
```

No guardes contraseñas ni claves reales en archivos versionados. El archivo `appsettings.Example.json` muestra la forma general de la configuración.

Aplica las migraciones y ejecuta la API desde `Services/`:

```bash
dotnet restore Services.slnx
dotnet ef database update --project Services.Infrastructure --startup-project Services.Api
dotnet run --project Services.Api
```

En el entorno Development, Scalar está disponible en `/scalar/v1` y el documento OpenAPI en `/openapi/v1.json`, bajo la URL local que indique `dotnet run`.

## Configurar y ejecutar la aplicación web

Desde `Apps/Web`, instala dependencias y arranca Next.js:

```bash
pnpm install
pnpm dev
```

La web se sirve normalmente en `http://localhost:3000`. Sus llamadas pasan por `src/app/api/[...path]/route.ts`, que reenvía las solicitudes al backend. Configura `API_BASE_URL` en `Apps/Web/.env.local` para apuntar a la URL base de la API, incluyendo `/api`; por ejemplo:

```dotenv
API_BASE_URL=https://localhost:7120/api
```

El proxy usa esa URL por defecto si no se define la variable. En desarrollo deshabilita la validación TLS del proceso Node para permitir certificados locales. Usa un certificado confiable o configura TLS correctamente en otros entornos.

## API

Todas las rutas de tareas y proyectos requieren `Authorization: Bearer <token>`. Obtén el token mediante `POST /api/auth/register` o `POST /api/auth/login`; el campo de respuesta es `accessToken`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Registrar usuario |
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/logout` | Cerrar sesión autenticada |
| `POST` | `/api/tasks` | Crear tarea |
| `GET` | `/api/tasks` | Listar tareas con filtros y paginación |
| `GET` | `/api/tasks/{id}` | Obtener tarea |
| `PUT` | `/api/tasks/{id}` | Actualizar tarea |
| `PATCH` | `/api/tasks/{id}/status` | Cambiar estado |
| `DELETE` | `/api/tasks/{id}` | Eliminar tarea |
| `POST` | `/api/projects` | Crear proyecto |
| `GET` | `/api/projects` | Listar proyectos |
| `GET` | `/api/projects/{id}` | Obtener proyecto |
| `PUT` | `/api/projects/{id}` | Actualizar proyecto |
| `DELETE` | `/api/projects/{id}` | Eliminar proyecto |
| `GET` | `/api/projects/{id}/tasks` | Listar tareas de un proyecto |
| `GET` | `/api/projects/{id}/summary` | Consultar resumen del proyecto |

`GET /api/tasks` y `GET /api/projects/{id}/tasks` aceptan `Page`, `PageSize` (máximo 100), `Status`, `Priority`, `Search`, `SortBy` y `SortDirection`. Los valores de ordenamiento admitidos son `createdAt`, `title`, `dueDate`, `priority` y `status`; la dirección es `asc` o `desc`. Los valores de estado y prioridad corresponden a sus enumeraciones en el backend.

Ejemplo de inicio de sesión:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@ejemplo.com","password":"Password123!"}'
```

Usa la dirección y el esquema HTTP/HTTPS mostrados por `dotnet run`; el puerto del ejemplo puede variar según el perfil local.

## Desarrollo

Los comandos de frontend disponibles en `Apps/Web/package.json` incluyen:

```bash
pnpm lint
pnpm fmt:check
pnpm build
```

La solución backend se puede compilar con:

```bash
dotnet build Services.slnx
```

El proyecto continúa en desarrollo; consulta los controladores y DTOs para los contratos detallados de cada endpoint.

## Licencia y autoría

Desarrollado por Ing. Jesús Manuel Bañuelos Ibarra. No se especifica una licencia de distribución en este repositorio.

