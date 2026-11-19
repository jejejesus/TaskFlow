# Task Management Feature

<cite>
**Referenced Files in This Document**
- [TaskItem.cs](file://Services/Services.Domain/Entities/TaskItem.cs)
- [TaskCurrentStatus.cs](file://Services/Services.Domain/Enums/TaskCurrentStatus.cs)
- [TaskPriority.cs](file://Services/Services.Domain/Enums/TaskPriority.cs)
- [CreateTaskRequest.cs](file://Services/Services.Application/DTOs/Tasks/CreateTaskRequest.cs)
- [UpdateTaskRequest.cs](file://Services/Services.Application/DTOs/Tasks/UpdateTaskRequest.cs)
- [ChangeTaskStatusRequest.cs](file://Services/Services.Application/DTOs/Tasks/ChangeTaskStatusRequest.cs)
- [TaskQueryRequest.cs](file://Services/Services.Application/DTOs/Tasks/TaskQueryRequest.cs)
- [TaskResponse.cs](file://Services/Services.Application/DTOs/Tasks/TaskResponse.cs)
- [TasksController.cs](file://Services/Services.Api/Controllers/TasksController.cs)
- [TaskService.cs](file://Services/Services.Application/Services/TaskService.cs)
- [ITaskService.cs](file://Services/Services.Application/Interfaces/Services/ITaskService.cs)
- [TaskRepository.cs](file://Services/Services.Infrastructure/Repositories/TaskRepository.cs)
- [task-form.tsx](file://Apps/Web/src/components/tasks-page/task-form.tsx)
- [list-section.tsx](file://Apps/Web/src/components/tasks-page/list-section.tsx)
- [kanban-section.tsx](file://Apps/Web/src/components/tasks-page/kanban-section.tsx)
- [tasks-list-sections.tsx](file://Apps/Web/src/components/project-details-page/tasks-list-sections.tsx)
- [page.tsx](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx)
- [tasks.ts](file://Apps/Web/src/lib/api/tasks.ts)
- [tasks-constants.ts](file://Apps/Web/src/lib/util-constants/tasks-constants.ts)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive project-specific task listing system with advanced filtering capabilities
- Enhanced UI components with complete search, sorting, pagination, duplication, editing, and deletion features
- Implemented dedicated ProjectTasksList component for project detail pages
- Improved task management workflow integration between projects and tasks
- Added advanced query handling with debounced search and real-time filtering

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
This document explains the enhanced task management feature end-to-end, covering domain modeling, API design, service logic, repository queries, and frontend components. It details the task lifecycle from creation to completion (Todo → InProgress → Done), the task form with priority levels, due dates, and description handling, comprehensive list views with advanced search/filter/sort/pagination, and the Kanban board placeholder. The updated implementation includes a sophisticated project-specific task listing system with advanced filtering capabilities and improved UI components.

## Project Structure
The enhanced task feature spans three layers with improved project integration:
- Domain layer defines entities, enums, and value objects.
- Application layer provides DTOs, services, and interfaces with advanced query handling.
- Infrastructure layer implements repositories and persistence.
- Web layer includes React components for forms, comprehensive list views, project-specific task management, and a Kanban placeholder.

```mermaid
graph TB
subgraph "Domain"
D_Task["TaskItem"]
D_Status["TaskCurrentStatus"]
D_Priority["TaskPriority"]
end
subgraph "Application"
A_Create["CreateTaskRequest"]
A_Update["UpdateTaskRequest"]
A_StatusReq["ChangeTaskStatusRequest"]
A_Query["TaskQueryRequest"]
A_Response["TaskResponse"]
A_Service["TaskService"]
A_Interface["ITaskService"]
end
subgraph "Infrastructure"
I_Repo["TaskRepository"]
end
subgraph "API"
C_Tasks["TasksController"]
end
subgraph "Web"
W_Form["TaskFormDialog"]
W_List["TasksList + TaskQuery + TasksPagination"]
W_ProjectList["ProjectTasksList"]
W_Kanban["TasksKanbanBoard"]
W_ProjectPage["ProjectDetailPage"]
end
C_Tasks --> A_Service
A_Service --> A_Interface
A_Service --> I_Repo
I_Repo --> D_Task
A_Service --> D_Task
A_Service --> D_Status
A_Service --> D_Priority
W_Form --> C_Tasks
W_List --> C_Tasks
W_ProjectList --> C_Tasks
W_ProjectPage --> W_ProjectList
W_Kanban --> C_Tasks
```

**Diagram sources**
- [TaskItem.cs:6-128](file://Services/Services.Domain/Entities/TaskItem.cs#L6-L128)
- [TaskCurrentStatus.cs:3-8](file://Services/Services.Domain/Enums/TaskCurrentStatus.cs#L3-L8)
- [TaskPriority.cs:3-9](file://Services/Services.Domain/Enums/TaskPriority.cs#L3-L9)
- [CreateTaskRequest.cs:5-10](file://Services/Services.Application/DTOs/Tasks/CreateTaskRequest.cs#L5-L10)
- [UpdateTaskRequest.cs:5-10](file://Services/Services.Application/DTOs/Tasks/UpdateTaskRequest.cs#L5-L10)
- [ChangeTaskStatusRequest.cs:5-6](file://Services/Services.Application/DTOs/Tasks/ChangeTaskStatusRequest.cs#L5-L6)
- [TaskQueryRequest.cs:5-20](file://Services/Services.Application/DTOs/Tasks/TaskQueryRequest.cs#L5-L20)
- [TaskResponse.cs:5-16](file://Services/Services.Application/DTOs/Tasks/TaskResponse.cs#L5-L16)
- [TaskService.cs:12-412](file://Services/Services.Application/Services/TaskService.cs#L12-L412)
- [ITaskService.cs:6-49](file://Services/Services.Application/Interfaces/Services/ITaskService.cs#L6-L49)
- [TaskRepository.cs:9-239](file://Services/Services.Infrastructure/Repositories/TaskRepository.cs#L9-L239)
- [TasksController.cs:11-199](file://Services/Services.Api/Controllers/TasksController.cs#L11-L199)
- [task-form.tsx:60-334](file://Apps/Web/src/components/tasks-page/task-form.tsx#L60-L334)
- [list-section.tsx:81-550](file://Apps/Web/src/components/tasks-page/list-section.tsx#L81-L550)
- [kanban-section.tsx:1-4](file://Apps/Web/src/components/tasks-page/kanban-section.tsx#L1-L4)
- [tasks-list-sections.tsx:57-253](file://Apps/Web/src/components/project-details-page/tasks-list-sections.tsx#L57-L253)
- [page.tsx:37-327](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx#L37-L327)

**Section sources**
- [TaskItem.cs:6-128](file://Services/Services.Domain/Entities/TaskItem.cs#L6-L128)
- [TaskService.cs:12-412](file://Services/Services.Application/Services/TaskService.cs#L12-L412)
- [TaskRepository.cs:9-239](file://Services/Services.Infrastructure/Repositories/TaskRepository.cs#L9-L239)
- [TasksController.cs:11-199](file://Services/Services.Api/Controllers/TasksController.cs#L11-L199)
- [task-form.tsx:60-334](file://Apps/Web/src/components/tasks-page/task-form.tsx#L60-L334)
- [list-section.tsx:81-550](file://Apps/Web/src/components/tasks-page/list-section.tsx#L81-L550)
- [kanban-section.tsx:1-4](file://Apps/Web/src/components/tasks-page/kanban-section.tsx#L1-L4)
- [tasks-list-sections.tsx:57-253](file://Apps/Web/src/components/project-details-page/tasks-list-sections.tsx#L57-L253)
- [page.tsx:37-327](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx#L37-L327)

## Core Components
- Domain model: TaskItem encapsulates title, description, status, priority, due date, user/project ownership, and timestamps. It enforces validation on creation and updates and exposes ChangeStatus and AssignToProject.
- Enums: TaskCurrentStatus (Todo, InProgress, Done) and TaskPriority (Low, Medium, High, Urgent).
- DTOs: CreateTaskRequest, UpdateTaskRequest, ChangeTaskStatusRequest, TaskQueryRequest, TaskResponse.
- Service: TaskService orchestrates validation, project existence checks, entity mutations, mapping to responses, and advanced pagination with query normalization.
- Repository: TaskRepository implements filtering by status/priority/search, sorting by multiple fields, stable ordering, and pagination.
- Controller: TasksController exposes REST endpoints for CRUD, status changes, and paged listing.
- Frontend: TaskFormDialog handles create/update; TasksList provides comprehensive search, filter, sort, pagination, duplicate, delete; ProjectTasksList offers project-specific task management; TasksKanbanBoard is a placeholder for future drag-and-drop.

**Updated** Enhanced with comprehensive project-specific task listing and advanced filtering capabilities

**Section sources**
- [TaskItem.cs:6-128](file://Services/Services.Domain/Entities/TaskItem.cs#L6-L128)
- [TaskCurrentStatus.cs:3-8](file://Services/Services.Domain/Enums/TaskCurrentStatus.cs#L3-L8)
- [TaskPriority.cs:3-9](file://Services/Services.Domain/Enums/TaskPriority.cs#L3-L9)
- [CreateTaskRequest.cs:5-10](file://Services/Services.Application/DTOs/Tasks/CreateTaskRequest.cs#L5-L10)
- [UpdateTaskRequest.cs:5-10](file://Services/Services.Application/DTOs/Tasks/UpdateTaskRequest.cs#L5-L10)
- [ChangeTaskStatusRequest.cs:5-6](file://Services/Services.Application/DTOs/Tasks/ChangeTaskStatusRequest.cs#L5-L6)
- [TaskQueryRequest.cs:5-20](file://Services/Services.Application/DTOs/Tasks/TaskQueryRequest.cs#L5-L20)
- [TaskResponse.cs:5-16](file://Services/Services.Application/DTOs/Tasks/TaskResponse.cs#L5-L16)
- [TaskService.cs:12-412](file://Services/Services.Application/Services/TaskService.cs#L12-L412)
- [TaskRepository.cs:9-239](file://Services/Services.Infrastructure/Repositories/TaskRepository.cs#L9-L239)
- [TasksController.cs:11-199](file://Services/Services.Api/Controllers/TasksController.cs#L11-L199)
- [task-form.tsx:60-334](file://Apps/Web/src/components/tasks-page/task-form.tsx#L60-L334)
- [list-section.tsx:81-550](file://Apps/Web/src/components/tasks-page/list-section.tsx#L81-L550)
- [tasks-list-sections.tsx:57-253](file://Apps/Web/src/components/project-details-page/tasks-list-sections.tsx#L57-L253)

## Architecture Overview
The enhanced task feature follows a layered architecture with improved project integration:
- Web components call the API via HTTP with advanced query parameters.
- API controller validates requests and delegates to the service.
- Service performs business rules, maps to domain entities, and persists via repository with advanced query handling.
- Repository composes EF queries with filtering, sorting, and pagination.

```mermaid
sequenceDiagram
participant FE as "Frontend (TaskForm / TasksList / ProjectTasksList)"
participant API as "TasksController"
participant SVC as "TaskService"
participant REP as "TaskRepository"
participant DB as "Database"
FE->>API : POST /api/tasks (create)
API->>SVC : CreateAsync(userId, request)
SVC->>REP : AddAsync(task)
REP->>DB : INSERT
DB-->>REP : persisted
REP-->>SVC : success
SVC-->>API : TaskResponse
API-->>FE : 201 Created
FE->>API : GET /api/tasks?page&pageSize&search&status&priority&sortBy&sortDirection
API->>SVC : GetAllAsync(userId, query)
SVC->>SVC : ValidateAndNormalizeQuery(query)
SVC->>REP : GetPagedByUserIdAsync(userId, normalizedQuery)
REP->>DB : SELECT with filters & pagination
DB-->>REP : results
REP-->>SVC : (items, totalCount)
SVC-->>API : PagedResponse<TaskResponse>
API-->>FE : 200 OK
```

**Diagram sources**
- [TasksController.cs:18-47](file://Services/Services.Api/Controllers/TasksController.cs#L18-L47)
- [TasksController.cs:49-70](file://Services/Services.Api/Controllers/TasksController.cs#L49-L70)
- [TaskService.cs:16-48](file://Services/Services.Application/Services/TaskService.cs#L16-L48)
- [TaskService.cs:160-187](file://Services/Services.Application/Services/TaskService.cs#L160-L187)
- [TaskService.cs:318-393](file://Services/Services.Application/Services/TaskService.cs#L318-L393)
- [TaskRepository.cs:13-23](file://Services/Services.Infrastructure/Repositories/TaskRepository.cs#L13-L23)
- [TaskRepository.cs:82-157](file://Services/Services.Infrastructure/Repositories/TaskRepository.cs#L82-L157)

## Detailed Component Analysis

### Task Lifecycle and Status Transitions
- Creation: TaskItem.Create sets initial status to Todo and records timestamps.
- Updates: UpdateDetails modifies title, description, priority, due date, and updates timestamp.
- Status transitions: ChangeStatus enforces valid enum values and updates timestamp. Allowed states are Todo, InProgress, Done.
- Assignment: AssignToProject links a task to a project and updates timestamp.

```mermaid
stateDiagram-v2
[*] --> Todo : "Create"
Todo --> InProgress : "ChangeStatus(InProgress)"
InProgress --> Done : "ChangeStatus(Done)"
Todo --> Done : "ChangeStatus(Done)"
InProgress --> Todo : "ChangeStatus(Todo)"
Done --> InProgress : "ChangeStatus(InProgress)"
Done --> Todo : "ChangeStatus(Todo)"
```

**Diagram sources**
- [TaskItem.cs:54-78](file://Services/Services.Domain/Entities/TaskItem.cs#L54-L78)
- [TaskItem.cs:103-115](file://Services/Services.Domain/Entities/TaskItem.cs#L103-L115)
- [TaskCurrentStatus.cs:3-8](file://Services/Services.Domain/Enums/TaskCurrentStatus.cs#L3-L8)

**Section sources**
- [TaskItem.cs:54-78](file://Services/Services.Domain/Entities/TaskItem.cs#L54-L78)
- [TaskItem.cs:80-101](file://Services/Services.Domain/Entities/TaskItem.cs#L80-L101)
- [TaskItem.cs:103-115](file://Services/Services.Domain/Entities/TaskItem.cs#L103-L115)
- [TaskItem.cs:117-122](file://Services/Services.Domain/Entities/TaskItem.cs#L117-L122)
- [TaskCurrentStatus.cs:3-8](file://Services/Services.Domain/Enums/TaskCurrentStatus.cs#L3-L8)

### Task Form Implementation
- Fields: Title (required), Description (optional), Priority (select), DueDate (calendar popover), ProjectId (reserved for future integration).
- Behavior: Supports both create and edit modes; uses tasksApi.create or tasksApi.update; shows success/error toasts; disables controls while submitting.
- Validation: Client-side required field; server-side validations enforced by service and domain.

```mermaid
flowchart TD
Start(["Open TaskFormDialog"]) --> Mode{"Edit or Create?"}
Mode --> |Edit| Load["Load existing task data"]
Mode --> |Create| Reset["Reset defaults"]
Load --> Input["User edits title/description/priority/dueDate"]
Reset --> Input
Input --> Submit["Submit form"]
Submit --> CallAPI{"Edit or Create?"}
CallAPI --> |Edit| Update["tasksApi.update(id, payload)"]
CallAPI --> |Create| Create["tasksApi.create(payload)"]
Update --> Success["Show success toast<br/>Close dialog"]
Create --> Success
Update --> Error["Show error toast"]
Create --> Error
Success --> End(["Done"])
Error --> End
```

**Diagram sources**
- [task-form.tsx:60-334](file://Apps/Web/src/components/tasks-page/task-form.tsx#L60-L334)

**Section sources**
- [task-form.tsx:60-334](file://Apps/Web/src/components/tasks-page/task-form.tsx#L60-L334)

### Enhanced List View: Search, Filtering, Sorting, Pagination
- Search: Debounced text input filters by title substring with 300ms delay.
- Filters: Status and Priority dropdowns allow narrowing results with "All" option.
- Sorting: SortBy selection supports createdAt, title, dueDate, priority, status; SortDirection toggle asc/desc with visual indicators.
- Pagination: Server-side pagination with page navigation and ellipsis for large page counts.
- Actions: Edit, Duplicate, Delete per row; Delete confirmation dialog.

**Updated** Enhanced with comprehensive filtering capabilities and improved UI components

```mermaid
flowchart TD
QStart["User interacts with query controls"] --> Search["Debounced search update (300ms)"]
QStart --> FilterStatus["Select status filter"]
QStart --> FilterPriority["Select priority filter"]
QStart --> SortBy["Select sort field"]
QStart --> SortDir["Toggle asc/desc"]
Search --> Apply["Apply query (Page=1)"]
FilterStatus --> Apply
FilterPriority --> Apply
SortBy --> Apply
SortDir --> Apply
Apply --> Fetch["GET /api/tasks?page&pageSize&search&status&priority&sortBy&sortDirection"]
Fetch --> Render["Render table rows"]
Render --> Actions["Edit / Duplicate / Delete"]
Actions --> Refresh["Refresh list after mutation"]
```

**Diagram sources**
- [list-section.tsx:280-454](file://Apps/Web/src/components/tasks-page/list-section.tsx#L280-L454)
- [list-section.tsx:457-550](file://Apps/Web/src/components/tasks-page/list-section.tsx#L457-L550)
- [TaskService.cs:160-187](file://Services/Services.Application/Services/TaskService.cs#L160-L187)
- [TaskRepository.cs:82-157](file://Services/Services.Infrastructure/Repositories/TaskRepository.cs#L82-L157)

**Section sources**
- [list-section.tsx:81-550](file://Apps/Web/src/components/tasks-page/list-section.tsx#L81-L550)

### Project-Specific Task Listing System
- Dedicated component: ProjectTasksList provides project-contextual task management.
- Integration: Seamlessly integrates with project detail pages and maintains project state.
- Features: Inherits all filtering, sorting, pagination capabilities from shared components.
- Display: Shows project-specific information including project name and color badges.

**New** Comprehensive project-specific task listing with advanced filtering capabilities

```mermaid
flowchart TD
ProjectPage["Project Detail Page"] --> ProjectTasksList["ProjectTasksList Component"]
ProjectTasksList --> SharedComponents["Shared Task Components"]
SharedComponents --> TaskQuery["TaskQuery (Search/Filter/Sort)"]
SharedComponents --> TaskTable["Task Table with Actions"]
SharedComponents --> TasksPagination["TasksPagination"]
ProjectTasksList --> ProjectContext["Project Context & State"]
```

**Diagram sources**
- [tasks-list-sections.tsx:57-253](file://Apps/Web/src/components/project-details-page/tasks-list-sections.tsx#L57-L253)
- [page.tsx:37-327](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx#L37-L327)

**Section sources**
- [tasks-list-sections.tsx:57-253](file://Apps/Web/src/components/project-details-page/tasks-list-sections.tsx#L57-L253)
- [page.tsx:37-327](file://Apps/Web/src/app/(protected)/projects/[projectSlug]/page.tsx#L37-L327)

### Kanban Board View
- Placeholder component exists; intended for drag-and-drop between columns representing statuses (Todo, InProgress, Done).
- Future implementation should:
  - Render columns per status.
  - Support drag-and-drop to update status via PATCH /api/tasks/{id}/status.
  - Provide optimistic UI updates and rollback on failure.
  - Integrate with real-time updates (see Real-time Updates section).

```mermaid
graph LR
ColTodo["Column: Todo"] --> Drop1["Drop card"]
ColInProgress["Column: InProgress"] --> Drop2["Drop card"]
ColDone["Column: Done"] --> Drop3["Drop card"]
Drop1 --> Patch["PATCH /api/tasks/{id}/status"]
Drop2 --> Patch
Drop3 --> Patch
```

**Diagram sources**
- [kanban-section.tsx:1-4](file://Apps/Web/src/components/tasks-page/kanban-section.tsx#L1-L4)
- [TasksController.cs:128-155](file://Services/Services.Api/Controllers/TasksController.cs#L128-L155)

**Section sources**
- [kanban-section.tsx:1-4](file://Apps/Web/src/components/tasks-page/kanban-section.tsx#L1-L4)

### Task Status Change Operations
- Endpoint: PATCH /api/tasks/{id}/status with body containing new status.
- Service flow: Validates identifiers, loads owned task, calls ChangeStatus, persists, returns updated response.
- Domain enforcement: Only valid enum values allowed; timestamp updated.

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant API as "TasksController"
participant SVC as "TaskService"
participant ENT as "TaskItem"
participant REP as "TaskRepository"
FE->>API : PATCH /api/tasks/{id}/status { status }
API->>SVC : ChangeStatusAsync(userId, id, status)
SVC->>SVC : GetOwnedTaskAsync()
SVC->>ENT : ChangeStatus(status)
ENT-->>SVC : Updated entity
SVC->>REP : UpdateAsync(task)
REP-->>SVC : Persisted
SVC-->>API : TaskResponse
API-->>FE : 200 OK
```

**Diagram sources**
- [TasksController.cs:128-155](file://Services/Services.Api/Controllers/TasksController.cs#L128-L155)
- [TaskService.cs:121-142](file://Services/Services.Application/Services/TaskService.cs#L121-L142)
- [TaskItem.cs:103-115](file://Services/Services.Domain/Entities/TaskItem.cs#L103-L115)
- [TaskRepository.cs:53-58](file://Services/Services.Infrastructure/Repositories/TaskRepository.cs#L53-L58)

**Section sources**
- [TasksController.cs:128-155](file://Services/Services.Api/Controllers/TasksController.cs#L128-L155)
- [TaskService.cs:121-142](file://Services/Services.Application/Services/TaskService.cs#L121-L142)
- [TaskItem.cs:103-115](file://Services/Services.Domain/Entities/TaskItem.cs#L103-L115)

### Advanced Features: Search, Filtering, Sorting, Pagination
- Query normalization: Enforces page >= 1, pageSize in [1,100], search length <= 200, valid status/priority enums, allowed sortBy fields, and sortDirection must be asc/desc.
- Filtering: By status and priority; search matches title substring.
- Sorting: By createdAt, title, dueDate, priority, status; null due dates handled appropriately.
- Pagination: Stable ordering using Id as tie-breaker; returns total count and computed totalPages.

**Updated** Enhanced with comprehensive query validation and normalization

```mermaid
flowchart TD
In["TaskQueryRequest"] --> Normalize["ValidateAndNormalizeQuery"]
Normalize --> Valid{"Valid?"}
Valid --> |No| Err["Throw ValidationException"]
Valid --> |Yes| Build["Build IQueryable with filters"]
Build --> Count["Count total matches"]
Count --> Order["Apply sorting and tie-breaker"]
Order --> Page["Skip/Take for pagination"]
Page --> Out["Return (items, totalCount)"]
```

**Diagram sources**
- [TaskService.cs:318-393](file://Services/Services.Application/Services/TaskService.cs#L318-L393)
- [TaskRepository.cs:82-157](file://Services/Services.Infrastructure/Repositories/TaskRepository.cs#L82-L157)

**Section sources**
- [TaskService.cs:160-187](file://Services/Services.Application/Services/TaskService.cs#L160-L187)
- [TaskService.cs:318-393](file://Services/Services.Application/Services/TaskService.cs#L318-L393)
- [TaskRepository.cs:82-157](file://Services/Services.Infrastructure/Repositories/TaskRepository.cs#L82-L157)

### Bulk Actions
- Current implementation supports single-task operations (edit, duplicate, delete).
- For bulk actions (e.g., multi-select and batch status change):
  - Extend frontend to collect selected IDs.
  - Implement backend endpoint(s) for batch status update or deletion.
  - Ensure authorization and ownership checks per item.
  - Return aggregated results and handle partial failures.

[No sources needed since this section provides general guidance]

### Real-time Updates
- Not implemented in the analyzed codebase.
- Recommended approaches:
  - Use Server-Sent Events (SSE) or WebSockets to push task updates to clients.
  - On successful mutations, invalidate or refetch affected lists.
  - For Kanban, apply optimistic updates and revert on error.
  - Consider broadcasting events scoped by userId and projectId.

[No sources needed since this section provides general guidance]

### Examples: Task Assignment, Deadline Management, Progress Tracking
- Task assignment:
  - Create or update tasks with optional ProjectId; service validates project ownership.
  - Response includes projectName and projectColor for display.
- Deadline management:
  - Set dueDate in form; displayed with localized formatting; sorting handles null due dates.
- Progress tracking:
  - Track status transitions via PATCH endpoint; reflect changes in list/Kanban views.

**Section sources**
- [TaskService.cs:250-274](file://Services/Services.Application/Services/TaskService.cs#L250-L274)
- [TaskResponse.cs:5-16](file://Services/Services.Application/DTOs/Tasks/TaskResponse.cs#L5-L16)
- [task-form.tsx:239-260](file://Apps/Web/src/components/tasks-page/task-form.tsx#L239-L260)
- [list-section.tsx:72-79](file://Apps/Web/src/components/tasks-page/list-section.tsx#L72-L79)

## Dependency Analysis
Key dependencies and relationships with enhanced project integration:
- TasksController depends on ITaskService for all operations.
- TaskService depends on ITaskRepository and domain models/enums with advanced query handling.
- TaskRepository depends on AppDbContext and EF Core for querying.
- Frontend components depend on API contracts and shared UI primitives.
- ProjectTasksList component integrates seamlessly with project detail pages.

```mermaid
classDiagram
class TasksController {
+Create(request)
+GetAll(query)
+GetById(id)
+Update(id, request)
+ChangeStatus(id, request)
+Delete(id)
}
class ITaskService {
<<interface>>
+CreateAsync(userId, request)
+GetAllAsync(userId, query)
+GetByIdAsync(userId, taskId)
+UpdateAsync(userId, taskId, request)
+ChangeStatusAsync(userId, taskId, request)
+DeleteAsync(userId, taskId)
+GetByProjectIdAsync(projectId, userId, query)
}
class TaskService {
+CreateAsync(...)
+GetAllAsync(...)
+GetByIdAsync(...)
+UpdateAsync(...)
+ChangeStatusAsync(...)
+DeleteAsync(...)
+GetByProjectIdAsync(...)
}
class ITaskRepository {
<<interface>>
+AddAsync(task)
+GetAllByUserIdAsync(userId)
+GetByIdAsync(taskId, userId)
+UpdateAsync(task)
+DeleteAsync(task)
+ProjectExistsAsync(projectId, userId)
+GetPagedByUserIdAsync(userId, query)
+GetPagedByProjectIdAsync(projectId, userId, query)
}
class TaskRepository {
+AddAsync(...)
+GetAllByUserIdAsync(...)
+GetByIdAsync(...)
+UpdateAsync(...)
+DeleteAsync(...)
+ProjectExistsAsync(...)
+GetPagedByUserIdAsync(...)
+GetPagedByProjectIdAsync(...)
}
class TaskItem {
+Id
+Title
+Description
+Status
+Priority
+DueDate
+UserId
+ProjectId
+CreatedAt
+UpdatedAt
+Create(...)
+UpdateDetails(...)
+ChangeStatus(...)
+AssignToProject(...)
}
class ProjectTasksList {
+tasks
+loading
+queryParams
+onEdit
+onDelete
+onSaved
+onQueryChange
+onPageChange
}
TasksController --> ITaskService : "uses"
TaskService ..|> ITaskService : "implements"
TaskService --> ITaskRepository : "uses"
TaskRepository ..|> ITaskRepository : "implements"
TaskService --> TaskItem : "creates/updates"
ProjectTasksList --> TasksController : "uses"
```

**Diagram sources**
- [TasksController.cs:11-199](file://Services/Services.Api/Controllers/TasksController.cs#L11-L199)
- [ITaskService.cs:6-49](file://Services/Services.Application/Interfaces/Services/ITaskService.cs#L6-L49)
- [TaskService.cs:12-412](file://Services/Services.Application/Services/TaskService.cs#L12-L412)
- [TaskRepository.cs:9-239](file://Services/Services.Infrastructure/Repositories/TaskRepository.cs#L9-L239)
- [TaskItem.cs:6-128](file://Services/Services.Domain/Entities/TaskItem.cs#L6-L128)
- [tasks-list-sections.tsx:57-253](file://Apps/Web/src/components/project-details-page/tasks-list-sections.tsx#L57-L253)

**Section sources**
- [TasksController.cs:11-199](file://Services/Services.Api/Controllers/TasksController.cs#L11-L199)
- [ITaskService.cs:6-49](file://Services/Services.Application/Interfaces/Services/ITaskService.cs#L6-L49)
- [TaskService.cs:12-412](file://Services/Services.Application/Services/TaskService.cs#L12-L412)
- [TaskRepository.cs:9-239](file://Services/Services.Infrastructure/Repositories/TaskRepository.cs#L9-L239)
- [TaskItem.cs:6-128](file://Services/Services.Domain/Entities/TaskItem.cs#L6-L128)
- [tasks-list-sections.tsx:57-253](file://Apps/Web/src/components/project-details-page/tasks-list-sections.tsx#L57-L253)

## Performance Considerations
- Use server-side pagination to limit payload size and improve rendering performance.
- Leverage AsNoTracking for read-only queries to reduce change tracker overhead.
- Include only necessary related data (Project) to avoid N+1 issues.
- Normalize and validate queries to prevent expensive or invalid operations.
- Debounce search inputs on the client to reduce network churn (300ms delay implemented).
- Consider indexing frequently filtered/sorted columns (title, status, priority, dueDate, createdAt) at the database level.
- Utilize efficient query composition in repository layer for complex filtering scenarios.

**Updated** Enhanced with debounced search implementation and improved query optimization

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Invalid status or priority:
  - Ensure enum values match defined constants; service throws ValidationException on invalid inputs.
- Project not found or unauthorized:
  - Verify project belongs to the authenticated user; service validates project existence before create/update.
- Pagination errors:
  - Ensure page >= 1 and pageSize within [1,100]; service normalizes and validates these parameters.
- Sorting errors:
  - Use allowed sortBy fields (createdAt, title, dueDate, priority, status) and valid sortDirection (asc/desc).
- Search length exceeded:
  - Keep search string <= 200 characters; otherwise, validation fails.
- Project-specific task loading issues:
  - Verify project ID is correctly passed to the API and user has access to the project.

**Updated** Added troubleshooting for project-specific task loading

**Section sources**
- [TaskService.cs:307-393](file://Services/Services.Application/Services/TaskService.cs#L307-L393)
- [TaskService.cs:250-274](file://Services/Services.Application/Services/TaskService.cs#L250-L274)

## Conclusion
The enhanced task management feature provides a robust foundation for creating, updating, and transitioning tasks through well-defined domain rules and validated API endpoints. The comprehensive list view offers advanced search, filtering, sorting, and pagination capabilities with debounced search functionality. The new project-specific task listing system seamlessly integrates with project detail pages, providing contextual task management. The Kanban board is currently a placeholder but can be extended with drag-and-drop and real-time updates. Following the recommended practices for validation, performance, and UX will ensure a smooth and scalable experience across all task management scenarios.

**Updated** Enhanced conclusion reflecting the comprehensive improvements made to the task management system

[No sources needed since this section summarizes without analyzing specific files]