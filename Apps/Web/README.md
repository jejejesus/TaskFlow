# TaskFlow Web

Interfaz web de TaskFlow, construida con Next.js 16 (App Router), React 19, TypeScript y Tailwind CSS 4. Consume la API de `Services` y presenta una interfaz en español.

## Funcionalidades y rutas

- `/login` y `/register`: inicio de sesión y registro con correo y contraseña.
- `/`: dashboard con conteos, tareas recientes y proyectos.
- `/my-tasks`: creación, edición, eliminación y duplicación de tareas; la vista de lista permite buscar, filtrar, ordenar y paginar.
- `/projects`: consulta y gestión de proyectos.
- `/projects/[projectSlug]`: detalle y edición de un proyecto, y gestión de sus tareas; el valor de `projectSlug` es el identificador del proyecto.

The Kanban tabs remain empty and are the default view. Select **Lista** or add `?view=list` to see tasks. Tasks created from a project are assigned to that project; existing assignments are preserved when editing. The interface does not yet provide controls for changing task status or project. Google and Apple buttons remain placeholders.

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

In development, HTTPS requests to loopback addresses accept self-signed ASP.NET certificates without following redirects. This exception does not affect other hosts or production. Use trusted certificates in production.

## Autenticación y acceso a la API

Las acciones de servidor envían el registro y el inicio de sesión directamente a la API y almacenan el JWT en la cookie `auth_token`, marcada como `HttpOnly`, `SameSite=Lax` y `Secure` en producción. El cierre de sesión web elimina la cookie localmente; no revoca el JWT.

`src/proxy.ts` redirects based on cookie presence; the API validates the token. Protected pages and mutation actions call the API on the server with uncached, user-specific requests. If the API rejects the session, the sign-in action clears the cookie before redirecting. The HTTP proxy remains available for browser API requests.

## Comandos

Ejecuta estos comandos desde `Apps/Web/`:

| Comando                                  | Descripción                                        |
| ---------------------------------------- | -------------------------------------------------- |
| `pnpm dev`                               | Iniciar el servidor de desarrollo                  |
| `pnpm build`                             | Crear la compilación de producción                 |
| `pnpm start`                             | Iniciar la compilación de producción               |
| `pnpm lint` / `pnpm lint:fix`            | Revisar / corregir problemas con Oxlint            |
| `pnpm test`                              | Run unit and component tests                       |
| `pnpm build` then `pnpm test:production` | Run production HTTP tests against a local mock API |
| `pnpm fmt` / `pnpm fmt:check`            | Formatear / comprobar formato con Oxfmt            |

## Organización

- `src/app/`: rutas, layouts y proxy HTTP a la API.
- `src/actions/`: authentication and mutation server actions.
- `src/components/`: componentes de páginas y de interfaz.
- `src/lib/api/`: clientes y tipos para tareas y proyectos.
- `src/proxy.ts`: redirección de rutas según la cookie de sesión.

[Volver al README principal](../../README.md)
