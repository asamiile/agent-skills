---
name: design-patterns
description: >-
  Index of the visual design specs in this project. Read the matching file before creating or
  restyling something in that look, and update it when a design decision is made in review.
---

# Design patterns

Rules elsewhere cover how the repository works. Files here cover how things should look: the approved style, color roles, palettes, parameter ranges, and decisions made in review. Each file points to its implementation, which stays the source of truth for exact values.

| File | Look | Implementation |
| --- | --- | --- |
| [{look}.md](./{look}.md) | {one line} | `{path}` |

## Shared principles

- **Seamless loops**: loop backgrounds over the composition. Drive motion from a 0-1 loop phase (whole-turn sines, `fract`, closed noise paths), never from unbounded time
- **One palette source**: reuse a shared palette table so different families sit together. Add a family-specific palette only when the look needs it, and list it in that family's file
- **Deterministic**: seeded randomness, so previews and renders match
- **Room for content**: backgrounds meant for titles or slides keep a calm area
- **Record decisions**: when a look is approved or rejected, write it down. An "Avoid" list is as useful as a palette table

## Adding a design file

Copy [_template.md](./_template.md) to `<look>.md`, list it in the table above, and keep it to the sections in the template.
