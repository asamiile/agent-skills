#!/bin/bash
# Installs {Component} into the folder the host application reads it from. Safe to run again after an update:
# an existing copy is replaced, not merged. Double-clickable on macOS (.command opens in Terminal).
set -euo pipefail

NAME="{Component}"
if [ -z "${HOME:-}" ] || [ "$HOME" = "/" ]; then echo "Error: HOME is not set to a user folder. Nothing was changed."; exit 1; fi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE="$SCRIPT_DIR/$NAME"
TARGET_DIR="$HOME/{relative/path/to/host/folder}"
TARGET="$TARGET_DIR/$NAME"

if [ ! -d "$SOURCE" ]; then
  echo "Error: the $NAME folder must be next to this script. Extract the whole download and try again."
  exit 1
fi

# Guard the rm -rf below: refuse anything but the exact expected location (for example when HOME is wrong)
case "$TARGET" in
  "$HOME"/*/"$NAME") ;;
  *) echo "Error: unexpected install location, nothing was changed: $TARGET"; exit 1 ;;
esac

mkdir -p "$TARGET_DIR"   # the host application may not have created it yet
rm -rf "$TARGET"
cp -R "$SOURCE" "$TARGET"

echo
echo "$NAME installed to:"
echo "  $TARGET"
echo
echo "Next: {what the user does in the host application}."
echo

# CI sets CI=true; skip the prompt so the job does not wait forever
if [ -z "${CI:-}" ]; then
  read -r -p "Press Enter to close this window..."
fi
