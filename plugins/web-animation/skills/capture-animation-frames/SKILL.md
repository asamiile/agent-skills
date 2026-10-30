---
name: capture-animation-frames
description: Captures a web animation frame by frame, deterministically, by pausing its timeline and stepping it 1/60 s at a time - to produce a contact sheet for reviewing motion, an MP4 video for clients or social posts, or frame sequences to overlay against a reference. Works with the local page or, for GSAP, with the live site after embedding. Use when the user says things like "make a video of the animation", "export the animation as MP4", "show me the frames side by side", "compare the motion with the live site", or "record it smoothly without dropped frames".
---

# Capture an animation frame by frame

Screen recording drops frames and depends on the machine's speed. Pausing the timeline and seeking it to exact times gives the same frames on every run, at any resolution.

Starter code, in this repository: `templates/web-animation/tests/frames.mjs` (contact sheet), `tests/video.mjs` (MP4). Both use `tests/lib/browser.mjs` and the debug hook described in `web-animation:visual-regression-test`. For a live site built with GSAP, use `templates/gsap/tests/site-frames.mjs`.

## The core loop

1. Open the page with the debug hook, so the timeline is built but paused
2. Seek to 0 and wait until the screen is stable (images decoded, fonts ready)
3. For each frame `i`: `timeline.seek(i / fps)`, wait two `requestAnimationFrame`s, then screenshot
   - Two frames because canvas renderers usually draw on the frame after the timeline updates
4. Always include the exact end time as the last frame

## Contact sheet (`pnpm test:frames`)

- Captures only the animated element at a fixed interval (`FRAME_STEP`, default 0.25 s) for PC and SP widths
- Writes `test-results/frames/index.html`, a grid with the time under each frame
- Use it to review timing and easing with the designer, or to compare before and after a change

## Video (`pnpm video`)

- Captures the whole viewport at 60 fps, holds the final state for a second, and encodes with ffmpeg (`libx264`, `yuv420p`, CRF 18)
- `yuv420p` needs even dimensions; the script pads odd sizes by one pixel
- `VIDEO_SCALE=2` renders at device scale factor 2 for sharp video on high-density screens
- Needs ffmpeg. Without it the PNG frames are kept, so nothing is lost
- Put a timeout on each frame so a renderer that never paints fails instead of hanging

## Frames from the live site (GSAP)

After the component is embedded, the site may differ from the local build (theme CSS, fonts, scripts loaded in another order). Capture the live page with the same frame times and overlay the frames on the local build to find differences. See `gsap:animation-tuning-mock` for overlaying them in the mock.

- When the site is behind Basic authentication, pass the credentials through environment variables and give them to the browser with an `origin`, so they are sent only to that site. Never write them to files or logs
- Keep captured frames of a client's site out of git

## Where outputs go

Write everything under `test-results/` (or another folder in `.gitignore`). Frames from an unreleased client site are confidential material.
