import "server-only";
import { Agent } from "undici";

// ASP.NET development certificates may not be trusted by Node. Limit the
// exception to loopback HTTPS requests and never follow redirects with it.
const localDevelopmentAgent = new Agent({ connect: { rejectUnauthorized: false } });

export function fetchServerApi(url: string, init: RequestInit = {}): Promise<Response> {
  const target = new URL(url);
  const localHttps =
    process.env.NODE_ENV === "development" &&
    target.protocol === "https:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname);
  if (!localHttps) return fetch(url, init);
  return fetch(url, {
    ...init,
    redirect: "manual",
    dispatcher: localDevelopmentAgent,
  } as RequestInit);
}
