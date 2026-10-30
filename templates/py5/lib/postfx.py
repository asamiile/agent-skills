"""
Optional finishing pass and GPU fields for py5 (needs the P2D or P3D renderer)

  fx = PostFX(bloom=0.6, tonemap=1.0, grain=0.03)

  def setup():
      py5.size(*SIZE, py5.P2D); py5.pixel_density(1); fx.setup()

  def draw():
      py5.background(0); ...; fx.apply()        # redraws every frame: filter the screen in place

Sketches that accumulate (no background each frame) draw into fx.create_canvas() and call
fx.apply(canvas): the screen shows the processed copy while the canvas keeps the raw build-up.
Applying in place to an accumulating screen would apply the effect again every frame.

  field = load_shader(FOLDER / "field.glsl")    # GPU field; #include "noise.glsl" resolves against lib/glsl/
  draw_fullscreen(field, seed=SEED, colorA=(0.0, 0.1, 0.2))
"""

from __future__ import annotations

import hashlib
import re
import tempfile
from pathlib import Path
from typing import Any

GLSL = Path(__file__).resolve().parent / "glsl"
INCLUDE = re.compile(r'^[ \t]*#include[ \t]+"([^"]+)"[ \t]*$', re.MULTILINE)


def _expand(path: Path, seen: set[Path]) -> str:
    def include(match: re.Match) -> str:
        for base in (path.parent, GLSL):
            candidate = (base / match[1]).resolve()
            if candidate.exists():
                if candidate in seen:
                    return ""
                seen.add(candidate)
                return _expand(candidate, seen)
        raise FileNotFoundError(f'#include "{match[1]}" from {path}')

    return INCLUDE.sub(include, path.read_text())


def load_shader(frag: str | Path, graphics: Any = None):
    """Load a fragment shader. A bare file name is looked up in lib/glsl/. #include lines are expanded"""
    import py5

    path = Path(frag)
    if not path.exists() and (GLSL / path).exists():
        path = GLSL / path
    source = _expand(path, {path.resolve()})
    if source != path.read_text():
        # py5 loads shaders from files, so write the expanded source next to the temp dir
        out = Path(tempfile.gettempdir()) / "py5-glsl" / f"{path.stem}-{hashlib.sha1(source.encode()).hexdigest()[:10]}.glsl"
        out.parent.mkdir(exist_ok=True)
        out.write_text(source)
        path = out
    return (graphics or py5).load_shader(str(path))


def set_uniforms(shader, **values) -> None:
    """Tuples become vecN, bools become int, numbers become float, images stay samplers"""
    for name, value in values.items():
        if isinstance(value, bool):
            shader.set(name, int(value))
        elif isinstance(value, (tuple, list)):
            shader.set(name, *[float(v) for v in value])
        elif isinstance(value, (int, float)):
            shader.set(name, float(value))
        else:
            shader.set(name, value)


def draw_fullscreen(shader, graphics: Any = None, fps: int = 60, **uniforms) -> None:
    """Fill the canvas with a fragment shader; sets `resolution` and `time` (frame-based seconds)"""
    import py5

    g = graphics or py5
    set_uniforms(shader, resolution=(g.width, g.height), time=py5.frame_count / fps, **uniforms)
    g.push_style()
    g.shader(shader)
    g.no_stroke()
    g.rect(0, 0, g.width, g.height)
    g.reset_shader()
    g.pop_style()


class PostFX:
    """Bloom, exposure, filmic tone map, chromatic aberration, vignette, grain. Each effect is off at 0"""

    def __init__(self, *, bloom=0.6, threshold=0.6, knee=0.2, radius=1.0, passes=3, downscale=4,
                 exposure=1.0, tonemap=0.0, aberration=0.0, vignette=0.25, grain=0.03, saturation=1.0,
                 enabled=True, fps=60):
        self.bloom, self.threshold, self.knee, self.radius, self.passes = bloom, threshold, knee, radius, passes
        self.downscale, self.exposure, self.tonemap, self.aberration = downscale, exposure, tonemap, aberration
        self.vignette, self.grain, self.saturation, self.enabled, self.fps = vignette, grain, saturation, enabled, fps
        self._ready = False

    def setup(self) -> None:
        """Call after py5.size(); the bloom runs at reduced resolution"""
        import py5

        w, h = max(1, py5.width // self.downscale), max(1, py5.height // self.downscale)
        self._a = py5.create_graphics(w, h, py5.P2D)
        self._b = py5.create_graphics(w, h, py5.P2D)
        for g in (self._a, self._b):
            g.begin_draw()  # an offscreen P2D canvas has no GL context until it has been drawn once
            g.background(0)
            g.end_draw()
        self._bright = load_shader("bright.glsl", self._a)
        self._blur_a = load_shader("blur.glsl", self._a)
        self._blur_b = load_shader("blur.glsl", self._b)
        self._finish = load_shader("finish.glsl")
        self._ready = True

    def create_canvas(self, renderer=None):
        import py5

        canvas = py5.create_graphics(py5.width, py5.height, renderer or py5.P2D)
        canvas.begin_draw()
        canvas.end_draw()
        return canvas

    @staticmethod
    def _pass(target, shader, source) -> None:
        target.begin_draw()
        target.shader(shader)
        target.image(source, 0, 0, target.width, target.height)
        target.reset_shader()
        target.end_draw()

    def apply(self, source: Any = None) -> None:
        import py5

        if not self._ready:
            self.setup()
        if not self.enabled:
            if source is not None:
                py5.image(source, 0, 0)
            return
        # An offscreen canvas is stored upside down relative to an image, and the bloom buffer is a canvas
        flip = 0.0 if isinstance(source, py5.Py5Graphics) else 1.0
        if source is None:
            source = py5.get_pixels(0, 0, py5.width, py5.height)  # stable copy of the screen to read from
            flip = 1.0
        if self.bloom > 0:
            set_uniforms(self._bright, threshold=self.threshold, knee=self.knee)
            self._pass(self._a, self._bright, source)
            for i in range(self.passes):
                spread = self.radius * (i + 1)  # wider each pass: a soft, large halo from few taps
                set_uniforms(self._blur_b, direction=(spread, 0.0))
                self._pass(self._b, self._blur_b, self._a)
                set_uniforms(self._blur_a, direction=(0.0, spread))
                self._pass(self._a, self._blur_a, self._b)
        set_uniforms(
            self._finish, bloomTex=self._a, resolution=(py5.width, py5.height), time=py5.frame_count / self.fps,
            bloom=self.bloom, exposure=self.exposure, tonemap=self.tonemap, aberration=self.aberration,
            vignette=self.vignette, grain=self.grain, saturation=self.saturation, bloomFlipY=flip,
        )
        is3d = py5.get_graphics().is3d()
        py5.push_style()
        py5.push_matrix()
        py5.reset_matrix()
        if is3d:
            py5.no_lights()  # with lights on, py5 swaps in its lit texture shader instead of ours
            py5.hint(py5.DISABLE_DEPTH_TEST)
            py5.ortho()
            py5.translate(-py5.width / 2, -py5.height / 2)
        py5.shader(self._finish)
        py5.image(source, 0, 0, py5.width, py5.height)
        py5.reset_shader()
        if is3d:
            py5.hint(py5.ENABLE_DEPTH_TEST)
            py5.perspective()  # call py5.lights() again at the start of the next frame
        py5.pop_matrix()
        py5.pop_style()
