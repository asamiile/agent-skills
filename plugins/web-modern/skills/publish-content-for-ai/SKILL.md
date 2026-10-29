---
name: publish-content-for-ai
description: Sets up and maintains a content collection that serves two readers from one source - a gallery or docs site for people, and llms.txt, JSON, and Markdown briefs for AI agents - with one JSON file per entry as the single source of truth, a schema kept in step across type, validator, and documentation, a validation script for CI, and rules for writing entries an AI can act on. Use when the user says things like "add an entry to the library", "make this collection readable by AI", "add llms.txt", "validate the content files", "change the content schema", or "write a style/recipe/pattern entry".
---

# Publish content for people and AI

Starter files, in this repository: `templates/web-modern/scripts/validate-content.mjs`. For a Next.js site, the routes and loader are in `nextjs:ai-facing-content-routes`.

## 1. One source, many outputs

- One JSON file per entry (`content/entries/{slug}.json`) is the only place content is written
- Everything else is generated from it: the human pages, `/llms.txt`, a JSON API (all entries, one entry), a Markdown brief per entry, and the sitemap. Never hand-write an AI-facing file; it drifts from the site the first time someone edits an entry
- Human-facing text can be localized; AI-facing fields (keywords, prompts, observable traits) stay in English, which image models and coding agents interpret most consistently

## 2. Three places for one schema

The type definition, the validator (`SCHEMA` in `validate-content.mjs`), and the schema document always change together. The validator rejects unknown fields, so a field added in only one place fails CI instead of silently disappearing.

## 3. Add or update an entry

1. Search the existing entries for the same or a near-duplicate subject (`grep -ril "{name}" content/entries`). If one exists, propose updating it
2. Pick the category by how the entry will mainly be used, not by where it came from
3. Write the entry by copying the shape of an existing one:
   - Concrete, observable details instead of judgments ("2-4 px solid border", "single light source from upper left", not "modern" or "beautiful")
   - Proportions where they matter (for example each color's share of the area)
   - What to avoid, especially features of neighboring entries that are easily confused with this one
   - A ready-to-paste English prompt, ordered from the general (medium, subject) to the specific (color, texture, light)
   - Uncertain facts (dates, names) left out or backed by a reference link
   - Images only when the user confirms the rights; otherwise derive a placeholder (such as color bands) from the data
4. Validate and type-check: `node scripts/validate-content.mjs` and the project's type check
5. Reply with the file path and one line on what was added

## 4. Change the schema

Ask the user first. Then update the type, `SCHEMA`, and the schema document in one change, migrate every existing entry, and run the validator.

## 5. CI

Run the validator before the build. Generated routes are covered by the build itself and by the production smoke check (`web-modern:verify-production-release`).
