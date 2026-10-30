---
name: proxy-long-backend-requests
description: Proxies browser requests through Next.js route handlers to a backend API - adding a server-only token so the browser never holds it, keeping requests open for many minutes (Node's fetch gives up waiting for headers after 5 minutes) with an undici Agent and undici's own fetch, timeouts longer at each layer than behind it, cancellation when the user leaves, and a download route that only serves allowed paths. Use when the user says things like "the request fails after 5 minutes", "UND_ERR_HEADERS_TIMEOUT", "hide the API token from the browser", "proxy the backend through Next.js", or "invalid onRequestStart method" / "UND_ERR_INVALID_ARG" with a dispatcher.
---

# Proxy long backend requests through Next.js

Starter files, in this repository: `templates/nextjs/lib/backendFetch.ts`, `lib/timeouts.ts`, `app/api/generate/route.ts`, `app/api/download/route.ts`.

## 1. Why a proxy

The browser calls same-origin route handlers (`/api/...`). They add the backend token from a server-only environment variable and forward the request. The token never appears in client code, `NEXT_PUBLIC_*` variables, or network traffic the user can inspect.

## 2. Long requests

- Node's built-in `fetch` stops waiting for response headers after 5 minutes (`UND_ERR_HEADERS_TIMEOUT`). Create an undici `Agent` with longer `headersTimeout` and `bodyTimeout`
- Use `fetch` (and `Headers`) from the `undici` package together with that Agent. Node's built-in fetch bundles its own undici version; passing an Agent from a different version fails (`UND_ERR_INVALID_ARG`, or "invalid onRequestStart method")
- Mark the module `server-only`
- Put the timeout value in a module with no imports, so client components can use it to judge whether a request is still running
- Order the timeouts: model or job timeout < backend request timeout < proxy timeout < hosting platform limit (`maxDuration` where the platform has one)
- Forward `request.signal` so the backend call stops when the user navigates away

For waits longer than a platform allows, switch to a job ID and polling instead.

## 3. Downloads

A route that streams a backend file with `Content-Disposition: attachment` must not become a way to fetch arbitrary URLs: normalize the requested path, require an allowed prefix, reject anything whose normalized form differs from the input, and sanitize the filename.

## 4. Verify

Build, then call the routes against a stub backend that answers slowly: a long response arrives, the backend sees the token, and `..` paths get 400.
