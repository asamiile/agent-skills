# Shaders in py5

`templates/py5/lib/postfx.py` and `lib/glsl/`. Both need an OpenGL renderer: `py5.size(w, h, py5.P2D)` or `py5.P3D`. Load shaders in `setup()`, after `size()`.

## When to use which

| Tool | For | API |
| --- | --- | --- |
| Finishing pass | Light-emitting subjects (glow, neon, plasma, stars, fire), cinematic grading, film texture | `PostFX(...)`, `fx.apply()` |
| GPU field | Per-pixel fields that are slow on the CPU at 4K: domain-warped noise, interference, reaction-like patterns, raymarched SDFs, caustics | `load_shader()`, `draw_fullscreen()` |

Skip them for crisp vector or flat graphic work, where bloom and grain blur its identity. Keep simulations that live in NumPy (particles, fluids, graphs) on the CPU and apply the finishing pass on top. Do not stack every effect by default; start subtle and justify each strong setting by the theme.

## Finishing pass

```python
fx = PostFX(bloom=0.8, threshold=0.6, tonemap=1.0, aberration=0.002, vignette=0.3, grain=0.03)

def setup():
    py5.size(*SIZE, py5.P2D)
    py5.pixel_density(1)
    fx.setup()

def draw():
    py5.background(0)
    ...            # drawing
    fx.apply()     # last, before the blank check and saving
```

All effects are off at 0 (saturation 1 = unchanged). Typical ranges: aberration 0.001-0.005, grain 0.02-0.06.

**Accumulating sketches** (no `background()` each frame) must not filter the screen in place: the effect would compound every frame. Draw into `canvas = fx.create_canvas()` with `canvas.begin_draw()` / `canvas.*` / `canvas.end_draw()`, then `fx.apply(canvas)`. The canvas keeps the raw build-up and the screen shows the processed copy.

## GPU field

Copy `lib/glsl/field_example.glsl` into the sketch folder and edit it.

```python
SEED = random.uniform(0, 1000)
field = load_shader(FOLDER / "field.glsl")                      # in setup()
draw_fullscreen(field, seed=SEED, colorA=(0.02, 0.03, 0.1))     # in draw()
```

- `draw_fullscreen` sets `resolution` (pixels) and `time` (seconds from the frame number). Other keyword arguments become uniforms: tuples → vecN, bools → int, images and canvases → sampler2D
- `#include "noise.glsl"` resolves against the sketch folder, then `lib/glsl/`
- Pass a random `seed` and offset the noise domain with it, so every run differs
- Colors in GLSL are 0-1 floats

## Gotchas

- An offscreen `create_graphics(..., P2D)` has no GL context until it has gone through one `begin_draw()` / `end_draw()`. Loading a shader into it before that fails
- Offscreen canvases are stored upside down relative to images. When sampling a canvas and an image together in GLSL, flip `y` for one of them. `PostFX` already handles it for the bloom buffer
- In P3D, the finishing pass turns lights off and disables the depth test for its full-screen quad. Call `py5.lights()` again at the start of each frame
- With lights on, py5 replaces a texture shader with its own lit version, which is why the pass calls `no_lights()` first
- Do not name GLSL variables after built-in functions (`step`, `mix`, `noise1`); some drivers refuse to compile
- A compile error appears as `RuntimeError: cannot load shader file ...` with the GLSL log. Fix the shader rather than silently falling back
- Check the saved preview: halos must sit on the bright shapes (not offset or flipped), and grain must look like noise, not a grid
