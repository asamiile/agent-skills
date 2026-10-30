---
name: export-for-mobile
description: Re-encodes a finished video for phones and social feeds - H.264 baseline with fast start, looped or trimmed to a target length, in landscape and portrait versions cropped from the center without black bars. Use when the user says things like "make a mobile version", "export for Instagram/TikTok/Reels", "I need a vertical version", "make it a 15-second loop", or "this video won't play smoothly on phones".
---

# Export for mobile

Starter script, in this repository: `templates/motion-graphics/scripts/export-mobile.sh` (needs ffmpeg and ffprobe).

## 1. Find the source

- Use the full-quality master, not a previous mobile export (names ending in `_landscape` or `_portrait`)
- If the master was offloaded, fetch it back first (see `motion-graphics:offload-renders`)
- Never overwrite the source

## 2. Decide the length

| Source | Output |
| --- | --- |
| Within the target range (default 10-20 s) | Same length |
| Shorter | Looped to the target (default 15 s) |
| Longer | Cut to the target |

Adjust `MIN_SEC`, `MAX_SEC`, and `TARGET_SEC` at the top of the script to the platform. Looping only looks seamless when the source loops; check the seam.

## 3. Encode

```sh
scripts/export-mobile.sh path/to/master.mp4 [output-dir]
```

- `-stream_loop -1` with `-t` handles both looping and cutting in one command
- `scale=...:force_original_aspect_ratio=increase,crop=...` fills the frame from the center. `decrease` plus padding gives a small picture with black bars, which looks broken on phones
- Baseline profile, level 3.1, `yuv420p`, `+faststart` (playback starts before the whole file downloads), CRF 23
- Audio is dropped; remove `-an` if the work has sound

Check that the center crop keeps the subject. For compositions with important content near the edges, render a portrait version from the source instead of cropping.

## 4. Verify and report

Run `verify-video.mjs` on both outputs (see `motion-graphics:verify-render-outputs`) and report the source length, the target length, and each output's path and size. Offload the files again if the project keeps videos off the local disk. Do not commit the outputs.
