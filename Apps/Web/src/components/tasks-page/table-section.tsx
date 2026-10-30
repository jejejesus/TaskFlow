
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { TaskRemove01Icon, MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { statusLabels, statusStyles, priorityLabels, priorityStyles } from "@/lib/util-constants/tasks-constants";
import { TaskResponse } from "@/lib/api/tasks";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../ui/empty";
import { Spinner } from "../ui/spinner";

function formatDate(value: string | null) {
    if (!value) return "Sin fecha límite";
    return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

type TasksTableProps = {
    tasks: TaskResponse[];
    loading?: boolean;
};

export default function TasksTable({ tasks, loading = false }: TasksTableProps) {

    if (!loading && tasks.length <= 0)
        return <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <HugeiconsIcon icon={TaskRemove01Icon} strokeWidth={2} />
                </EmptyMedia>
                <EmptyTitle>Aún no tienes tareas</EmptyTitle>
                <EmptyDescription>
                    No has creado o no te han asignado tareas todavía. Inicia creando una tarea o un proyecto.
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
                <Button>Crear tarea</Button>
                <Button variant="outline">Crear proyecto</Button>
            </EmptyContent>
        </Empty>
    else if (loading && tasks.length <= 0)
        return <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Spinner />
                </EmptyMedia>
                <EmptyTitle>Cargando tareas...</EmptyTitle>
            </EmptyHeader>
        </Empty>

    return <section>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Tarea</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tasks.map((task) =>
                    <TableRow key={task.id}>
                        <>{console.log(task)}</>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>
                            <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: task.projectColor || "" }}>
                                {task.projectName}
                            </span>
                        </TableCell>
                        <TableCell>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[task.status] ?? "bg-muted text-muted-foreground"}`}>
                                {statusLabels[task.status] ?? "Desconocido"}
                            </span>
                        </TableCell>
                        <TableCell>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyles[task.priority] ?? "bg-muted text-muted-foreground"}`}>
                                {priorityLabels[task.priority] ?? "Desconocido"}
                            </span>
                        </TableCell>
                        <TableCell>{formatDate(task.dueDate)}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8"><HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} /><span className="sr-only">Open menu</span></Button>} />
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Editar</DropdownMenuItem>
                                    <DropdownMenuItem>Duplicar</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive">
                                        Borrar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>)}
            </TableBody>
        </Table>
    </section>
}