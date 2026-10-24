"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

if (process.env.NODE_ENV !== "production") {
  // Allow self-signed certificates in local development (e.g. ASP.NET dev certs)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export type AuthActionState = {
  success?: boolean;
  error?: string | null;
  fieldErrors?: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
};

function getApiEndpoint(endpoint: "login" | "register" | "logout"): string {
  const rawBase = process.env.API_BASE_URL || "https://localhost:7120/api";
  const cleanBase = rawBase.replace(/\/+$/, "");
  const baseWithApi = cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;
  return `${baseWithApi}/auth/${endpoint}`;
}

async function setAuthCookies(token: string, expiresAtString?: string) {
  const cookieStore = await cookies();
  const expires = expiresAtString
    ? new Date(expiresAtString)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };

  cookieStore.set("auth_token", token, cookieOptions);
}

export async function loginAction(
  prevStateOrFormData: AuthActionState | FormData | null,
  formDataMaybe?: FormData
): Promise<AuthActionState> {
  const formData =
    prevStateOrFormData instanceof FormData
      ? prevStateOrFormData
      : formDataMaybe;

  if (!formData) {
    return { success: false, error: "Datos del formulario no válidos." };
  }

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return {
      success: false,
      error: "Por favor, ingresa tu correo y contraseña.",
    };
  }

  let shouldRedirect = false;

  try {
    const response = await fetch(getApiEndpoint("login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // Solo se envía email y password
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        data?.error ||
        data?.title ||
        (response.status === 401
          ? "Correo electrónico o contraseña incorrectos."
          : "Error al iniciar sesión.");
      return { success: false, error: errorMessage };
    }

    const token = data?.accessToken || data?.AccessToken || data?.token || data?.jwt;
    if (!token) {
      return {
        success: false,
        error: "No se recibió un token de autenticación válido.",
      };
    }

    await setAuthCookies(token, data?.expiresAt || data?.ExpiresAt);
    shouldRedirect = true;
  } catch (error) {
    console.error("Error en loginAction:", error);
    return {
      success: false,
      error: "No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.",
    };
  }

  if (shouldRedirect) {
    redirect("/");
  }

  return { success: true };
}

export async function signupAction(
  prevStateOrFormData: AuthActionState | FormData | null,
  formDataMaybe?: FormData
): Promise<AuthActionState> {
  const formData =
    prevStateOrFormData instanceof FormData
      ? prevStateOrFormData
      : formDataMaybe;

  if (!formData) {
    return { success: false, error: "Datos del formulario no válidos." };
  }

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password) {
    return {
      success: false,
      error: "Por favor, completa todos los campos requeridos.",
    };
  }

  if (confirmPassword !== undefined && confirmPassword !== null && password !== confirmPassword) {
    return {
      success: false,
      error: "Las contraseñas no coinciden.",
    };
  }

  let shouldRedirect = false;

  try {
    const response = await fetch(getApiEndpoint("register"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // Solo se envía email y password
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      let errorMessage = data?.error;
      if (!errorMessage && data?.errors) {
        errorMessage = Object.values(data.errors).flat().join(" ");
      }
      return {
        success: false,
        error: errorMessage || "Error al crear la cuenta. Inténtalo de nuevo.",
      };
    }

    const token = data?.accessToken || data?.AccessToken || data?.token || data?.jwt;
    if (!token) {
      return {
        success: false,
        error: "No se recibió un token de autenticación válido.",
      };
    }

    await setAuthCookies(token, data?.expiresAt || data?.ExpiresAt);
    shouldRedirect = true;
  } catch (error) {
    console.error("Error en signupAction:", error);
    return {
      success: false,
      error: "No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.",
    };
  }

  if (shouldRedirect) {
    redirect("/");
  }

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value;
}
