---
name: canvas-webgl-performance
description: Diagnoses and fixes stutter in Canvas 2D or WebGL animations - finds whether the cost is draw calls or painted pixels, batches thousands of Canvas 2D fills into one instanced WebGL 2 draw, caches static layers, avoids first-draw hitches, stops drawing offscreen, and switches to a lighter rendering on slow devices. Use when the user says things like "the canvas animation is janky", "it stutters on Windows/Android", "too many fill calls", "should I move this to WebGL", "drops frames at the end of the animation", or "detect slow devices and fall back".
---

# Canvas and WebGL performance

Measure first, using `web-animation:measure-animation-performance` or the mock's measure button. Optimizing without numbers usually targets the wrong limit.

## 1. Find which limit you hit

| Experiment | If it helps, the limit is |
| --- | --- |
| Halve the canvas resolution | Painted pixels (fill rate) |
| Halve the number of drawn layers or shapes, at full resolution | Draw calls and state changes |
| Neither helps, and long frames appear even before drawing starts | Something else (no GPU acceleration, garbage collection, main thread work). Check `chrome://gpu` and a performance profile |

Devices differ. A phone may be fill-rate bound while a Windows laptop with a discrete GPU is draw-call bound under Canvas 2D. Test the slowest devices of each kind.

## 2. Cheap fixes in Canvas 2D

- Draw static layers once into an offscreen canvas and copy it each frame with `drawImage`
- Redraw only when something changed; skip frames where the timeline did not move
- While in motion, draw at lower resolution and fewer layers. When the motion stops, draw the full-quality version, spread over a few frames, and swap it in
- Cap `devicePixelRatio` (for example at 2). Beyond that the cost grows faster than the visible gain
- Stop drawing while the canvas is offscreen (`IntersectionObserver`), and draw the current state once when it returns

## 3. Move heavy layered drawing to WebGL 2

When Canvas 2D needs thousands of fills per frame (many shapes × many layers, as in extrusions, trails, or blends), batch them into one instanced draw. See [references/webgl-batching.md](references/webgl-batching.md) for the full technique:

- One quad per shape, instanced once per layer: `drawElementsInstanced(TRIANGLES, shapes * 6, ..., layers)`
- Per-shape values (positions, colors, bounds, animated progress) in a small float texture, read with `texelFetch`. Each frame updates only the animated row
- Shape outlines rendered once with Canvas 2D into a mask atlas, uploaded as a single-channel `R8` texture with mipmaps
- Back-to-front order inside the instanced draw matches Canvas 2D painting order, so the result looks the same

Keep the Canvas 2D version in the mock as a reference renderer. Compare their final frames with the visual tests.

## 4. Remove first-draw hitches

The first frame that uses a shader, texture, or path is slow (compilation, upload, rasterization). Do all of it before playback, while the component is still transparent: build the atlas, upload textures, and draw every layer once. Long frames then fall at time 0, where nobody sees them.

## 5. Handle failure and slow devices

- No WebGL 2 (`getContext('webgl2')` returns null): use the lighter rendering from the start
- `webglcontextlost`: call `preventDefault()`, drop the WebGL canvas, and switch to the lighter rendering for the rest of the animation
- Slow device: watch frame intervals while the heavy phase runs and switch when the median of recent frames exceeds a threshold. See [references/slow-device-detection.md](references/slow-device-detection.md)
- The lighter rendering can be as simple as fading in a prerendered image of the final state. Load that image only when the switch happens

## 6. Redraw on the right events

- Redraw when the canvas size changes, not on every `resize` event. Mobile address bars change the viewport height while scrolling
- Watch `devicePixelRatio` with `matchMedia(\`(resolution: ${devicePixelRatio}dppx)\`)` and a one-time `change` listener, re-registered after each change. Moving a window to another monitor changes it
- Debounce resize work, but handle a breakpoint change at once
