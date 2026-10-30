using Services.Application.DTOs;
using Services.Application.DTOs.Tasks;
using Services.Application.Interfaces.Repositories;
using Services.Application.Interfaces.Services;
using Services.Domain.Entities;
using Services.Domain.Enums;
using Services.Domain.ValueObjects;
using System.ComponentModel.DataAnnotations;

namespace Services.Application.Services;

public sealed class TaskService(
    ITaskRepository taskRepository
) : ITaskService
{
    public async Task<TaskResponse> CreateAsync(
        Guid userId,
        CreateTaskRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        ValidateUserId(userId);

        var title = TaskTitle.Create(request.Title);
        var description = CreateDescription(request.Description);

        ValidatePriority(request.Priority);

        await ValidateProjectAsync(
            request.ProjectId,
            userId,
            cancellationToken
        );

        var task = TaskItem.Create(
            userId: userId,
            title: title,
            description: description,
            priority: request.Priority,
            dueDate: request.DueDate,
            projectId: request.ProjectId
        );

        await taskRepository.AddAsync(task, cancellationToken);

        return MapToResponse(task);
    }

    public async Task<IReadOnlyList<TaskResponse>> GetAllAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        var tasks = await taskRepository.GetAllByUserIdAsync(
            userId,
            cancellationToken
        );

        return tasks.Select(MapToResponse).ToList();
    }

    public async Task<TaskResponse> GetByIdAsync(
        Guid userId,
        Guid taskId,
        CancellationToken cancellationToken = default)
    {
        ValidateIdentifiers(userId, taskId);

        var task = await GetOwnedTaskAsync(
            userId,
            taskId,
            cancellationToken
        );

        return MapToResponse(task);
    }

    public async Task<TaskResponse> UpdateAsync(
        Guid userId,
        Guid taskId,
        UpdateTaskRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        ValidateIdentifiers(userId, taskId);

        var task = await GetOwnedTaskAsync(
            userId,
            taskId,
            cancellationToken
        );

        var title = TaskTitle.Create(request.Title);
        var description = CreateDescription(request.Description);

        ValidatePriority(request.Priority);

        await ValidateProjectAsync(
            request.ProjectId,
            userId,
            cancellationToken
        );

        task.UpdateDetails(
            title,
            description,
            request.Priority,
            request.DueDate
        );

        task.AssignToProject(request.ProjectId);

        await taskRepository.UpdateAsync(task, cancellationToken);

        return MapToResponse(task);
    }

    public async Task<TaskResponse> ChangeStatusAsync(
        Guid userId,
        Guid taskId,
        ChangeTaskStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        ValidateIdentifiers(userId, taskId);

        var task = await GetOwnedTaskAsync(
            userId,
            taskId,
            cancellationToken
        );

        task.ChangeStatus(request.Status);

        await taskRepository.UpdateAsync(task, cancellationToken);

        return MapToResponse(task);
    }

    public async Task DeleteAsync(
        Guid userId,
        Guid taskId,
        CancellationToken cancellationToken = default)
    {
        ValidateIdentifiers(userId, taskId);

        var task = await GetOwnedTaskAsync(
            userId,
            taskId,
            cancellationToken
        );

        await taskRepository.DeleteAsync(task, cancellationToken);
    }

    public async Task<PagedResponse<TaskResponse>> GetAllAsync(
        Guid userId,
        TaskQueryRequest query,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);

        ValidateUserId(userId);

        var normalizedQuery = ValidateAndNormalizeQuery(query);

        var (items, totalCount) = await taskRepository.GetPagedByUserIdAsync(
                userId,
                normalizedQuery,
                cancellationToken);

        var totalPages = (int)Math.Ceiling(
            totalCount / (double)query.PageSize
        );

        return new PagedResponse<TaskResponse>(
            Items: items.Select(MapToResponse).ToList(),
            Page: query.Page,
            PageSize: query.PageSize,
            TotalCount: totalCount,
            TotalPages: totalPages
        );
    }

    public async Task<PagedResponse<TaskResponse>> GetByProjectIdAsync(
    Guid userId,
    Guid projectId,
    TaskQueryRequest query,
    CancellationToken cancellationToken = default)
    {
        ValidateUserId(userId);

        if (projectId == Guid.Empty)
        {
            throw new ValidationException(
                "El identificador del proyecto no es válido.");
        }

        var normalizedQuery = ValidateAndNormalizeQuery(query);

        var projectExists = await taskRepository.ProjectExistsAsync(
            projectId,
            userId,
            cancellationToken);

        if (!projectExists)
        {
            throw new KeyNotFoundException(
                "El proyecto no existe o no pertenece al usuario.");
        }

        var (items, totalCount) =
            await taskRepository.GetPagedByProjectIdAsync(
                projectId,
                userId,
                normalizedQuery,
                cancellationToken);

        var totalPages = (int)Math.Ceiling(
            totalCount / (double)normalizedQuery.PageSize);

        return new PagedResponse<TaskResponse>(
            Items: items.Select(MapToResponse).ToList(),
            Page: normalizedQuery.Page,
            PageSize: normalizedQuery.PageSize,
            TotalCount: totalCount,
            TotalPages: totalPages);
    }

    private async Task<TaskItem> GetOwnedTaskAsync(
        Guid userId,
        Guid taskId,
        CancellationToken cancellationToken)
    {
        var task = await taskRepository.GetByIdAsync(
            taskId,
            userId,
            cancellationToken
        );

        return task ?? throw new KeyNotFoundException(
            "La tarea no existe."
        );
    }

    private async Task ValidateProjectAsync(
    Guid? projectId,
    Guid userId,
    CancellationToken cancellationToken)
    {
        if (!projectId.HasValue)
            return;

        if (projectId.Value == Guid.Empty)
        {
            throw new ValidationException(
                "El identificador del proyecto no es válido.");
        }

        var exists = await taskRepository.ProjectExistsAsync(
            projectId.Value,
            userId,
            cancellationToken);

        if (!exists)
        {
            throw new KeyNotFoundException(
                "El proyecto no existe o no pertenece al usuario.");
        }
    }



    private static TaskDescription? CreateDescription(string? description)
    {
        return string.IsNullOrWhiteSpace(description)
            ? null
            : TaskDescription.Create(description);
    }

    private static void ValidateUserId(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ValidationException(
                "El identificador del usuario no es válido."
            );
        }
    }

    private static void ValidateIdentifiers(Guid userId, Guid taskId)
    {
        ValidateUserId(userId);

        if (taskId == Guid.Empty)
        {
            throw new ValidationException(
                "El identificador de la tarea no es válido."
            );
        }
    }

    private static void ValidatePriority(
        TaskPriority priority)
    {
        if (!Enum.IsDefined(priority))
        {
            throw new ValidationException(
                "La prioridad indicada no es válida."
            );
        }
    }

    private static TaskQueryRequest ValidateAndNormalizeQuery(
    TaskQueryRequest query)
    {
        ArgumentNullException.ThrowIfNull(query);

        if (query.Page < 1)
        {
            throw new ValidationException(
                "La página debe ser mayor o igual a 1.");
        }

        if (query.PageSize < 1 || query.PageSize > 100)
        {
            throw new ValidationException(
                "El tamaño de página debe estar entre 1 y 100.");
        }

        if (!string.IsNullOrWhiteSpace(query.Search)
            && query.Search.Trim().Length > 200)
        {
            throw new ValidationException(
                "La búsqueda no puede superar los 200 caracteres.");
        }

        if (query.Status.HasValue
            && !Enum.IsDefined(query.Status.Value))
        {
            throw new ValidationException(
                "El estado indicado no es válido.");
        }

        if (query.Priority.HasValue
            && !Enum.IsDefined(query.Priority.Value))
        {
            throw new ValidationException(
                "La prioridad indicada no es válida.");
        }

        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        var allowedSortFields = new[]
        {
            "createdat",
            "title",
            "duedate",
            "priority",
            "status"
        };

        if (string.IsNullOrWhiteSpace(sortBy)
            || !allowedSortFields.Contains(sortBy))
        {
            throw new ValidationException(
                "El campo de ordenamiento no es válido.");
        }

        var sortDirection = query.SortDirection?
            .Trim()
            .ToLowerInvariant();

        if (sortDirection is not ("asc" or "desc"))
        {
            throw new ValidationException(
                "La dirección debe ser 'asc' o 'desc'.");
        }

        return query with
        {
            Search = string.IsNullOrWhiteSpace(query.Search)
                ? null
                : query.Search.Trim(),

            SortBy = sortBy,
            SortDirection = sortDirection
        };
    }

    private static TaskResponse MapToResponse(TaskItem task)
    {
        return new TaskResponse(
            Id: task.Id,
            Title: task.Title.Value,
            Description: task.Description?.Value,
            Status: task.Status,
            Priority: task.Priority,
            DueDate: task.DueDate,
            ProjectId: task.ProjectId,
            ProjectName: task.Project?.Name.Value,
            ProjectColor: task.Project?.Color,
            CreatedAt: task.CreatedAt,
            UpdatedAt: task.UpdatedAt
        );
    }
}
