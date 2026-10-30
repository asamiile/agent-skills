#!/bin/bash
# Re-encodes a finished video for phones and social feeds: H.264 baseline, fast start, loop or trim
# to a target length, landscape and portrait versions cropped from the center (no black bars)
#
#   scripts/export-mobile.sh <source.mp4> [output-dir]
#
# Length: 10-20 s sources keep their length; shorter ones loop to TARGET_SEC, longer ones are cut to it.
# Outputs: <name>_landscape.mp4 (1280x720) and <name>_portrait.mp4 (720x1280). The source is never overwritten.
set -euo pipefail

SRC="${1:?Usage: scripts/export-mobile.sh <source.mp4> [output-dir]}"
OUT_DIR="${2:-$(dirname "$SRC")}"
MIN_SEC=10
MAX_SEC=20
TARGET_SEC=15
CRF=23

name="$(basename "${SRC%.*}")"
duration="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")"
if awk -v d="$duration" -v lo="$MIN_SEC" -v hi="$MAX_SEC" 'BEGIN { exit !(d >= lo && d <= hi) }'; then
  target="$duration"
else
  target="$TARGET_SEC"
fi

encode() { # $1 width, $2 height, $3 suffix
  # -stream_loop -1 with -t loops a short source and cuts a long one with the same command
  # scale with "increase" + crop fills the frame from the center instead of letterboxing
  ffmpeg -v error -y -stream_loop -1 -i "$SRC" -t "$target" -an \
    -vf "scale=$1:$2:force_original_aspect_ratio=increase,crop=$1:$2,setsar=1" \
    -c:v libx264 -profile:v baseline -level 3.1 -pix_fmt yuv420p -crf "$CRF" -movflags +faststart \
    "$OUT_DIR/${name}_$3.mp4"
  echo "$OUT_DIR/${name}_$3.mp4 ($(du -h "$OUT_DIR/${name}_$3.mp4" | cut -f1))"
}

mkdir -p "$OUT_DIR"
echo "Source: $SRC (${duration}s) -> ${target}s"
encode 1280 720 landscape
encode 720 1280 portrait
