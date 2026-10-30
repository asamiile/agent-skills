"""
Still image template: copy to sketch/{work_name}/main.py
Run: uv run python sketch/{work_name}/main.py (with a timeout; the sketch saves its preview and exits)
"""

import sys
from pathlib import Path

import py5

sys.path.append(str(Path(__file__).resolve().parents[2]))  # project root, for lib/
from lib.sketch import OUTPUT_SIZE, check_not_blank, preview_name, save_preview_and_exit, sketch_dir

FOLDER = sketch_dir(__file__)
WORK_NAME = FOLDER.name
PREVIEW_FRAME = 60  # let the drawing build up before saving


def setup():
    py5.size(*OUTPUT_SIZE)
    py5.pixel_density(1)  # on Retina, 2 would quadruple the pixels to render
    py5.background(0)


def draw():
    # drawing

    if py5.frame_count in (2, PREVIEW_FRAME):
        check_not_blank()
    if py5.frame_count == PREVIEW_FRAME:
        save_preview_and_exit(FOLDER, preview_name(WORK_NAME))


py5.run_sketch()
