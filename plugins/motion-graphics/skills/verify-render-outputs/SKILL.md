---
name: verify-render-outputs
description: Verifies rendered videos and image sequences before they are delivered, uploaded, or archived - duration, resolution, frame rate, codec, pixel format and alpha (ProRes 4444) with ffprobe, file counts, file size limits, and a screening for dangerous flashing. Includes the rules for stock-footage submission. Use when the user says things like "check the renders", "is this video the right spec", "did the transparent MOV keep its alpha", "is it safe for photosensitive viewers", "can I submit this to Adobe Stock", or "verify the export before upload".
---

# Verify render outputs

Starter scripts, in this repository: `templates/motion-graphics/scripts/verify-video.mjs` and `scripts/flash-check.mjs` (Node built-in modules plus ffmpeg/ffprobe).

## 1. Before rendering

- Run the project's lint, build, and registration checks first (for example "every composition has an output folder"). A full render takes long; catch configuration errors before it
- Render only what the user asked for or approved. Full-library renders need explicit approval
- When outputs are offloaded automatically after rendering, turn that off for this run or fetch the files back before checking. Verify before the local copy disappears

## 2. Spec check

```sh
node scripts/verify-video.mjs --duration 5 --width 1920 --height 1080 --fps 30 --codec h264 --pix-fmt yuv420p out/**/*.mp4
node scripts/verify-video.mjs --alpha out/**/*-alpha.mov
```

- Duration must match within one frame. A padded variant meant to be exactly N seconds must report N.000
- A transparent MOV must be `prores`, profile 4444, with an alpha pixel format (`yuva444p10le` and similar)
- The number of outputs must match the number of requested items. For image sequences, check that every frame in the range exists
- Read the render warnings. Decide whether each one affects the image or the processing, and report it instead of ignoring it

## 3. Flashing

```sh
node scripts/flash-check.mjs out/clip.mp4
```

It flags any one-second window with more than three flashes, based on whole-frame luma. It is a screening aid, not a certification. See [references/photosensitive-safety.md](references/photosensitive-safety.md) for the limits and for ways to keep strong motion within them.

## 4. Size limits and delivery targets

Check the destination's limits before rendering long or high-bit-depth files (`--max-mb`). For stock footage, see [references/stock-submission.md](references/stock-submission.md).

## 5. Report

List each file with its codec, size, frame rate, duration, and pixel format, mark failures, and state what was not checked.
