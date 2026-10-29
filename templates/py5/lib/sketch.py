"""
Helpers shared by py5 sketches: folders, sizes, blank-frame guard, preview, exit, and video encoding

A sketch lives in sketch/{work_name}/main.py and imports this module (see templates/py5/sketch_still.py
and sketch_animation.py). Everything that is not drawing lives here, so sketches stay short.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import time
from pathlib import Path

# Preview for review, output for delivery. Sketches render at OUTPUT_SIZE
PREVIEW_SIZE = (1920, 1080)
OUTPUT_SIZE = (3840, 2160)


def sketch_dir(main_file: str) -> Path:
    """Folder of the sketch; its name is the work name"""
    return Path(main_file).resolve().parent


def preview_name(work_name: str, pattern: int = 1, revision: int | None = None) -> str:
    """{work_name}_p{pattern}.png, or {work_name}_p{pattern}_v{revision}.png for snapshots"""
    suffix = f"_v{revision}" if revision else ""
    return f"{work_name}_p{pattern}{suffix}.png"


def check_not_blank(min_std: float = 1.0) -> None:
    """
    Abort when the frame has (almost) no variation: a broken sketch should fail fast,
    not render minutes of black frames. Call it on frame 2 and every so often afterwards.
    """
    import py5

    py5.load_np_pixels()
    if py5.np_pixels.std() < min_std:
        print(f"[Error] Blank frame at frame {py5.frame_count} (std < {min_std}). Aborting.")
        os._exit(1)


def force_exit(code: int = 0) -> None:
    """
    Stop the sketch and the process. exit_sketch() alone can leave the JVM running on macOS,
    which hangs unattended runs, so the process is ended explicitly.
    """
    import py5

    py5.exit_sketch()
    time.sleep(0.5)
    os._exit(code)


def save_preview_and_exit(folder: Path, filename: str) -> None:
    import py5

    py5.save_frame(str(folder / filename))
    force_exit(0)


def encode_video(frames: Path, out: Path, fps: int, pattern: str = "frame-%05d.png") -> None:
    """Join the numbered PNGs into H.264 MP4 (yuv420p plays everywhere; odd sizes are padded)"""
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-framerate", str(fps), "-i", str(frames / pattern),
        "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
        str(out),
    ], check=True)


def finish_animation(folder: Path, work_name: str, frames: Path, fps: int, total: int, preview_frame: int | None = None) -> None:
    """Encode the video, copy one frame as the preview, delete the frames, and exit"""
    import py5

    py5.exit_sketch()
    print(f"[Render] Encoding {total} frames")
    encode_video(frames, folder / f"{work_name}.mp4", fps)
    frame = preview_frame if preview_frame is not None else total // 2
    shutil.copyfile(frames / f"frame-{frame:05d}.png", folder / preview_name(work_name))
    shutil.rmtree(frames)  # frames take gigabytes per work at 4K
    print("[Render] Done")
    os._exit(0)
