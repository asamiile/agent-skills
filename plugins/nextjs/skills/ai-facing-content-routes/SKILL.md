---
name: ai-facing-content-routes
description: Adds AI-facing routes to a Next.js App Router site, generated from the same content files the pages use - /llms.txt, a JSON API for all entries and for one entry, and a Markdown brief per entry - all statically generated, with a server-only file loader that cannot leak into client bundles. Use when the user says things like "add llms.txt to the Next.js site", "expose the content as JSON for agents", "add a Markdown version of each page", or "the content loader broke the client build".
---

# AI-facing content routes in Next.js

Starter files, in this repository: `templates/nextjs/lib/content.ts`, `lib/content-schema.ts`, `app/llms.txt/route.ts`, `app/api/entries/route.ts`, `app/api/entries/[slug]/md/route.ts`. The tool-agnostic workflow (single source, schema, validation, writing entries) is `web-modern:publish-content-for-ai`.

## 1. Split the loader

- `lib/content.ts` reads `content/entries/*.json` with `fs`, wrapped in React `cache()`. It starts with `import 'server-only'`, so importing it from a client component fails the build instead of shipping a broken bundle
- `lib/content-schema.ts` holds the types and pure helpers (paths, Markdown rendering). Client components import from here only

## 2. Add the routes

| Route | Content |
| --- | --- |
| `/llms.txt` | Site summary, links to the JSON and Markdown endpoints, entries grouped by category with one line each ([llmstxt.org](https://llmstxt.org) format) |
| `/api/entries` | All entries as JSON |
| `/api/entries/{slug}/md` | One entry as a Markdown brief to paste into a chat |

- Mark each handler `export const dynamic = 'force-static'`. For the per-entry route, add `generateStaticParams()` and `dynamicParams = false`, so unknown slugs return 404 and every file is built ahead of time
- In Next.js 16, `params` is a promise: `const { slug } = await ctx.params`, typed with `RouteContext<'/api/entries/[slug]/md'>`
- Build absolute links from one site-URL setting, and check after the first deploy that they name the production domain

## 3. Verify

`next build` lists the routes as static (○ / ●). Then request `/llms.txt`, one Markdown brief, the JSON API, and an unknown slug (404), locally with `next start` and again after deploying.
