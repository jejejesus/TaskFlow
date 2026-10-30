import { useState } from "react";
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

type SearchFilterProps = {
  statusLabels: Record<number, string>;
  priorityLabels: Record<number, string>;
  orderByLabels: Record<number, string>;
};

export default function SearchFilter({
  statusLabels,
  priorityLabels,
  orderByLabels,
}: SearchFilterProps) {
  const [ascDesc, setAscDesc] = useState<"ASC" | "DESC">("ASC");

  const toggleAscDesc = () => {
    setAscDesc((prev) => (prev === "ASC" ? "DESC" : "ASC"));
  };

  return (
    <div className="flex gap-2">
      <Field className="w-full max-w-72">
        <FieldLabel>Buscar</FieldLabel>
        <ButtonGroup>
          <Input placeholder="Buscar..." className="w-full" />
          <Button variant="outline" aria-label="Buscar">
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          </Button>
        </ButtonGroup>
      </Field>
      <Field className="w-full max-w-48">
        <FieldLabel>Estatus</FieldLabel>
        <ButtonGroup>
          <PremadeSelect placeholder="Estatus" labels={statusLabels} addAll />
        </ButtonGroup>
      </Field>
      <Field className="w-full max-w-48">
        <FieldLabel>Prioridad</FieldLabel>
        <ButtonGroup>
          <PremadeSelect placeholder="Prioridad" labels={priorityLabels} addAll />
        </ButtonGroup>
      </Field>
      <Field className="w-full max-w-50">
        <FieldLabel>Ordenar por</FieldLabel>
        <ButtonGroup>
          <PremadeSelect placeholder="Ordenar por" labels={orderByLabels} />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={ascDesc === "ASC" ? "Orden ascendente" : "Orden descendente"}

                  onClick={toggleAscDesc}
                >
                  <HugeiconsIcon
                    icon={ascDesc === "ASC" ? Sorting02Icon : Sorting01Icon}
                    strokeWidth={2}
                  />
                </Button>
              }
            />
            <TooltipContent>
              <p>{ascDesc === "ASC" ? "Mayor a menor" : "Menor a mayor"}</p>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </Field>
    </div>
  );
}

function PremadeSelect({
  placeholder,
  labels,
  addAll = false,
}: {
  placeholder: string;
  labels: Record<number, string>;
  addAll?: boolean;
}) {
  let selectLabels = Object.entries(labels).map(([key, label]) => ({
    value: key,
    label,
  }));

  if (addAll) selectLabels = [{ value: "all", label: "Todos" }, ...selectLabels];

  return (
    <>
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {(selected: string | undefined) =>
              selected === undefined
                ? placeholder
                : (selectLabels.find((item) => item.value === selected)?.label ?? selected)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {selectLabels.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}
