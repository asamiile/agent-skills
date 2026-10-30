// Server-only fetch to the backend for requests that may take many minutes.
// Node's built-in fetch stops waiting for response headers after 5 minutes by default.
// An undici Agent raises that limit, and the Agent must come from the same undici version as the fetch
// using it: Node's built-in fetch bundles its own undici, which can be older than the npm package.
// So both fetch and Agent are imported from the `undici` package.
import "server-only";
import { Agent, fetch, Headers, type HeadersInit, type RequestInit, type Response } from "undici";

import { LONG_REQUEST_TIMEOUT_MS } from "./timeouts";

const longRequests = new Agent({ headersTimeout: LONG_REQUEST_TIMEOUT_MS, bodyTimeout: LONG_REQUEST_TIMEOUT_MS });

const BACKEND_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000";
// The shared token stays on the server: route handlers add it, the browser never sees it
const TOKEN = process.env.APP_API_TOKEN ?? "";

export function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers as HeadersInit | undefined); // undici's Headers, matching its fetch
  headers.set("Authorization", `Bearer ${TOKEN}`);
  return fetch(`${BACKEND_URL}${path}`, { ...init, headers, dispatcher: longRequests });
}
