# CSS safety net for when the script never runs

## The problem

When the main script fails to load (404, blocked, a syntax error in an old browser), nothing ever adds `--static`. The component stays transparent forever. Showing the final state at once with CSS does not work either: when the script is merely slow, the final state flashes and then the animation starts over it.

## The approach

Until the script marks the root as `--ready`, CSS runs a delayed animation that reveals the final state after a few seconds. The script adds `--ready` as its first action, which removes the animation. JavaScript-disabled browsers skip the delay through `@media (scripting: none)`.

Animate registered custom properties rather than the properties themselves, so one animation drives several elements and `display` can switch together with opacity:

```css
@property --{prefix}-fallback {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}

.{prefix}:not(.{prefix}--ready, .{prefix}--static) {
  animation: {prefix}-fallback {fade} ease-out {delay} forwards;
}

.{prefix}:not(.{prefix}--ready) canvas {
  display: none;
}

.{prefix}:not(.{prefix}--ready, .{prefix}--static) .{prefix}__final {
  display: var(--{prefix}-fallback-display, none); /* not fetched while display is none */
  opacity: var(--{prefix}-fallback, 0);
}

@keyframes {prefix}-fallback {
  from { --{prefix}-fallback: 0; --{prefix}-fallback-display: block; }
  to { --{prefix}-fallback: 1; --{prefix}-fallback-display: block; }
}

@media (scripting: none) {
  .{prefix}:not(.{prefix}--ready, .{prefix}--static) {
    --{prefix}-fallback: 1;
    --{prefix}-fallback-display: block;
    animation: none;
  }
}
```

- An unregistered custom property animates discretely, which is what `--{prefix}-fallback-display` needs. The registered `<number>` property interpolates for the fade
- Choose `{delay}` longer than a slow but working script load. A few seconds is typical. Verify with the throttled performance run
- Use `forwards`, not `both`. With `both`, the `from` keyframe applies during the delay, so `display: block` takes effect at once and the lazy final image starts downloading even when the script loads fine
- Keeping the final image at `display: none` until the delay passes means it is not downloaded during normal playback
- Hide canvases until `--ready` so a half-initialized canvas never shows

## Why not `<noscript>`

`<noscript>` only covers disabled JavaScript, not a script that fails to load or throws. It also splits the styles between the stylesheet and the markup. The media query and the delayed animation cover both cases from the same stylesheet.
