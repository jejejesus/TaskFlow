"use client";

import { useEffect, useState } from "react";

export function LocalDate({ value }: { value: string | null }) {
  const [display, setDisplay] = useState<{ value: string; label: string } | null>(null);
  useEffect(() => {
    if (!value) return;
    const date = new Date(value);
    setDisplay({
      value,
      label: Number.isNaN(date.getTime())
        ? "Fecha inválida"
        : new Intl.DateTimeFormat("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(date),
    });
  }, [value]);
  if (!value) return <>Sin fecha límite</>;
  return <time dateTime={value}>{display?.value === value ? display.label : "…"}</time>;
}
