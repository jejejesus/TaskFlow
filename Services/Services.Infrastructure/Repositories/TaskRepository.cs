using Microsoft.EntityFrameworkCore;
using Services.Application.DTOs.Tasks;
using Services.Application.Interfaces.Repositories;
using Services.Domain.Entities;
using Services.Infrastructure.Persistence;

namespace Services.Infrastructure.Repositories;

public sealed class TaskRepository(
    AppDbContext dbContext
) : ITaskRepository
{
    public async Task AddAsync(
        TaskItem task,
        CancellationToken cancellationToken = default)
    {
        await dbContext.Tasks.AddAsync(task, cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
        await dbContext.Entry(task)
            .Reference(item => item.Project)
            .LoadAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TaskItem>> GetAllByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Tasks
            .AsNoTracking()
            .Include(task => task.Project)
            .Where(task => task.UserId == userId)
            .OrderBy(task => task.DueDate == null)
            .ThenBy(task => task.DueDate)
            .ThenByDescending(task => task.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<TaskItem?> GetByIdAsync(
        Guid taskId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Tasks
            .Include(task => task.Project)
            .FirstOrDefaultAsync(
                task => task.Id == taskId
                    && task.UserId == userId,
                cancellationToken
            );
    }

    public async Task UpdateAsync(
        TaskItem task,
        CancellationToken cancellationToken = default)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(
        TaskItem task,
        CancellationToken cancellationToken = default)
    {
        dbContext.Tasks.Remove(task);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ProjectExistsAsync(
        Guid projectId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Projects
            .AnyAsync(
                project => project.Id == projectId
                    && project.UserId == userId,
                cancellationToken
            );
    }

    public async Task<(IReadOnlyList<TaskItem> Items, int TotalCount)> GetPagedByUserIdAsync(
        Guid userId,
        TaskQueryRequest query,
        CancellationToken cancellationToken = default)
    {
        IQueryable<TaskItem> tasks = dbContext.Tasks
            .AsNoTracking()
            .Include(task => task.Project)
            .Where(task => task.UserId == userId);

        // Filtro por estado.
        if (query.Status.HasValue)
        {
            tasks = tasks.Where(
                task => task.Status == query.Status.Value
            );
        }

        // Filtro por prioridad.
        if (query.Priority.HasValue)
        {
            tasks = tasks.Where(
                task => task.Priority == query.Priority.Value
            );
        }

        // Búsqueda por título.
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();

            tasks = tasks.Where(
                task => task.Title.Value.Contains(search)
            );
        }

        // Total de coincidencias antes de paginar.
        var totalCount = await tasks.CountAsync(cancellationToken);

        // Ordenamiento.
        tasks = query.SortBy.ToLowerInvariant() switch
        {
            "title" => query.SortDirection == "asc"
                ? tasks.OrderBy(task => task.Title.Value)
                : tasks.OrderByDescending(task => task.Title.Value),

            "duedate" => query.SortDirection == "asc"
                ? tasks.OrderBy(task => task.DueDate == null)
                    .ThenBy(task => task.DueDate)
                : tasks.OrderBy(task => task.DueDate == null)
                    .ThenByDescending(task => task.DueDate),

            "priority" => query.SortDirection == "asc"
                ? tasks.OrderBy(task => task.Priority)
                : tasks.OrderByDescending(task => task.Priority),

            "status" => query.SortDirection == "asc"
                ? tasks.OrderBy(task => task.Status)
                : tasks.OrderByDescending(task => task.Status),

            _ => query.SortDirection == "asc"
                ? tasks.OrderBy(task => task.CreatedAt)
                : tasks.OrderByDescending(task => task.CreatedAt)
        };

        // Desempate para conseguir una paginación más estable.
        tasks = ((IOrderedQueryable<TaskItem>)tasks)
            .ThenBy(task => task.Id);

        var items = await tasks
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<(IReadOnlyList<TaskItem> Items, int TotalCount)> GetPagedByProjectIdAsync(
        Guid projectId,
        Guid userId,
        TaskQueryRequest query,
        CancellationToken cancellationToken = default)
    {
        IQueryable<TaskItem> tasks = dbContext.Tasks
            .AsNoTracking()
            .Include(task => task.Project)
            .Where(task =>
                task.UserId == userId &&
                task.ProjectId == projectId);

        // Filtro por estado.
        if (query.Status.HasValue)
        {
            tasks = tasks.Where(
                task => task.Status == query.Status.Value
            );
        }

        // Filtro por prioridad.
        if (query.Priority.HasValue)
        {
            tasks = tasks.Where(
                task => task.Priority == query.Priority.Value
            );
        }

        // Búsqueda por título.
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();

            tasks = tasks.Where(
                task => task.Title.Value.Contains(search)
            );
        }

        // Total de coincidencias antes de paginar.
        var totalCount = await tasks.CountAsync(cancellationToken);

        // Ordenamiento.
        tasks = query.SortBy.ToLowerInvariant() switch
        {
            "title" => query.SortDirection == "asc"
                ? tasks.OrderBy(task => task.Title.Value)
                : tasks.OrderByDescending(task => task.Title.Value),

            "duedate" => query.SortDirection == "asc"
                ? tasks.OrderBy(task => task.DueDate == null)
                    .ThenBy(task => task.DueDate)
                : tasks.OrderBy(task => task.DueDate == null)
                    .ThenByDescending(task => task.DueDate),

            "priority" => query.SortDirection == "asc"
                ? tasks.OrderBy(task => task.Priority)
                : tasks.OrderByDescending(task => task.Priority),

            "status" => query.SortDirection == "asc"
                ? tasks.OrderBy(task => task.Status)
                : tasks.OrderByDescending(task => task.Status),

            _ => query.SortDirection == "asc"
                ? tasks.OrderBy(task => task.CreatedAt)
                : tasks.OrderByDescending(task => task.CreatedAt)
        };

        // Desempate para conseguir una paginación más estable.
        tasks = ((IOrderedQueryable<TaskItem>)tasks)
            .ThenBy(task => task.Id);

        var items = await tasks
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}
