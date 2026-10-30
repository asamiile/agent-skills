---
name: animation-tuning-mock
description: Builds a tuning mock page for a GSAP timeline animation - a lil-gui panel that edits durations, offsets, and eases live, a player bar with frame stepping, seeking, label jumps, and an fps measurement, saved values, and an overlay of reference frames - while production code stays unchanged and autoplays. Use when the user says things like "I want to tweak the timing", "make a mock to adjust the animation with the designer", "add a scrubber", "step through the animation frame by frame", "compare with the design or the live site", or "tune the easing".
---

# Tuning mock for a GSAP animation

The mock and production run the same component scripts. The mock only adds a debug hook, a panel, and a player, so what is tuned is exactly what ships.

Starter code, in this repository: `templates/gsap/mock/player.ts` (player bar), `templates/gsap/mock/controls.ts` (panel and hook), and `templates/gsap/tests/site-frames.mjs` (frames from the live site).

## 1. Shape the component for tuning

- Put every adjustable number and ease in one `DEFAULTS` object (per breakpoint if they differ). Shipped code reads only from it
- Build the timeline in a function `build(params)` that returns a paused `gsap.timeline()`. Use labels for each phase (`tl.addLabel('{phase}')`). The player shows them and binds them to the number keys
- Position phases relative to each other (`'<'`, `'>-0.2'`, or label offsets) instead of absolute times, so changing one duration moves the rest
- At startup, hand the API to the hook when it exists, otherwise play:

```js
const api = { defaults: DEFAULTS, build };
if (window.__animDebug) window.__animDebug(api);
else build(DEFAULTS).play();
```

- Wrap the component in an IIFE without `import`/`export` when it must run as a plain `<script>` in a CMS theme
- Load GSAP from a CDN with a pinned version and `integrity`. If type definitions are needed, add the `gsap` npm package as a dev dependency at the same version

## 2. Set up the mock page

- `mock.html` loads GSAP, `lil-gui` (CDN, pinned, SRI), `player.js`, `controls.js`, then the same component scripts as `index.html`
- Keep the component markup the same as in `index.html`. Tune in the mock, and copy the markup to `index.html` once it is settled
- Put `mock` in the name of every mock file and folder so packaging rejects them (see `wordpress:package-wordpress-embed`)
- When there are several mock pages, use the same folder names, item names, and order in each panel. Build shared folders with a shared function
- Do not put keyboard shortcuts in item names. List them in the tooltip of the panel title

## 3. Panel behavior

- Every change rebuilds the timeline from the edited values, keeping the playhead position and paused state
- Save values in `localStorage` together with the defaults they were based on. On load, use a saved value only when its key still exists and its default has not changed. Otherwise renamed keys linger, and new defaults in the code are hidden by old saved values
- "Copy values" writes JSON to paste into `DEFAULTS`. "Reset" clears the saved values
- Add view switches the designer will want: turn phases on or off, add a tall spacer under the component to test reloading while scrolled down, and lower the slow-device threshold to test the fallback

## 4. Player bar

| Key | Action |
| --- | --- |
| Space | Play / pause |
| ← → | One frame (Shift: 10 frames) |
| R | Restart |
| Home / End | Start / end |
| 1-9 | Jump to the n-th label |

Stepping snaps to whole frames at 60 fps, so a given frame number always shows the same image. The ⏱ button plays from the start and reports average fps, the three longest frames with their timeline positions, and the number of frames over 20 ms. This is the measurement to use on real devices (see `web-animation:measure-animation-performance`).

## 5. Compare against references

Overlay a reference image on the component with an opacity slider and a "difference" blend (`mix-blend-mode: difference`). Matching areas turn black.

- Final frame against the design: export the design's final state as images and show them when the playhead is at the end
- Motion against the live site: capture the embedded site with `site-frames.mjs` (it pauses `gsap.globalTimeline` before the page starts it and finds the component's timeline by its labels). Then show the frame whose number matches the playhead. Serve the frames from the dev server on localhost only, and keep them out of git

## 6. GSAP details worth knowing

- `gsap.ticker` drives the player's display. It also pauses with the tab, so playback continues where it stopped when the tab returns
- `timeline.time(t)` on a paused timeline renders that moment immediately. Canvas renderers that draw in their own `requestAnimationFrame` need one or two frames before a screenshot
- Check the license terms of the GSAP version you pin, and write a short note for the client in the shipped documents
