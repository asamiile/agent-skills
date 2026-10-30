"""
Animation template: copy to sketch/{work_name}/main.py
Saves every frame as PNG, then encodes {work_name}.mp4, copies the middle frame as the preview,
deletes the frames, and exits. Frame-based timing keeps the video smooth however slow rendering is.
"""

import random
import sys
from pathlib import Path

import py5

sys.path.append(str(Path(__file__).resolve().parents[2]))  # project root, for lib/
from lib.sketch import OUTPUT_SIZE, check_not_blank, finish_animation, sketch_dir

FOLDER = sketch_dir(__file__)
WORK_NAME = FOLDER.name
FRAMES = FOLDER / "frames"  # not committed (.gitignore: sketch/*/frames/)
FPS = 60
DURATION_SEC = random.randint(15, 30)
TOTAL = DURATION_SEC * FPS


def setup():
    py5.size(*OUTPUT_SIZE)
    py5.pixel_density(1)
    FRAMES.mkdir(exist_ok=True)


def draw():
    t = (py5.frame_count - 1) / FPS  # seconds, derived from the frame number, never from the clock
    # drawing; decide on purpose whether to clear with background() each frame

    py5.save_frame(str(FRAMES / "frame-#####.png"))
    if py5.frame_count == 2 or py5.frame_count % FPS == 0:
        check_not_blank()
    if py5.frame_count % FPS == 0:
        print(f"[Render] {py5.frame_count}/{TOTAL} ({py5.frame_count / TOTAL:.0%})")  # progress, so a slow render is not taken for a hang
    if py5.frame_count >= TOTAL:
        finish_animation(FOLDER, WORK_NAME, FRAMES, FPS, TOTAL)


py5.run_sketch()
