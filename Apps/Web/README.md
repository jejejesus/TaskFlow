# TaskFlow Web

Interfaz web de TaskFlow, construida con Next.js 16 (App Router), React 19, TypeScript y Tailwind CSS 4. Consume la API de `Services` y presenta una interfaz en español.

## Funcionalidades y rutas

- `/login` y `/register`: inicio de sesión y registro con correo y contraseña.
- `/`: dashboard con conteos, tareas recientes y proyectos.
- `/my-tasks`: creación, edición, eliminación y duplicación de tareas; la vista de lista permite buscar, filtrar, ordenar y paginar.
- `/projects`: consulta y gestión de proyectos.
- `/projects/[projectSlug]`: detalle y edición de un proyecto, y gestión de sus tareas; el valor de `projectSlug` es el identificador del proyecto.

Las pestañas Kanban de tareas y de detalle de proyecto están vacías y son la vista predeterminada. Selecciona **Lista** o agrega `?view=list` para ver las tareas. La interfaz aún no ofrece controles para cambiar el estado o el proyecto de una tarea; al crear una tarea desde el detalle de un proyecto tampoco se asigna automáticamente a ese proyecto. Los botones de Google y Apple todavía no realizan autenticación y los datos de usuario mostrados en la barra lateral son de ejemplo.

## Requisitos

- Node.js compatible con Next.js 16 (mínimo 20.9.0) y pnpm. El proyecto declara `pnpm@12.21.0` en `package.json`.
- La API y PostgreSQL configurados y en ejecución. Consulta [Services](../../Services/README.md).

## Configuración y ejecución

Desde `Apps/Web/`, instala las dependencias y ejecuta el servidor de desarrollo:

```bash
pnpm install
pnpm dev
```

La aplicación suele estar disponible en `http://localhost:3000`. El servidor de Next.js utiliza `API_BASE_URL` para conectarse a la API; el valor predeterminado es `https://localhost:7120/api`, correspondiente al perfil `https` de la API. Para utilizar otra dirección, crea `Apps/Web/.env.local`:

```dotenv
API_BASE_URL=https://localhost:7120/api
```

Incluye `/api` en la URL. Reinicia Next.js después de cambiar la configuración. No versiones archivos de entorno con credenciales.

En entornos distintos de producción, el código establece `NODE_TLS_REJECT_UNAUTHORIZED=0` en el proceso Node para aceptar certificados de desarrollo, lo que deshabilita la verificación TLS del proceso. En producción utiliza certificados confiables y una conexión segura a la API.

## Autenticación y acceso a la API

Las acciones de servidor envían el registro y el inicio de sesión directamente a la API y almacenan el JWT en la cookie `auth_token`, marcada como `HttpOnly`, `SameSite=Lax` y `Secure` en producción. El cierre de sesión web elimina la cookie localmente; no revoca el JWT.

`src/proxy.ts` redirige según la presencia de la cookie, mientras que la API valida el token. Las solicitudes de datos del navegador pasan por `src/app/api/[...path]/route.ts`, que las reenvía a la API y añade el token como Bearer si no se proporcionó otro encabezado de autorización.

## Comandos

Ejecuta estos comandos desde `Apps/Web/`:

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Iniciar el servidor de desarrollo |
| `pnpm build` | Crear la compilación de producción |
| `pnpm start` | Iniciar la compilación de producción |
| `pnpm lint` / `pnpm lint:fix` | Revisar / corregir problemas con Oxlint |
| `pnpm fmt` / `pnpm fmt:check` | Formatear / comprobar formato con Oxfmt |

Actualmente no hay un script de pruebas configurado.

## Organización

- `src/app/`: rutas, layouts y proxy HTTP a la API.
- `src/actions/`: acciones de autenticación del servidor.
- `src/components/`: componentes de páginas y de interfaz.
- `src/lib/api/`: clientes y tipos para tareas y proyectos.
- `src/proxy.ts`: redirección de rutas según la cookie de sesión.

[Volver al README principal](../../README.md)
