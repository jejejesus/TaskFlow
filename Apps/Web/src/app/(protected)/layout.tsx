import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { Suspense } from "react";

async function AuthenticatedSidebar() {
  const token = (await cookies()).get("auth_token")?.value;
  let email = "";
  let name = "";

  try {
    const payload = token?.split(".")[1];
    if (payload) {
      const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
        email?: unknown;
        name?: unknown;
      } | null;
      if (typeof claims?.email === "string") email = claims.email.trim();
      if (typeof claims?.name === "string") name = claims.name.trim();
    }
  } catch {}

  const user = { name: name || email.split("@")[0] || "Usuario", email };
  return <AppSidebar user={user} />;
}

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Suspense fallback={<AppSidebar user={{ name: "Usuario", email: "" }} />}>
        <AuthenticatedSidebar />
      </Suspense>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
