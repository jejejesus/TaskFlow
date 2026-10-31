import { useEffect, useState } from "react";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Sorting01Icon, Sorting02Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Field, FieldLabel } from "../ui/field";
import { GetTasksQuery, TaskAllowedSortFields } from "@/lib/api/tasks";

type TaskQueryProps = {
  statusLabels: Record<number, string>;
  priorityLabels: Record<number, string>;
  orderByLabels: Record<number, string>;
  queryParams: GetTasksQuery;
  onQueryChange: (updates: Partial<GetTasksQuery>) => void;
};

export default function TaskQuery({
  statusLabels,
  priorityLabels,
  orderByLabels,
  queryParams,
  onQueryChange,
}: TaskQueryProps) {
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
          <PremadeSelect
            labels={statusLabels}
            addAll="Todos"
            value={queryParams.Status?.toString()}
            onValueChange={(v) =>
              onQueryChange({
                Status: v === undefined ? undefined : (Number(v) as GetTasksQuery["Status"]),
                Page: 1,
              })
            }
          />
        </ButtonGroup>
      </Field>

      <Field className="w-full max-w-48">
        <FieldLabel>Prioridad</FieldLabel>
        <ButtonGroup>
          <PremadeSelect
            labels={priorityLabels}
            addAll="Todas"
            value={queryParams.Priority?.toString()}
            onValueChange={(v) =>
              onQueryChange({
                Priority: v === undefined ? undefined : (Number(v) as GetTasksQuery["Priority"]),
                Page: 1,
              })
            }
          />
        </ButtonGroup>
      </Field>

      <Field className="w-full max-w-50">
        <FieldLabel>Ordenar por</FieldLabel>
        <ButtonGroup>
          <PremadeSelect
            labels={orderByLabels}
            value={queryParams.SortBy ?? undefined}
            onValueChange={(v) =>
              onQueryChange({
                SortBy: (v as TaskAllowedSortFields | undefined) ?? undefined,
                Page: 1,
              })
            }
          />
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

function PremadeSelect({
  labels,
  addAll,
  value,
  onValueChange,
}: {
  labels: Record<number, string>;
  addAll?: string;
  value?: string;
  onValueChange: (value: string | undefined) => void;
}) {
  const ALL_VALUE = "__all__";

  const selectLabels = Object.entries(labels).map(([key, label]) => ({
    value: key,
    label,
  }));

  if (addAll) {
    selectLabels.unshift({ value: ALL_VALUE, label: addAll });
  }

  const currentValue = value ?? (addAll ? ALL_VALUE : undefined);

  return (
    <Select
      value={currentValue}
      onValueChange={(v) => {
        onValueChange(v === ALL_VALUE || v === null ? undefined : v);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue>
          {(selected: string | undefined) =>
            selected === undefined || selected === ALL_VALUE
              ? addAll
              : (selectLabels.find((item) => item.value === selected)?.label ?? selected)
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger>
        <SelectGroup>
          {selectLabels.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
