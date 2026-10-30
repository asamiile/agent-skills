---
name: build-with-arduino-cli
description: Compiles, uploads, and monitors Arduino-compatible firmware with arduino-cli - finding the board and port, using the board's exact FQBN, installing cores that need extra board-manager URLs, pinning the board, core, and libraries in a sketch.yaml project file, compiling older sketches whose file name differs from their folder, writing non-blocking firmware, and reporting compile, local, and hardware results separately. Use when the user says things like "compile this sketch", "upload to the board", "which FQBN", "arduino-cli can't find the sketch", "the build broke after a library update", or "make the build reproducible".
---

# Build with Arduino CLI

Starter files, in this repository: `templates/arduino/sketch/Template/` (`Template.ino`, `config.h`, `credentials.h.example`, `sketch.yaml`) and `templates/arduino/scripts/compile.sh`. Repository rules: `templates/electronics/AGENTS.md`.

## 1. Board, port, and core

```sh
arduino-cli board list                  # connected boards and their ports
arduino-cli board listall {name}        # FQBNs of installed cores
arduino-cli core update-index
arduino-cli core install {vendor:arch}  # boards outside arduino:* need the vendor's index URL in the CLI config first
```

- Use the target board's exact FQBN, including options. Never infer it from the chip family or copy another board's
- Take the port from `board list`; do not assume a port name from another operating system
- Some boards have more than one core (vendor and community); use the one the project documents

## 2. Pin the build in sketch.yaml

Put a profile with the FQBN, the core version (and index URL for non-Arduino cores), and every library version into `sketch/<Name>/sketch.yaml`, and set it as `default_profile`. Then `arduino-cli compile sketch/<Name>` builds with exactly those versions, downloaded into an isolated cache, whatever is installed globally. Set `default_port_config` for the monitor's baud rate.

## 3. Compile, upload, monitor

```sh
arduino-cli compile sketch/<Name>
arduino-cli upload sketch/<Name> -p {port}
arduino-cli monitor -p {port}
```

The sketch folder and its main `.ino` must have the same name. For older sketches that do not follow this, `scripts/compile.sh {folder-or-ino}` compiles a temporary copy under the right name with its companion files, without moving the originals.

## 4. Firmware conventions

The template's loop runs tasks by `millis()` interval (correct across the 49-day wraparound because of unsigned subtraction) and never blocks; constants are `constexpr`; strings printed often use `F()` on small boards; credentials are optional at compile time (`electronics:manage-device-credentials`).

## 5. When it fails

Read the error first, then check installed cores and libraries (`core list`, `lib list`) and the project's documented versions. Do not clear caches, reinstall tools, or stop other processes as a first step. "bad CPU type in executable" on Apple Silicon means an Intel-only toolchain binary: install Rosetta 2 or a core version with native binaries.

## 6. Report

State separately: compiled (which FQBN), ran locally, tested on hardware. Uploading changes a physical device; do it only when asked.
