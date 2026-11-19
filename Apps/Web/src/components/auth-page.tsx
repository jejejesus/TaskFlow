import Link from "next/link";
import { TaskDaily01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "@/components/auth-form";

export function AuthPage({ register = false }: { register?: boolean }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <HugeiconsIcon icon={TaskDaily01Icon} className="size-4" />
          </span>
          TaskFlow
        </Link>
        <Card>
          <CardHeader className={register ? undefined : "text-center"}>
            <CardTitle className={register ? undefined : "text-xl"}>
              {register ? "Crear cuenta" : "Bienvenide de vuelta"}
            </CardTitle>
            <CardDescription>
              {register ? "Llena los datos para crearte una cuenta" : "Inicia sesión con tu cuenta"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm register={register} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
