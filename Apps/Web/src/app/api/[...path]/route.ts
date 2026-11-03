import { NextRequest, NextResponse } from "next/server";

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const API_BASE_URL = process.env.API_BASE_URL || "https://localhost:7120/api";

async function proxyHandler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const targetPath = path.join("/");

  const targetUrl = `${API_BASE_URL.replace(/\/$/, "")}/${targetPath}${request.nextUrl.search}`;

  const headers = new Headers();

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const authorization = request.headers.get("Authorization");
  if (authorization) {
    headers.set("Authorization", authorization);
  } else {
    const token = request.cookies.get("auth_token")?.value;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);

  let body: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  try {
    const apiResponse = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
    });

    const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);
    const hasBody = !NULL_BODY_STATUSES.has(apiResponse.status);

    const data = hasBody ? await apiResponse.text() : null;

    const responseHeaders = new Headers();
    if (hasBody) {
      responseHeaders.set(
        "content-type",
        apiResponse.headers.get("content-type") || "application/json",
      );
    }

    return new NextResponse(data, {
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error en el proxy:", error);
    return NextResponse.json({ error: "Error interno del servidor proxy" }, { status: 500 });
  }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const DELETE = proxyHandler;
export const PATCH = proxyHandler;
