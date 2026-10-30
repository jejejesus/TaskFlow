import { TaskAllowedSortFields, TaskCurrentStatus, TaskPriority } from "../api/tasks";

export const statusLabels: Record<number, string> = {
  [TaskCurrentStatus.Todo]: "Pendiente",
  [TaskCurrentStatus.InProgress]: "En progreso",
  [TaskCurrentStatus.Done]: "Completada",
};

export const statusStyles: Record<number, string> = {
  [TaskCurrentStatus.Todo]: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  [TaskCurrentStatus.InProgress]: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  [TaskCurrentStatus.Done]: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  //[TaskCurrentStatus.Cancelled]: "bg-muted text-muted-foreground",
};

export const priorityLabels: Record<number, string> = {
  [TaskPriority.Low]: "Baja",
  [TaskPriority.Medium]: "Media",
  [TaskPriority.High]: "Alta",
  [TaskPriority.Urgent]: "Urgente",
};

export const priorityStyles: Record<number, string> = {
  [TaskPriority.Low]: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  [TaskPriority.Medium]: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  [TaskPriority.High]: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  [TaskPriority.Urgent]: "bg-red-500/10 text-red-700 dark:text-white-400",
};

export const taskSortFieldLabels: Record<number, string> = {
  [TaskAllowedSortFields.CreatedAt]: "Fecha de creación",
  [TaskAllowedSortFields.Title]: "Título",
  [TaskAllowedSortFields.DueDate]: "Fecha límite",
  [TaskAllowedSortFields.Priority]: "Prioridad",
  [TaskAllowedSortFields.Status]: "Estatus",
};