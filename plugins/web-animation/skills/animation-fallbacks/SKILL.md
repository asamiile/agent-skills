---
name: animation-fallbacks
description: Designs and implements what an animated web component (hero animation, key visual, intro sequence) shows when it cannot animate - reduced motion, JavaScript disabled, a CDN library or the main script failing to load, data loading too slowly, missing browser APIs, slow devices - so visitors always see the finished design instead of a blank area. Also covers the loading state, state classes, back/forward cache, tab switching, and resize behavior. Use when the user says things like "what if the animation doesn't load", "add a fallback", "support reduced motion", "it shows a blank area sometimes", or "make it robust for production".
---

# Fallbacks for an animated component

The rule: whatever goes wrong, the visitor ends up seeing the final state of the design, never a blank or half-built component. The final state is built from plain HTML and images (no canvas), so it works without JavaScript.

## 1. Build the final state first

- Markup the final look with `<img>` (or inline SVG) and real text. Keep the text in HTML so screen readers read it, and hide decorative images with `alt=""` or `aria-hidden="true"`
- Load heavy final-state images only when they are shown: hide them with CSS and use `loading="lazy"`. A hidden lazy image is not fetched, so normal playback does not pay for it

## 2. Define the state classes

Put them on the component's root. Tests and the performance script wait for them.

| Class | Meaning |
| --- | --- |
| `--ready` | JavaScript is running (turns off the CSS safety net) |
| `--loaded` | Everything needed is ready; fade the component in and start |
| `--static` | Show the final state (any fallback) |
| `--complete` | The animation finished |
| `--slow` | A slow device was detected and a lighter rendering was used |

## 3. Cover every case

| Case | What the visitor sees | How |
| --- | --- | --- |
| `prefers-reduced-motion: reduce` | Final state at once | Check `matchMedia` before building anything |
| Library from the CDN fails or is blocked | Final state at once | Check the global (`window.{library}`) before use |
| Data or renderer fails, or canvas is unavailable | Final state at once | Catch, then add `--static` |
| Data takes too long | Final state after a timeout | Race the loading against a timer |
| An error in the main script | Final state at once | Wrap startup in `try`/`catch` |
| JavaScript disabled | Final state at once | `@media (scripting: none)` |
| Main script fails to load | Final state after a short delay | CSS animation that the script cancels with `--ready` |
| A non-essential API is missing (for example `IntersectionObserver`) | Animation plays; dependent parts show at once | Feature-detect and skip |
| Slow device | Lighter rendering (for example a fade of the final image) | Measure frame times (see `visual-webgl:canvas-webgl-performance`) |

The CSS-only cases need care. See [references/css-safety-net.md](references/css-safety-net.md). Do not use `<noscript>` for this; `@media (scripting: none)` keeps the styles in one place.

## 4. Loading state

- Wait only for what the first frame needs (data, first draw), not for the page's `load` event or for final-state images
- Keep the component transparent while waiting, set the timeline to its start, then fade in briefly and play. This avoids flashes of a half-drawn state
- Choose the timeout from measurements on a throttled slow network (see `web-animation:measure-animation-performance`). If the measured start time is close to the timeout, shrink the data or raise the timeout; otherwise slow connections always get the static fallback

## 5. Behavior after the start

- Resize: keep proportions during and after playback. If the layout crosses a breakpoint during playback, jump to the end so positions don't jump mid-motion
- Redraw canvases only when their size or `devicePixelRatio` changes. Mobile address bars resize the viewport height while scrolling; redrawing on every resize event wastes frames
- Offscreen: stop drawing while the component is outside the viewport (`IntersectionObserver`) and draw the current state once when it comes back
- Back/forward cache: do not use `unload` handlers or anything else that blocks bfcache. A restored page continues from where it was left. A reloaded page plays from the start
- Background tabs: most animation libraries pause with `requestAnimationFrame`, so playback continues where it stopped. A tab opened in the background starts when it is first shown
- Elements revealed on scroll: reveal once. If the page loads already scrolled past them, show them at once instead of leaving a blank

## 6. Test each case

Every row in the table should be an automated test (see `web-animation:visual-regression-test`, which can block requests, delay data, disable JavaScript, emulate reduced motion, and remove APIs). Check the OS settings by hand on real devices: macOS/iOS "Reduce motion", Windows "Animation effects", Android "Remove animations".
