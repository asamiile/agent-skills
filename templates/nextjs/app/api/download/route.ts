// Download proxy with an attachment filename. Only paths under one prefix are allowed, so the route
// cannot be used to read arbitrary backend URLs.
import { backendFetch } from "@/lib/backendFetch";

const ALLOWED_PREFIX = "/static/images/";

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") ?? "";
  const normalized = new URL(path, "http://x").pathname; // resolves ../ before the prefix check
  if (!normalized.startsWith(ALLOWED_PREFIX) || normalized !== path) {
    return Response.json({ detail: "invalid path" }, { status: 400 });
  }
  const response = await backendFetch(normalized);
  if (!response.ok) return new Response(null, { status: response.status });
  const filename = (normalized.split("/").pop() ?? "file").replace(/[^\w.-]/g, "_");
  return new Response(await response.arrayBuffer(), {
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
