using Services.Domain.Enums;
using Services.Domain.ValueObjects;

namespace Services.Domain.Entities;

public sealed class TaskItem
{
    public Guid Id { get; private set; }
    public TaskTitle Title { get; private set; } = null!;
    public TaskDescription? Description { get; private set; }
    public TaskCurrentStatus Status { get; private set; }
    public TaskPriority Priority { get; private set; }
    public DateTimeOffset? DueDate { get; private set; }
    public Guid UserId { get; private set; }
    public Guid? ProjectId { get; private set; }

    public Project? Project { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private TaskItem()
    {
        // Constructor utilizado por Entity Framework Core.
    }

    private TaskItem(
        Guid userId,
        TaskTitle title,
        TaskDescription? description,
        TaskPriority priority,
        DateTimeOffset? dueDate,
        Guid? projectId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException(
                "El identificador del usuario es obligatorio.",
                nameof(userId));
        }

        Id = Guid.NewGuid();
        UserId = userId;
        Title = title;
        Description = description;
        Status = TaskCurrentStatus.Todo;
        Priority = priority;
        DueDate = dueDate;
        ProjectId = projectId;
        CreatedAt = DateTimeOffset.UtcNow;
        UpdatedAt = CreatedAt;
    }

    public static TaskItem Create(
        Guid userId,
        TaskTitle title,
        TaskDescription? description = null,
        TaskPriority priority = TaskPriority.Medium,
        DateTimeOffset? dueDate = null,
        Guid? projectId = null)
    {
        ArgumentNullException.ThrowIfNull(title);

        if (!Enum.IsDefined(priority))
        {
            throw new ArgumentOutOfRangeException(
                nameof(priority),
                "La prioridad no es válida.");
        }

        return new TaskItem(
            userId,
            title,
            description,
            priority,
            dueDate,
            projectId);
    }

    public void UpdateDetails(
        TaskTitle title,
        TaskDescription? description,
        TaskPriority priority,
        DateTimeOffset? dueDate)
    {
        ArgumentNullException.ThrowIfNull(title);

        if (!Enum.IsDefined(priority))
        {
            throw new ArgumentOutOfRangeException(
                nameof(priority),
                "La prioridad no es válida.");
        }

        Title = title;
        Description = description;
        Priority = priority;
        DueDate = dueDate;

        Touch();
    }

    public void ChangeStatus(TaskCurrentStatus status)
    {
        if (!Enum.IsDefined(status))
        {
            throw new ArgumentOutOfRangeException(
                nameof(status),
                "El estado no es válido.");
        }

        Status = status;

        Touch();
    }

    public void AssignToProject(Guid? projectId)
    {
        ProjectId = projectId;

        Touch();
    }

    private void Touch()
    {
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}