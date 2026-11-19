"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import ProjectFormDialog from "@/components/projects-page/project-form";
import ProjectsList from "@/components/projects-page/list-section";
import type { ProjectResponse } from "@/lib/api/projects";

export function ProjectsWorkspace({ projects }: { projects: ProjectResponse[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectResponse | null>(null);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <HugeiconsIcon icon={Add01Icon} />
          Crear proyecto
        </Button>
      </div>
      <ProjectFormDialog
        key={editing?.id ?? "new"}
        open={open}
        onOpenChange={setOpen}
        project={editing}
        onSaved={() => router.refresh()}
      />
      <ProjectsList
        projects={projects}
        onEdit={(project) => {
          setEditing(project);
          setOpen(true);
        }}
        onDelete={() => router.refresh()}
      />
    </div>
  );
}
