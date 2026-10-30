#!/usr/bin/env bash
# Compile a sketch with arduino-cli. Handles the case Arduino tools reject: a main .ino whose name differs
# from its folder (common in older collections). Such a sketch is copied, with its companion files, into a
# temporary folder named after the .ino, compiled there, and the copy is removed.
#
#   scripts/compile.sh <sketch-dir-or-ino> [--fqbn FQBN] [other arduino-cli compile flags]
# Without --fqbn, the sketch's sketch.yaml (default_profile / default_fqbn) decides the board.
set -euo pipefail

target="${1:?Usage: compile.sh <sketch-dir-or-ino> [--fqbn FQBN] [flags]}"
shift

if [ -f "$target" ]; then
  ino="$target"
  dir="$(cd "$(dirname "$target")" && pwd)"
else
  dir="$(cd "$target" && pwd)"
  shopt -s nullglob
  inos=("$dir"/*.ino)
  shopt -u nullglob
  if [ -f "$dir/$(basename "$dir").ino" ]; then
    ino="$dir/$(basename "$dir").ino"
  elif [ "${#inos[@]}" -eq 1 ]; then
    ino="${inos[0]}"
  else
    echo "Error: $dir has ${#inos[@]} .ino files and none named after the folder; pass the main .ino." >&2
    exit 2
  fi
fi

name="$(basename "$ino" .ino)"
if [ "$(basename "$dir")" = "$name" ]; then
  exec arduino-cli compile "$@" "$dir"
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir "$tmp/$name"
cp "$ino" "$tmp/$name/"
# Companion files the sketch may include (headers, sources, sketch.yaml); never other sketches' .ino files
for f in "$dir"/*.h "$dir"/*.hpp "$dir"/*.c "$dir"/*.cpp "$dir"/sketch.yaml; do
  [ -e "$f" ] && cp "$f" "$tmp/$name/"
done
echo "Compiling a temporary copy as $name/ (folder name differs from the sketch)" >&2
arduino-cli compile "$@" "$tmp/$name"
