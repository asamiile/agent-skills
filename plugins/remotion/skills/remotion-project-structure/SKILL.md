---
name: remotion-project-structure
description: Organizes a Remotion library with many compositions so it stays consistent as it grows - one schema file per component (zod schema, type, duration, defaults, pattern variants), source folders that mirror the Studio folder tree, composition IDs enumerated from the code instead of hand-written lists, a check that every ID has an output path, and copy overrides injected from a gitignored local JSON. Use when the user says things like "add a new composition", "add a pattern to this family", "set up a Remotion video library", "render.sh missed my new composition", or "keep personal text out of the repo".
---

# Remotion project structure

For Remotion's own APIs, prefer the official Remotion skills and docs. This skill covers how to organize a project with many compositions. Starter scripts, in this repository: `templates/remotion/scripts/` (`list-pattern-ids.cjs`, `check-folder-depth.cjs`).

## 1. One schema file per component

`src/<Category>/<Feature>/<feature>.schema.ts`:

```ts
export const featureSchema = z.object({ text: z.string().default("Sample"), speed: z.number().min(0).default(1) });
export type FeatureProps = z.infer<typeof featureSchema>;
export const featureDurationFrames = 300;                 // a constant, not baked into the schema
export const defaultFeatureProps = { text: "Sample", speed: 1 } as const;
export const featurePatterns = {                          // always exported, even with one variant
  default: defaultFeatureProps,
  fast: { ...defaultFeatureProps, speed: 2 },
} as const;
```

- Name files `<kebab-name>.schema.ts`. Keep `defaultProps` in the same field order as the schema, `as const`
- Every file exports `*Patterns`; scripts and registration read it. A composition ID is `<Feature>-<PatternKey>` (decide the casing rule once)
- The component (`<Feature>Template.tsx`) imports from the schema file; `Root.tsx` stays free of defaults and prop types

## 2. Source folders mirror the Studio tree

The `src/` hierarchy must match the `<Folder>` nesting in the registration files exactly, so the Studio sidebar tells you the file path.

| Place | When |
| --- | --- |
| `src/<Feature>/` | A standalone feature with no planned siblings |
| `src/<Category>/<Feature>/` | A member of a category of variations of one role (text effects, transitions, backgrounds) |
| `src/<Client>/<Role>/<Feature>/` | Assets dedicated to one client or brand only. Anything reusable goes to a generic category |
| `src/composition/`, `src/helpers/` | Shared infrastructure, never individual compositions |

- Promote a standalone feature to a category when a second member appears
- Keep category names short and singular. Keep Studio folders at most three levels deep; `check-folder-depth.cjs` enforces it across all registration files
- Split registration into several `root-<category>.tsx` files when `Root.tsx` grows large

## 3. Enumerate IDs from the code

Batch render scripts need the list of IDs. Hand-maintained lists drift: a new family that nobody added to the render script is silently never exported.

- `list-pattern-ids.cjs` reads `*Patterns` keys from schema files with the TypeScript AST, without running the code
- Every list of "where each ID's output goes" must cover every enumerated ID. Add a `check` subcommand to the render script that fails when an ID has no output mapping, and run it in CI and before every render
- When a family registers only some entries (for example only locations that have coordinates), the enumeration must apply exactly the same condition. Reusing another family's list leads to "composition not found" errors

## 4. Copy overrides stay local

Real or personal copy (names, titles, client text) does not belong in the repository.

- Schema defaults and `config/local/<name>.example.json` (committed) hold sample copy only
- `config/local/<name>.local.json` (gitignored) holds the real copy. Create it by copying the example
- `remotion.config.ts` reads the local file at bundle time and injects it with webpack's `DefinePlugin` (an empty object when the file is missing). A merge module applies it as a shallow override of existing pattern keys only; new IDs still need a schema entry and registration
- **Agents never edit, create, or delete `*.local.json`** unless the user names that exact file and change in chat
- Keep the example file, the type of the JSON, and the merge module in sync when adding a key

## 5. Adding things

- **A pattern to an existing family**: add the key to `*Patterns`, the matching block to the example JSON, and the key to the JSON type. The render script follows automatically
- **A new family**: schema and template, registration in the matching `<Folder>`, the example JSON block, the ID enumeration entry, and the output mapping. Then run the render script's `check`
- Run lint, type check, and the structure checks before any render

See `remotion:remotion-render-pipeline` for exporting and `remotion:duration-variants` for padded versions.
