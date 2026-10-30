---
name: visual-regression-test
description: Sets up automated browser tests for an animated web component: screenshot comparison of the final state at several viewport widths, playback without errors, resize during playback, and each fallback case. Uses the installed Google Chrome through playwright-core and node:test, with no extra image library. Use when the user says things like "add visual regression tests", "check it didn't break at each width", "compare screenshots before and after", "test the fallbacks automatically", or "run the tests against the deliverable".
---

# Visual regression tests for an animated component

Starter code, in this repository:

- `templates/web-animation/tests/` (`lib/browser.mjs`, `visual.test.mjs`, `run.mjs`)
- `templates/web-modern/scripts/serve.mjs` (the static server the tests start)

Dependencies: `playwright-core` (dev). The tests drive the Chrome already installed on the machine (`channel: 'chrome'`), so no browser is downloaded. Ask the user before adding the package.

## 1. Give the page a test entry point

A test needs to stop the animation and move it to any time. Add a debug hook to the component instead of a test-only build:

```js
const api = { defaults: DEFAULTS, build: (params) => buildTimeline(params) }; // build returns a paused timeline
if (window.__animDebug) window.__animDebug(api);
else api.build(DEFAULTS).play();
```

The timeline must provide `duration()`, `seek(seconds)`, and `progress(0..1)`. A GSAP timeline already does; for other libraries, wrap them in an object with these three methods. Production never defines `__animDebug`, so it autoplays as usual. The same hook serves the tuning mock (see `gsap:animation-tuning-mock`).

Also expose state classes on the component's root (`--loaded`, `--complete`, `--static`, and so on). Tests wait for them instead of sleeping. See `web-animation:animation-fallbacks` for the set.

## 2. Copy the starter and set it up

1. Copy `tests/` and `scripts/serve.mjs`. Replace `{prefix}` and the page name
2. Set `VIEWPORTS` in `lib/browser.mjs`: both sides of every breakpoint (for example `767` and `768`), the design's base widths, and one wide and one narrow extreme
3. Add the scripts:

```json
"test": "node tests/run.mjs",
"test:update": "node tests/run.mjs --update",
"test:dist": "node tests/run.mjs --dist"
```

4. Add `test-results/` to `.gitignore`

Run the tests from the user's own terminal. A sandbox usually blocks starting a browser and binding a local port, so tell the user to run them instead of retrying.

## 3. Decide the cases

Start from `visual.test.mjs` and keep only what applies:

| Group | Case |
| --- | --- |
| Final state | Matches the baseline at every viewport, and the page does not overflow horizontally |
| Playback | Plays to the end with no script errors, console errors, or failed requests |
| Playback | Crossing a breakpoint during playback jumps to the final state |
| Resize | After playback, PC → SP → PC keeps the final state and redraws canvases at the new size |
| Fallbacks | Reduced motion, CDN blocked, JavaScript disabled, main script missing, data too slow, a missing API (`removeGlobals`), no WebGL 2 (`noWebGL2`) |
| Scrolling | Elements revealed on scroll stay hidden offscreen, appear when scrolled in, and appear at once when the page loads already scrolled |

Write the same list in the project's QA document, under "Automated", so manual QA skips them.

## 4. Run and maintain

- First run: baselines are saved to `test-results/baseline/`, separately per OS (text renders differently on macOS and Windows)
- A failure writes `test-results/diff/<name>.png` with the changed pixels in red. Check it before deciding anything
- After an intended visual change: `pnpm test:update`, then look at the new baselines
- Before delivery: run `pnpm test:dist` so the packaged files are tested with the same baselines

When a test fails in a way that does not make sense, read [references/pitfalls.md](references/pitfalls.md) before changing thresholds.
