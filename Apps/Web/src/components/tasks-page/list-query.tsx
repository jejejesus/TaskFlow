import { useEffect, useState } from "react";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Sorting01Icon, Sorting02Icon } from "@hugeicons/core-free-icons";
import {
  statusLabels,
  priorityLabels,
  taskSortFieldLabels,
} from "@/lib/util-constants/tasks-constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Field, FieldLabel } from "@/components/ui/field";
import { GetTasksQuery } from "@/lib/api/tasks";

const ALL_VALUE = "all";

export default function TaskQuery({
  queryParams,
  onQueryChange,
}: {
  queryParams: GetTasksQuery;
  onQueryChange: (updates: Partial<GetTasksQuery>) => void;
}) {
  const [searchInput, setSearchInput] = useState(queryParams.Search ?? "");

  useEffect(() => {
    setSearchInput(queryParams.Search ?? "");
  }, [queryParams.Search]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if ((queryParams.Search ?? "") !== searchInput) {
        onQueryChange({ Search: searchInput || undefined, Page: 1 });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const triggerSearchNow = () => {
    onQueryChange({ Search: searchInput || undefined, Page: 1 });
  };

  const ascDesc = queryParams.SortDirection ?? "asc";

  const toggleAscDesc = () => {
    onQueryChange({
      SortDirection: ascDesc === "asc" ? "desc" : "asc",
      Page: 1,
    });
  };

  // Valores actuales como string para los Select (o "all" si no hay filtro)
  const statusValue = queryParams.Status !== undefined ? String(queryParams.Status) : ALL_VALUE;
  const priorityValue =
    queryParams.Priority !== undefined ? String(queryParams.Priority) : ALL_VALUE;
  const sortByValue = queryParams.SortBy ?? undefined;

  return (
    <div className="flex gap-2">
      <Field className="w-full max-w-72">
        <FieldLabel>Buscar</FieldLabel>
        <ButtonGroup>
          <Input
            placeholder="Buscar..."
            className="w-full"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") triggerSearchNow();
            }}
          />
          <Button variant="outline" aria-label="Buscar" onClick={triggerSearchNow}>
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          </Button>
        </ButtonGroup>
      </Field>

      <Field className="w-full max-w-48">
        <FieldLabel>Estatus</FieldLabel>
        <ButtonGroup>
          <Select
            value={statusValue}
            onValueChange={(value) => {
              onQueryChange({
                Status: value === ALL_VALUE ? undefined : Number(value),
                Page: 1,
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos">
                {(value: string) =>
                  value === ALL_VALUE ? "Todos" : (statusLabels[Number(value)] ?? "Todos")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger>
              <SelectGroup>
                <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </ButtonGroup>
      </Field>

      <Field className="w-full max-w-48">
        <FieldLabel>Prioridad</FieldLabel>
        <ButtonGroup>
          <Select
            value={priorityValue}
            onValueChange={(value) => {
              onQueryChange({
                Priority: value === ALL_VALUE ? undefined : Number(value),
                Page: 1,
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas">
                {(value: string) =>
                  value === ALL_VALUE ? "Todas" : (priorityLabels[Number(value)] ?? "Todas")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger>
              <SelectGroup>
                <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                {Object.entries(priorityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </ButtonGroup>
      </Field>

      <Field className="w-full max-w-60">
        <FieldLabel>Ordenar por</FieldLabel>
        <ButtonGroup>
          <Select
            value={sortByValue}
            onValueChange={(value) => {
              onQueryChange({ SortBy: value as any, Page: 1 });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Fecha de creación">
                {(value: string) => taskSortFieldLabels[value]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger>
              <SelectGroup>
                {Object.entries(taskSortFieldLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={ascDesc === "asc" ? "Orden ascendente" : "Orden descendente"}
                  onClick={toggleAscDesc}
                >
                  <HugeiconsIcon
                    icon={ascDesc === "asc" ? Sorting02Icon : Sorting01Icon}
                    strokeWidth={2}
                  />
                </Button>
              }
            />
            <TooltipContent>
              <p>{ascDesc === "asc" ? "Mayor a menor" : "Menor a mayor"}</p>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </Field>
    </div>
  );
}
