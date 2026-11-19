"use client";

import { logoutAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";

export function SessionExpired() {
  return (
    <div className="space-y-2">
      <p>Tu sesión ha expirado. Inicia sesión nuevamente.</p>
      <Button type="button" variant="outline" onClick={() => void logoutAction()}>
        Iniciar sesión
      </Button>
    </div>
  );
}
