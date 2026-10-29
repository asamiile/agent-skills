---
name: py5-sketch-setup
description: Sets up and writes py5 (Processing for Python) sketches that run unattended - still images that save a preview and exit, animations rendered frame by frame to MP4, a blank-frame guard, forced exit so the JVM never hangs on macOS, optional GLSL finishing (bloom, filmic tone map, aberration, vignette, grain) and GPU fields. Use when the user says things like "start a py5 project", "write a py5 sketch", "render this py5 animation to video", "add bloom/grain to my sketch", "my py5 sketch hangs and never exits", or "use a shader in py5".
---

# py5 sketches that run unattended

Starter code, in this repository: `templates/py5/` (`lib/sketch.py`, `lib/postfx.py`, `lib/glsl/`, `sketch_still.py`, `sketch_animation.py`). The workflow around it (brief, critique, catalog) is `generative-art:autonomous-artwork-loop`.

## 1. Project setup

- Manage the environment with `uv` (`uv init`, `uv add py5 numpy`). Pin `py5` to `0.10.11a0` or later: older versions crash on recent macOS with the P2D/P3D renderers ("Must only be used from the main thread")
- py5 needs a Java runtime (17 or later). Check `java -version` before blaming the code
- Copy `lib/` to the project root and each template to `sketch/{work_name}/main.py`
- `.gitignore`: `sketch/*/frames/`, `*.mp4`, `*.mov`, `.venv`, `.env`

## 2. Rules every sketch follows

- `py5.pixel_density(1)`. On Retina displays the default would render four times the pixels. If you read pixels, take the real size from `py5.np_pixels.shape[:2]`
- Render at the output size (for example 3840×2160); review the saved preview
- Guard against blank output: on frame 2 and periodically, `check_not_blank()` aborts when the frame has almost no variation. A broken sketch then fails in seconds instead of rendering minutes of black
- Exit explicitly: `save_preview_and_exit()` or `finish_animation()`. `exit_sketch()` alone can leave the JVM alive on macOS, so the helpers end the process
- Run with a timeout and treat a timeout as a failure. A py5 error in a shader sketch can leave the window open instead of exiting. macOS has no `timeout` command; use `perl -e 'alarm shift; exec @ARGV' 300 uv run python sketch/{work_name}/main.py`
- No fixed seeds; each run should differ

## 3. Stills

`sketch_still.py` draws for a number of frames (so accumulating drawings can build up), checks for a blank frame, saves `{work_name}_p1.png`, and exits.

## 4. Animations

`sketch_animation.py` saves every frame to `frames/`, then `finish_animation()` encodes `{work_name}.mp4` (H.264, yuv420p, odd sizes padded), copies the middle frame as the preview, deletes `frames/` (gigabytes at 4K), and exits.

- Derive time from the frame number (`t = (frame_count - 1) / FPS`), never from the clock. Rendering is slower than real time
- Print progress every second of output so a slow render is not mistaken for a hang
- Decide on purpose whether to clear with `background()` each frame. Not clearing, or painting a translucent rectangle, gives trails

## 5. Shaders (optional)

See [references/shaders.md](references/shaders.md). Choose them when the brief calls for glow, a cinematic finish, or a per-pixel field the CPU cannot render at 4K; otherwise plain py5 and NumPy stay the default.

## 6. Verify

- Look at the saved preview image, not only the exit code
- For videos, check duration, size, codec, and pixel format with ffprobe (see `motion-graphics:verify-render-outputs`)
