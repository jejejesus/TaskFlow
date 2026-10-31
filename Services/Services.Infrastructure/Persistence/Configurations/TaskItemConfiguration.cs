using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Services.Domain.Entities;
using Services.Domain.ValueObjects;

namespace Services.Infrastructure.Persistence.Configurations;

public sealed class TaskItemConfiguration
    : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("Tasks");

        builder.HasKey(task => task.Id);

        builder.Property(task => task.Id)
            .ValueGeneratedNever();

        builder.ComplexProperty(task => task.Title, titleBuilder =>
        {
            titleBuilder.Property(t => t.Value)
                .HasColumnName("Title")
                .HasMaxLength(TaskTitle.MaxLength)
                .IsRequired();
        });

        builder.Property(task => task.Description)
            .HasConversion(
                description => description == null
                    ? null
                    : description.Value,
                value => value == null
                    ? null
                    : TaskDescription.Create(value))
            .HasMaxLength(TaskDescription.MaxLength);

        builder.Property(task => task.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(task => task.Priority)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(task => task.DueDate);

        builder.Property(task => task.UserId)
            .IsRequired();

        builder.Property(task => task.ProjectId);

        builder.Property(task => task.CreatedAt)
            .IsRequired();

        builder.Property(task => task.UpdatedAt)
            .IsRequired();

        builder.HasIndex(task => task.UserId);
        builder.HasIndex(task => new
        {
            task.UserId,
            task.Status
        });

        builder.HasOne(task => task.Project)
            .WithMany(project => project.Tasks)
            .HasForeignKey(task => task.ProjectId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}