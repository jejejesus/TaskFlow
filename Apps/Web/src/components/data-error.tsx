import { ApiError } from "@/lib/api/helper";
import { SessionExpired } from "@/components/session-expired";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DataError({ error, title }: { error: unknown; title: string }) {
  if (error instanceof ApiError && error.status === 401) return <SessionExpired />;
  return (
    <Alert variant="destructive" className="max-w-md" role="alert">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {error instanceof ApiError ? error.message : "No se pudo conectar con el servidor."}
      </AlertDescription>
    </Alert>
  );
}
