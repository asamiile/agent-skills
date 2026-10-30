---
name: proxy-locale-and-auth
description: Writes the Next.js 16+ request proxy (proxy.ts, formerly middleware.ts) for two common jobs - choosing the locale for public pages (explicit URL, then a remembered cookie, then Accept-Language) and sending signed-out visitors away from an admin area - with a constant matcher, request headers passed to server components, and auth checked again in every Server Function and route handler. Use when the user says things like "redirect Japanese visitors to /ja", "remember the language choice", "protect the admin pages", "migrate middleware.ts to proxy.ts", or "the redirect works locally but not in production".
---

# Locale and admin gate in the Next.js proxy

Starter file, in this repository: `templates/nextjs/proxy.ts`. Read the proxy reference in the installed Next.js docs (`node_modules/next/dist/docs/`) first; the API changed in version 16.

## 1. Basics

- The file is `proxy.ts` at the project root (or `src/`), exporting `proxy` (or a default function) and an optional `config`. Migrating from `middleware.ts`: `npx @next/codemod@canary middleware-to-proxy .`
- It runs on the Node.js runtime; the `runtime` option is not allowed
- `config.matcher` must be constants (read at build time). List only the paths the proxy handles, so static files, images, and API routes never pass through it
- Pass data to pages through request headers (`NextResponse.next({ request: { headers } })`), cookies, redirects, or rewrites. `NextResponse.next({ headers })` would send them to the browser instead

## 2. Locale for public pages

Order of precedence:

1. An explicit locale in the URL (`/ja/...`) always wins. Remember it in a cookie
2. For a bare path, use the cookie, then the first supported language in `Accept-Language`, then the default
3. If the result is not the default locale, redirect to the prefixed URL and set the cookie; otherwise serve the page and set the cookie only if it was missing

Set `x-locale` on the request so server components can read it with `headers()`. Keep the prefixed and unprefixed pages as real routes so they also work where the proxy does not run.

## 3. Admin gate

Redirect signed-out visitors from `/admin/*` (except the sign-in page) to the sign-in page with the original path as a `next` parameter. Use the auth library's session check.

The proxy is only a first line. A matcher edit or moving a Server Function to another route silently removes its coverage, so every Server Function, route handler, and data-access function checks the session and the role again.

## 4. Verify

After `next build && next start`, request the admin page with and without a session, a localized page with different `Accept-Language` values and cookies, and an explicit `/ja/...` URL; check status codes, `Location`, and `Set-Cookie`. On a hosting platform, repeat it after deploying: an adapter that does not support the proxy yet leaves these redirects silently inactive.
