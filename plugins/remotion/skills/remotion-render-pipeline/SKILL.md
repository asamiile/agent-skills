---
name: remotion-render-pipeline
description: Sets up and runs batch exports of a Remotion library - one render script with subcommands per family, MP4, transparent ProRes 4444 MOV, and PNG sequences, a fixed output layout that mirrors the Studio folders, WebGL compositions rendered with ANGLE, frame-driven shaders that never flicker, skipping outputs that already exist, and verification before offloading. Use when the user says things like "render all compositions", "export this as a transparent MOV", "my three.js composition flickers in the render", "render a PNG sequence", or "set up render.sh".
---

# Remotion render pipeline

Pair it with `remotion:remotion-project-structure` (IDs come from the code), `motion-graphics:verify-render-outputs` (checks after rendering), and `motion-graphics:offload-renders` (moving finished files off the disk).

## 1. One script, many entry points

A `render.sh` (or Node script) with:

- A subcommand per family (`Text`, `Effects`, ...) plus `all`. Every family must be reachable from `all`; a family that no subcommand exports is invisible until someone needs it
- Anything that is not a subcommand treated as composition IDs, rendered in order
- `list <file>`: render the IDs listed in a file (one per line) with one bundle and one browser
- `check`: verify that every enumerated ID has an output path, without rendering
- `help` as the single source of truth for options; keep the header comment to a few examples
- `.env` support for paths and switches (plain `KEY=VALUE`, never evaluated; values already in the environment win)

## 2. Output layout

One folder per composition below the Studio folder path:

```text
out/<Studio folders>/<BaseId>/<BaseId>.mp4
out/<Studio folders>/<BaseId>/<BaseId>-alpha.mov
out/<Studio folders>/<BaseId>/<BaseId>-5s.mp4          padded variants share the base folder
out/<Studio folders>/<BaseId>/png/*.png
out/<Studio folders>/<BaseId>/png-5s/*.png
```

- Never put videos directly in a category folder
- Let the output root be configured (`OUTPUT_DIR`, absolute, `~/...`, or relative to the repository) and resolve it the same way in every script
- If the mapping from ID to folder is hand-maintained, it is a third place that can drift from the source and the registration; cover it with `check`

## 3. Formats

| Need | Flags |
| --- | --- |
| Normal video | H.264 MP4 |
| Transparent overlay | `--codec=prores --prores-profile=4444 --image-format=png --pixel-format=yuva444p10le --muted` |
| Image sequence | `--sequence --image-format=png` (transparent: also make the composition's own background transparent) |

- Separate "make the composition's own background transparent" from "include the preview-only canvas background". They are two switches
- When `<id>-alpha.mov` exists, skip the MP4 of the same composition; it would be a duplicate
- Batch-exporting overlays: check that frames actually contain transparent areas, and leave out fully opaque compositions

## 4. WebGL and shaders

- Render with `--gl=angle` for compositions that use WebGL (three.js via `@remotion/three`, full-frame shaders). Keep a list or pattern of those IDs in the render script so they get the flag automatically
- Derive all animation from `useCurrentFrame()` and pass time as uniforms. Never animate with react-three-fiber's `useFrame`: it runs on the browser clock, so renders flicker or differ from the preview
- Padded variants (see `remotion:duration-variants`) must pass the time since the animation started, not since frame 0, or the base and padded versions show different frames
- Output premultiplied RGBA from shaders so transparent exports keep their alpha
- Seed randomness (`random(seed)`) so the Studio preview and the render match

## 5. Resumable batch renders

- Skip outputs that exist locally or on the offload remote (one remote listing per run)
- Write each run's outputs to a list and offload exactly those on exit (`trap ... EXIT`), even when the run fails halfway
- Use modest concurrency per family; heavy WebGL or map compositions need lower concurrency and longer timeouts

## 6. Before and after

- Before: lint, type check, bundle, `check`, and `git diff --check`. Render everything only after the user asked for it or approved it
- After: verify every file (duration, size, fps, codec, pixel format; ProRes 4444 with `yuva*` for alpha), count outputs against the requested IDs, and read the render warnings
