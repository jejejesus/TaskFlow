"use client";

import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ListChecksIcon,
  CircleCheckIcon,
  Clock01Icon,
  FolderKanbanIcon,
} from "@hugeicons/core-free-icons";
import { Skeleton } from "../ui/skeleton";

type SummaryCounts = {
  total: number;
  completed: number;
  pending: number;
};

type SummaryProps = {
  counts: SummaryCounts;
  projectCount: number;
  loading?: boolean;
};

export function Summary({ counts, projectCount, loading = false }: SummaryProps) {
  const items = [
    {
      label: "Total de tareas",
      value: counts.total,
      note: "Tareas registradas",
      icon: ListChecksIcon,
      color: "#CF9FFF",
    },
    {
      label: "Completadas",
      value: counts.completed,
      note: "Tareas finalizadas",
      icon: CircleCheckIcon,
      color: "#0BDA51",
    },
    {
      label: "Pendientes",
      value: counts.pending,
      note: "Por completar",
      icon: Clock01Icon,
      color: "#FFBF00",
    },
    {
      label: "Proyectos",
      value: projectCount,
      note: "Proyectos creados",
      icon: FolderKanbanIcon,
      color: "#5F9EA0",
    },
  ];

  return (
    <section aria-label="Resumen" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader>
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {loading ? <Skeleton className="h-6 w-15" /> : item.value.toLocaleString("es-MX")}
            </CardTitle>
            <CardAction>
              <HugeiconsIcon icon={item.icon} strokeWidth={2} color={item.color} />
            </CardAction>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">{item.note}</CardFooter>
        </Card>
      ))}
    </section>
  );
}
