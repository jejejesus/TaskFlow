using Services.Domain.Enums;

namespace Services.Application.DTOs.Tasks;

public sealed record TaskResponse(
    Guid Id,
    string Title,
    string? Description,
    TaskCurrentStatus Status,
    TaskPriority Priority,
    DateTimeOffset? DueDate,
    Guid? ProjectId,
    string? ProjectName,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);