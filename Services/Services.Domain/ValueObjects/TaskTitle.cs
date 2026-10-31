namespace Services.Domain.ValueObjects;

public sealed record TaskTitle
{
    public const int MaxLength = 200;

    public string Value { get; }

    private TaskTitle(string value)
    {
        Value = value;
    }

    public static TaskTitle Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException(
                "El título de la tarea es obligatorio.",
                nameof(value));
        }

        var normalized = value.Trim();

        if (normalized.Length > MaxLength)
        {
            throw new ArgumentException(
                $"El título no puede superar los {MaxLength} caracteres.",
                nameof(value));
        }

        return new TaskTitle(normalized);
    }

    public override string ToString() => Value;
}