# Project Management Feature

<cite>
**Referenced Files in This Document**
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [IProjectRepository.cs](file://Services/Services.Application/Interfaces/Repositories/IProjectRepository.cs)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)
- [CreateProjectRequest.cs](file://Services/Services.Application/DTOs/Projects/CreateProjectRequest.cs)
- [UpdateProjectRequest.cs](file://Services/Services.Application/DTOs/Projects/UpdateProjectRequest.cs)
- [ProjectResponse.cs](file://Services/Services.Application/DTOs/Projects/ProjectResponse.cs)
- [ProjectSummaryResponse.cs](file://Services/Services.Application/DTOs/Projects/ProjectSummaryResponse.cs)
- [Project.cs](file://Services/Services.Domain/Entities/Project.cs)
- [ProjectConfiguration.cs](file://Services/Services.Infrastructure/Persistence/Configurations/ProjectConfiguration.cs)
- [projects page.tsx](file://Apps/Web/src/app/(protected)/projects/page.tsx)
- [project details page.tsx](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx)
- [list-section.tsx](file://Apps/Web/src/components/projects-page/list-section.tsx)
- [project-form.tsx](file://Apps/Web/src/components/projects-page/project-form.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the project management feature end-to-end: how users create, edit, delete, and view projects; how the frontend forms validate input and handle colors; how the project list displays cards with actions; how backend services enforce validation and ownership; and how project summaries and progress are computed. It also shows integration points with task management for listing tasks within a project.

## Project Structure
The feature spans both frontend (Next.js app) and backend (.NET API). The key areas are:
- Frontend pages for listing projects and viewing a single project’s details
- A reusable project form dialog for creation and editing
- Backend controllers, application services, domain entities, DTOs, and repository implementations

```mermaid
graph TB
subgraph "Frontend"
PList["projects page.tsx"]
PDetail["project details page.tsx"]
PForm["project-form.tsx"]
PListSection["list-section.tsx"]
end
subgraph "Backend"
Ctl["ProjectsController.cs"]
Svc["ProjectService.cs"]
RepoIntf["IProjectRepository.cs"]
RepoImpl["ProjectRepository.cs"]
Domain["Project.cs"]
DtoC["CreateProjectRequest.cs"]
DtoU["UpdateProjectRequest.cs"]
DtoR["ProjectResponse.cs"]
DtoS["ProjectSummaryResponse.cs"]
DbCfg["ProjectConfiguration.cs"]
end
PList --> PListSection
PList --> PForm
PDetail --> PForm
PList --> |HTTP| Ctl
PDetail --> |HTTP| Ctl
Ctl --> Svc
Svc --> RepoIntf
RepoImpl --> RepoIntf
Svc --> Domain
Svc --> DtoC
Svc --> DtoU
Svc --> DtoR
Svc --> DtoS
RepoImpl --> DbCfg
```

**Diagram sources**
- [projects page.tsx](file://Apps/Web/src/app/(protected)/projects/page.tsx)
- [project details page.tsx](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx)
- [project-form.tsx](file://Apps/Web/src/components/projects-page/project-form.tsx)
- [list-section.tsx](file://Apps/Web/src/components/projects-page/list-section.tsx)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [IProjectRepository.cs](file://Services/Services.Application/Interfaces/Repositories/IProjectRepository.cs)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)
- [Project.cs](file://Services/Services.Domain/Entities/Project.cs)
- [CreateProjectRequest.cs](file://Services/Services.Application/DTOs/Projects/CreateProjectRequest.cs)
- [UpdateProjectRequest.cs](file://Services/Services.Application/DTOs/Projects/UpdateProjectRequest.cs)
- [ProjectResponse.cs](file://Services/Services.Application/DTOs/Projects/ProjectResponse.cs)
- [ProjectSummaryResponse.cs](file://Services/Services.Application/DTOs/Projects/ProjectSummaryResponse.cs)
- [ProjectConfiguration.cs](file://Services/Services.Infrastructure/Persistence/Configurations/ProjectConfiguration.cs)

**Section sources**
- [projects page.tsx](file://Apps/Web/src/app/(protected)/projects/page.tsx)
- [project details page.tsx](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)

## Core Components
- ProjectsController exposes REST endpoints for creating, reading, updating, deleting projects, listing tasks per project, and retrieving project summary statistics.
- ProjectService implements business logic: validation, ownership checks, mapping to/from domain models and DTOs, and computing progress metrics.
- IProjectRepository defines persistence operations; ProjectRepository implements them using Entity Framework.
- Domain entity Project enforces value object rules for name, description length, and color format.
- DTOs define request/response contracts for API consumers.
- Frontend pages orchestrate user flows: list projects, open form dialogs, manage state, and call APIs.

**Section sources**
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [IProjectRepository.cs](file://Services/Services.Application/Interfaces/Repositories/IProjectRepository.cs)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)
- [Project.cs](file://Services/Services.Domain/Entities/Project.cs)
- [CreateProjectRequest.cs](file://Services/Services.Application/DTOs/Projects/CreateProjectRequest.cs)
- [UpdateProjectRequest.cs](file://Services/Services.Application/DTOs/Projects/UpdateProjectRequest.cs)
- [ProjectResponse.cs](file://Services/Services.Application/DTOs/Projects/ProjectResponse.cs)
- [ProjectSummaryResponse.cs](file://Services/Services.Application/DTOs/Projects/ProjectSummaryResponse.cs)

## Architecture Overview
The feature follows a layered architecture:
- Presentation layer (frontend pages and components) calls HTTP endpoints.
- API layer (controller) validates inputs and delegates to service.
- Application layer (service) orchestrates use cases, enforces business rules, and maps data.
- Infrastructure layer (repository + EF configuration) persists data and computes aggregates.

```mermaid
sequenceDiagram
participant FE as "Frontend Pages"
participant API as "ProjectsController"
participant SVC as "ProjectService"
participant REP as "ProjectRepository"
participant DB as "Database"
FE->>API : POST /api/projects (create)
API->>SVC : CreateAsync(userId, request)
SVC->>REP : AddAsync(project)
REP->>DB : INSERT
DB-->>REP : success
REP-->>SVC : void
SVC-->>API : ProjectResponse
API-->>FE : 201 Created
FE->>API : GET /api/projects/{id}/summary
API->>SVC : GetSummaryAsync(userId, id)
SVC->>REP : GetByIdAsync(id, userId)
REP->>DB : SELECT project
DB-->>REP : project
SVC->>REP : GetTaskCountsByProjectAsync(id, userId)
REP->>DB : GROUP BY status
DB-->>REP : counts
SVC-->>API : ProjectSummaryResponse
API-->>FE : 200 OK
```

**Diagram sources**
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [IProjectRepository.cs](file://Services/Services.Application/Interfaces/Repositories/IProjectRepository.cs)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)

## Detailed Component Analysis

### Project CRUD Operations

#### Create Project
- Frontend opens ProjectFormDialog, collects name, optional description, and color.
- On submit, it calls the create endpoint with a CreateProjectRequest payload.
- Controller extracts authenticated user ID and invokes ProjectService.CreateAsync.
- Service constructs a domain Project via ProjectName and Project.Create, then persists through repository.
- Response is mapped to ProjectResponse and returned.

```mermaid
flowchart TD
Start(["User submits form"]) --> ValidateInput["Validate required fields<br/>and color format"]
ValidateInput --> CallAPI["POST /api/projects"]
CallAPI --> Controller["ProjectsController.Create"]
Controller --> Service["ProjectService.CreateAsync"]
Service --> Domain["Project.Create(...)"]
Domain --> Repo["ProjectRepository.AddAsync"]
Repo --> Persist["Database INSERT"]
Persist --> MapResp["Map to ProjectResponse"]
MapResp --> Return(["201 Created"])
```

**Diagram sources**
- [project-form.tsx](file://Apps/Web/src/components/projects-page/project-form.tsx)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [Project.cs](file://Services/Services.Domain/Entities/Project.cs)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)

**Section sources**
- [project-form.tsx](file://Apps/Web/src/components/projects-page/project-form.tsx)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [CreateProjectRequest.cs](file://Services/Services.Application/DTOs/Projects/CreateProjectRequest.cs)
- [ProjectResponse.cs](file://Services/Services.Application/DTOs/Projects/ProjectResponse.cs)

#### Read All Projects
- Frontend lists all projects by calling GET /api/projects.
- Service retrieves projects owned by the current user and returns a list of ProjectResponse.
- List section renders cards with color accents and action menus.

```mermaid
sequenceDiagram
participant FE as "projects page.tsx"
participant API as "ProjectsController"
participant SVC as "ProjectService"
participant REP as "ProjectRepository"
FE->>API : GET /api/projects
API->>SVC : GetAllAsync(userId)
SVC->>REP : GetAllByUserIdAsync(userId)
REP-->>SVC : IReadOnlyList<Project>
SVC-->>API : IReadOnlyList<ProjectResponse>
API-->>FE : 200 OK
```

**Diagram sources**
- [projects page.tsx](file://Apps/Web/src/app/(protected)/projects/page.tsx)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)

**Section sources**
- [projects page.tsx](file://Apps/Web/src/app/(protected)/projects/page.tsx)
- [list-section.tsx](file://Apps/Web/src/components/projects-page/list-section.tsx)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)

#### Read Project Details
- Frontend navigates to /projects/{id} and loads project details.
- Controller calls ProjectService.GetByIdAsync to return a single ProjectResponse.
- The detail page shows project header with color accent, description, and actions to edit or delete.

```mermaid
sequenceDiagram
participant FE as "project details page.tsx"
participant API as "ProjectsController"
participant SVC as "ProjectService"
participant REP as "ProjectRepository"
FE->>API : GET /api/projects/{id}
API->>SVC : GetByIdAsync(userId, id)
SVC->>REP : GetByIdAsync(id, userId)
REP-->>SVC : Project?
SVC-->>API : ProjectResponse
API-->>FE : 200 OK
```

**Diagram sources**
- [project details page.tsx](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)

**Section sources**
- [project details page.tsx](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)

#### Update Project
- Frontend opens ProjectFormDialog pre-filled with existing project data.
- On save, it calls PUT /api/projects/{id} with an UpdateProjectRequest.
- Service validates ownership, updates domain model, and persists changes.

```mermaid
flowchart TD
OpenEdit["Open edit dialog"] --> FillFields["Pre-fill name, description, color"]
FillFields --> Submit["PUT /api/projects/{id}"]
Submit --> Controller["ProjectsController.Update"]
Controller --> Service["ProjectService.UpdateAsync"]
Service --> Domain["Project.UpdateDetails(...)"]
Domain --> Repo["ProjectRepository.UpdateAsync"]
Repo --> Persist["Database UPDATE"]
Persist --> MapResp["Map to ProjectResponse"]
MapResp --> Return(["200 OK"])
```

**Diagram sources**
- [project-form.tsx](file://Apps/Web/src/components/projects-page/project-form.tsx)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [Project.cs](file://Services/Services.Domain/Entities/Project.cs)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)

**Section sources**
- [project-form.tsx](file://Apps/Web/src/components/projects-page/project-form.tsx)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [UpdateProjectRequest.cs](file://Services/Services.Application/DTOs/Projects/UpdateProjectRequest.cs)

#### Delete Project
- Frontend triggers a confirmation dialog before deletion.
- Controller calls ProjectService.DeleteAsync which checks if the project has associated tasks.
- If tasks exist, deletion is blocked; otherwise, the project is removed.

```mermaid
sequenceDiagram
participant FE as "list-section.tsx / project details page.tsx"
participant API as "ProjectsController"
participant SVC as "ProjectService"
participant REP as "ProjectRepository"
FE->>API : DELETE /api/projects/{id}
API->>SVC : DeleteAsync(userId, id)
SVC->>REP : HasTasksAsync(id)
REP-->>SVC : bool
alt Has tasks
SVC-->>API : InvalidOperationException
API-->>FE : 409 Conflict
else No tasks
SVC->>REP : DeleteAsync(project)
REP-->>SVC : void
SVC-->>API : void
API-->>FE : 204 No Content
end
```

**Diagram sources**
- [list-section.tsx](file://Apps/Web/src/components/projects-page/list-section.tsx)
- [project details page.tsx](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)

**Section sources**
- [list-section.tsx](file://Apps/Web/src/components/projects-page/list-section.tsx)
- [project details page.tsx](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)

### Project Form Implementation
- Fields: Name (required), Description (optional), Color (hex).
- Validation:
  - Frontend uses HTML required attribute for name and controlled state for other fields.
  - Backend enforces:
    - Name via ProjectName value object (length constraints configured in EF).
    - Description trimmed and limited to 1000 characters.
    - Color must be a valid hex string (#RRGGBB).
- User input handling:
  - Dialog resets on open/close.
  - Submit disables controls while saving and shows spinner.
  - Success/error toasts inform the user.

```mermaid
flowchart TD
Open["Open dialog"] --> Reset["Reset fields from project or defaults"]
Reset --> Edit["User edits name/description/color"]
Edit --> Submit["Submit form"]
Submit --> ValidateFE["Frontend required check"]
ValidateFE --> CallAPI["Call create/update API"]
CallAPI --> ValidateBE["Backend validation:<br/>name, description length, color hex"]
ValidateBE --> Save["Persist and map response"]
Save --> Toast["Show success toast"]
Toast --> Close["Close dialog and update list"]
```

**Diagram sources**
- [project-form.tsx](file://Apps/Web/src/components/projects-page/project-form.tsx)
- [Project.cs](file://Services/Services.Domain/Entities/Project.cs)
- [ProjectConfiguration.cs](file://Services/Services.Infrastructure/Persistence/Configurations/ProjectConfiguration.cs)

**Section sources**
- [project-form.tsx](file://Apps/Web/src/components/projects-page/project-form.tsx)
- [Project.cs](file://Services/Services.Domain/Entities/Project.cs)
- [ProjectConfiguration.cs](file://Services/Services.Infrastructure/Persistence/Configurations/ProjectConfiguration.cs)

### Project List View
- Displays project cards with top border color reflecting project.color.
- Actions: View project details, Edit, Delete.
- Empty state when no projects exist.
- Sorting and filtering:
  - Backend sorts projects by name ascending.
  - Filtering by user ownership is enforced server-side.
  - Pagination is not implemented at the project list level.

```mermaid
flowchart TD
Load["Load projects"] --> Render["Render cards with color accents"]
Render --> Actions{"User action?"}
Actions --> |View| Navigate["Navigate to /projects/{id}?view=kanban"]
Actions --> |Edit| OpenEdit["Open edit dialog"]
Actions --> |Delete| ConfirmDel["Confirm delete dialog"]
ConfirmDel --> Remove["Remove from local list on success"]
```

**Diagram sources**
- [list-section.tsx](file://Apps/Web/src/components/projects-page/list-section.tsx)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)

**Section sources**
- [list-section.tsx](file://Apps/Web/src/components/projects-page/list-section.tsx)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)

### Project Summary Statistics and Progress Tracking
- Endpoint GET /api/projects/{id}/summary returns:
  - ProjectId, ProjectName
  - TotalTasks, CompletedTasks, PendingTasks
  - ProgressPercentage (completed / total * 100, rounded to two decimals)
- Computation:
  - Fetch project and ensure ownership.
  - Aggregate task counts grouped by status.
  - Calculate pending = total - completed.
  - Compute percentage safely when total is zero.

```mermaid
flowchart TD
Request["GET /api/projects/{id}/summary"] --> Validate["Validate userId and projectId"]
Validate --> LoadProj["Load project by id and userId"]
LoadProj --> LoadCounts["Get task counts by status"]
LoadCounts --> CalcTotal["totalTasks = sum(counts)"]
CalcTotal --> CalcCompleted["completedTasks = counts[Done]"]
CalcCompleted --> CalcPending["pendingTasks = total - completed"]
CalcPending --> CalcPct["progressPercentage = (completed/total)*100 or 0"]
CalcPct --> Respond["Return ProjectSummaryResponse"]
```

**Diagram sources**
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)

**Section sources**
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [ProjectSummaryResponse.cs](file://Services/Services.Application/DTOs/Projects/ProjectSummaryResponse.cs)

### Integration with Task Management
- Within a project detail page, tasks can be listed and managed:
  - GET /api/projects/{id}/tasks supports query parameters for status, priority, sorting, and pagination.
  - Frontend manages query params and page changes, updating the task list accordingly.
- This demonstrates tight integration between project and task features.

```mermaid
sequenceDiagram
participant FE as "project details page.tsx"
participant API as "ProjectsController"
participant TAPI as "ITaskService"
FE->>API : GET /api/projects/{id}/tasks?Page&PageSize&Status&Priority&SortBy&SortDirection
API->>TAPI : GetByProjectIdAsync(userId, id, query)
TAPI-->>API : PagedResponse<TaskResponse>
API-->>FE : 200 OK
```

**Diagram sources**
- [project details page.tsx](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)

**Section sources**
- [project details page.tsx](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)

## Dependency Analysis
Key relationships:
- ProjectsController depends on IProjectService and ITaskService.
- ProjectService depends on IProjectRepository and domain types.
- ProjectRepository implements IProjectRepository and uses AppDbContext.
- Domain Project uses value objects and enforces validation rules.
- DTOs define clear boundaries between layers.

```mermaid
classDiagram
class ProjectsController {
+Create(request)
+GetAll()
+GetById(id)
+GetTasks(id, query)
+Update(id, request)
+Delete(id)
+GetSummary(id)
}
class ProjectService {
+CreateAsync(userId, request)
+GetAllAsync(userId)
+GetByIdAsync(userId, projectId)
+UpdateAsync(userId, projectId, request)
+DeleteAsync(userId, projectId)
+GetSummaryAsync(userId, projectId)
}
class IProjectRepository {
<<interface>>
+AddAsync(project)
+GetAllByUserIdAsync(userId)
+GetByIdAsync(projectId, userId)
+HasTasksAsync(projectId)
+UpdateAsync(project)
+DeleteAsync(project)
+GetTaskCountsByProjectAsync(projectId, userId)
}
class ProjectRepository {
+AddAsync(project)
+GetAllByUserIdAsync(userId)
+GetByIdAsync(projectId, userId)
+HasTasksAsync(projectId)
+UpdateAsync(project)
+DeleteAsync(project)
+GetTaskCountsByProjectAsync(projectId, userId)
}
class Project {
+Id
+Name
+Description
+Color
+UserId
+CreatedAt
+UpdatedAt
+Create(...)
+UpdateDetails(...)
}
class CreateProjectRequest
class UpdateProjectRequest
class ProjectResponse
class ProjectSummaryResponse
ProjectsController --> ProjectService : "uses"
ProjectService --> IProjectRepository : "depends on"
ProjectRepository ..|> IProjectRepository : "implements"
ProjectService --> Project : "creates/updates"
ProjectService --> CreateProjectRequest : "consumes"
ProjectService --> UpdateProjectRequest : "consumes"
ProjectService --> ProjectResponse : "produces"
ProjectService --> ProjectSummaryResponse : "produces"
```

**Diagram sources**
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [IProjectRepository.cs](file://Services/Services.Application/Interfaces/Repositories/IProjectRepository.cs)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)
- [Project.cs](file://Services/Services.Domain/Entities/Project.cs)
- [CreateProjectRequest.cs](file://Services/Services.Application/DTOs/Projects/CreateProjectRequest.cs)
- [UpdateProjectRequest.cs](file://Services/Services.Application/DTOs/Projects/UpdateProjectRequest.cs)
- [ProjectResponse.cs](file://Services/Services.Application/DTOs/Projects/ProjectResponse.cs)
- [ProjectSummaryResponse.cs](file://Services/Services.Application/DTOs/Projects/ProjectSummaryResponse.cs)

**Section sources**
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [IProjectRepository.cs](file://Services/Services.Application/Interfaces/Repositories/IProjectRepository.cs)
- [ProjectRepository.cs](file://Services/Services.Infrastructure/Repositories/ProjectRepository.cs)
- [Project.cs](file://Services/Services.Domain/Entities/Project.cs)

## Performance Considerations
- Use AsNoTracking for read-only queries to avoid tracking overhead.
- Group-by aggregation for task counts reduces client-side computation.
- Avoid unnecessary re-renders by updating only changed items in the task list.
- Keep color normalization and description trimming on the server to prevent invalid data.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Validation errors:
  - Missing or empty name: handled by domain value object and EF constraints.
  - Description too long: domain throws exception when exceeding limit.
  - Invalid color format: domain rejects non-hex strings.
- Ownership errors:
  - Accessing another user’s project results in KeyNotFoundException.
- Deletion conflicts:
  - Deleting a project with tasks returns conflict due to business rule.

Operational tips:
- Check controller error mappings for BadRequest, NotFound, and Conflict responses.
- Inspect service exceptions for detailed messages.
- Verify repository queries for correct filters by userId.

**Section sources**
- [ProjectService.cs](file://Services/Services.Application/Services/ProjectService.cs)
- [ProjectsController.cs](file://Services/Services.Api/Controllers/ProjectsController.cs)
- [Project.cs](file://Services/Services.Domain/Entities/Project.cs)

## Conclusion
The project management feature provides a complete lifecycle for projects with robust validation, ownership enforcement, and clear separation of concerns across layers. The frontend offers intuitive forms and lists with visual indicators like color accents, while the backend ensures data integrity and computes meaningful progress metrics. Integration with task management enables cohesive workflows around projects and their tasks.