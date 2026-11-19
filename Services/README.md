# Services

API REST de TaskFlow en ASP.NET Core 10. Gestiona la autenticación, las tareas y los proyectos; utiliza ASP.NET Core Identity, JWT, Entity Framework Core y PostgreSQL.

## Estructura

- `Services.Api/`: controladores, configuración HTTP, autenticación y documentación OpenAPI/Scalar.
- `Services.Application/`: servicios de aplicación, DTOs e interfaces de repositorios.
- `Services.Domain/`: entidades, enumeraciones y reglas del dominio.
- `Services.Infrastructure/`: Identity, JWT, acceso a PostgreSQL, repositorios y migraciones de EF Core.
- `Services.slnx`: solución que agrupa los cuatro proyectos.

## Requisitos y configuración

Se necesitan el SDK de .NET 10, PostgreSQL y la herramienta `dotnet-ef` 10.x. Si no está instalada, se puede instalar una versión compatible con los paquetes actuales:

```bash
dotnet tool install --global dotnet-ef --version 10.0.12
```

Asegúrate de que la herramienta global esté disponible en `PATH` y de que el usuario de PostgreSQL tenga permisos para crear o actualizar la base de datos.

Desde `Services.Api/`, configura User Secrets para desarrollo:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=TaskFlow;Username=postgres;Password=TU_PASSWORD"
dotnet user-secrets set "Jwt:Issuer" "TaskFlow.Api"
dotnet user-secrets set "Jwt:Audience" "TaskFlow.Client"
dotnet user-secrets set "Jwt:SecretKey" "<CLAVE_BASE64_DE_AL_MENOS_32_BYTES>"
dotnet user-secrets set "Jwt:ExpirationMinutes" "10080"
```

`Jwt:SecretKey` debe contener al menos 32 bytes aleatorios codificados en Base64. `Jwt:ExpirationMinutes` debe ser positivo; si no se configura, su valor predeterminado es 10080 minutos. La API valida emisor, audiencia, firma y expiración del token.

También pueden utilizarse variables de entorno como `ConnectionStrings__DefaultConnection`, `Jwt__Issuer`, `Jwt__Audience`, `Jwt__SecretKey` y `Jwt__ExpirationMinutes`. User Secrets se carga en Development; para otros entornos proporciona la configuración de manera segura. `Services.Api/appsettings.Example.json` es solo una plantilla y no se carga automáticamente. No versiones claves ni contraseñas reales.

## Ejecutar y compilar

Desde `Services/`, restaura dependencias, aplica las migraciones existentes y ejecuta la API:

```bash
dotnet restore Services.slnx
dotnet ef database update --project Services.Infrastructure --startup-project Services.Api -- --environment Development
dotnet run --project Services.Api --launch-profile https
```

El perfil `https` usa `https://localhost:7120` y `http://localhost:5020`; el perfil `http` usa solo el segundo puerto. En Development están disponibles `/scalar/v1` y `/openapi/v1.json`. Si es necesario, configura el certificado de desarrollo de .NET en tu equipo.

Para compilar la solución:

```bash
dotnet build Services.slnx
```

Actualmente la solución no incluye proyectos de pruebas.

## Autenticación

`POST /api/auth/register` y `POST /api/auth/login` reciben `email` y `password` y devuelven `accessToken` y `expiresAt`. Identity exige contraseñas de al menos ocho caracteres, con mayúscula, minúscula, número y carácter no alfanumérico. La cuenta se bloquea durante 15 minutos tras cinco intentos fallidos.

Las rutas de tareas y proyectos, así como `POST /api/auth/logout`, requieren `Authorization: Bearer <token>`. Las consultas y modificaciones de tareas y proyectos se limitan al usuario autenticado. El cierre de sesión no revoca los JWT emitidos: siguen siendo válidos hasta su expiración.

Ejemplo de inicio de sesión con el perfil HTTP:

```bash
curl -X POST http://localhost:5020/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@ejemplo.com","password":"Password123!"}'
```

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Registrar usuario |
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/logout` | Cerrar sesión |
| `POST` | `/api/tasks` | Crear tarea |
| `GET` | `/api/tasks` | Listar tareas |
| `GET` | `/api/tasks/{id}` | Obtener tarea |
| `PUT` | `/api/tasks/{id}` | Actualizar tarea, incluida su asignación a un proyecto |
| `PATCH` | `/api/tasks/{id}/status` | Cambiar estado |
| `DELETE` | `/api/tasks/{id}` | Eliminar tarea |
| `POST` | `/api/projects` | Crear proyecto |
| `GET` | `/api/projects` | Listar proyectos |
| `GET` | `/api/projects/{id}` | Obtener proyecto |
| `PUT` | `/api/projects/{id}` | Actualizar proyecto |
| `DELETE` | `/api/projects/{id}` | Eliminar proyecto sin tareas asociadas |
| `GET` | `/api/projects/{id}/tasks` | Listar tareas de un proyecto |
| `GET` | `/api/projects/{id}/summary` | Consultar conteos y progreso del proyecto |

Las listas de tareas aceptan `Page` (predeterminado: 1), `PageSize` (predeterminado: 10, máximo: 100), `Status`, `Priority`, `Search`, `SortBy` y `SortDirection`. La búsqueda se aplica al título. Los campos de orden admitidos son `createdAt`, `title`, `dueDate`, `priority` y `status`; la dirección es `asc` o `desc`. Por defecto se ordena por `createdAt` descendente.

Los valores numéricos de estado son `1` (Todo), `2` (InProgress) y `3` (Done); los de prioridad son `1` (Low), `2` (Medium), `3` (High) y `4` (Urgent). Consulta los DTOs y Scalar para los contratos completos.

[Volver al README principal](../README.md)
