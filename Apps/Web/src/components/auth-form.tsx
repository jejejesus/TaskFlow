"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, signupAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function AuthForm({ register = false }: { register?: boolean }) {
  const [state, action, pending] = useActionState(register ? signupAction : loginAction, null);
  const [clientError, setClientError] = useState<string | null>(null);
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    setClientError(null);
    if (!register) return;
    const form = event.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirmation = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
    if (password !== confirmation) {
      event.preventDefault();
      setClientError("Las contraseñas no coinciden.");
    }
  }
  return (
    <form action={action} onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <Button variant="outline" type="button" disabled={pending}>
            {register ? "Registrarse" : "Iniciar sesión"} con Apple
          </Button>
          <Button variant="outline" type="button" disabled={pending}>
            {register ? "Registrarse" : "Iniciar sesión"} con Google
          </Button>
        </Field>
        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
          O continúa con
        </FieldSeparator>
        {(clientError || state?.error) && (
          <div
            role="alert"
            className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-center text-sm font-medium text-destructive"
          >
            {clientError || state?.error}
          </div>
        )}
        <Field>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            disabled={pending}
            autoComplete="email"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={pending}
            autoComplete={register ? "new-password" : "current-password"}
          />
        </Field>
        {register && (
          <Field>
            <FieldLabel htmlFor="confirm-password">Confirmar contraseña</FieldLabel>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              required
              disabled={pending}
              autoComplete="new-password"
            />
          </Field>
        )}
        <Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending
              ? register
                ? "Creando cuenta..."
                : "Iniciando sesión..."
              : register
                ? "Registrarse"
                : "Iniciar sesión"}
          </Button>
          <FieldDescription className="text-center">
            {register ? "¿Ya tienes una cuenta? " : "¿No tienes una cuenta? "}
            <Link
              href={register ? "/login" : "/register"}
              className="underline underline-offset-4 hover:text-primary"
            >
              {register ? "inicia sesión" : "regístrate"}
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
