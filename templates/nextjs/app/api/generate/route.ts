// Same-origin proxy: the browser calls /api/generate; this handler adds the token and waits as long as needed
import { backendFetch } from "@/lib/backendFetch";

export const maxDuration = 1800; // hosting platforms cap route duration; raise it where the platform allows

export async function POST(request: Request) {
  const response = await backendFetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
    signal: request.signal, // stop the backend call if the user leaves
  });
  return new Response(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
}
