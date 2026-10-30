# AGENTS.md

Rules for agents working in a repository of electronics projects (microcontroller firmware, single-board computers, and the cloud parts they talk to). Replace `{...}` and delete what does not apply.

## Layout

- `mcu/<chip-family>/<board>/<project>/`: firmware, diagrams, board-specific notes. Chip family first (avr, esp32, rp2040, samd51, nrf52, ...), board second, because pins, cores, FQBNs, and libraries differ per board
- `sbc/<board>/<project>/`: applications and system setup for single-board computers
- `cloud/<runtime>/<project>/`: functions and pipelines that receive device data
- `docs/`: shared guides (toolchain setup, credentials, cloud services), linked from project READMEs instead of repeated
- A project for several devices lives under the board that runs its main code and links the others

Each project has `README.md` (and translations), `sketch/<Name>/<Name>.ino` or the platform's equivalent, and optional `diagrams/` and `docs/`. A project with special constraints gets its own `AGENTS.md`; read it before changing that project.

## Firmware

- Never block the loop: time tasks with `millis()` intervals instead of `delay()`, and never wait on a sensor or the network without a timeout
- No dynamic allocation (`malloc`, `new`, growing `String`s) on small microcontrollers; use static or stack storage
- `constexpr` / `const` and `enum` instead of macros where the language allows
- Keep pin assignments and board initialization as documented in the project; never copy them from another board without checking its pinout
- External power for motors, servos, and LED strips, with a common ground; say so in code comments where it matters
- Comments explain intent, briefly

## Credentials

- Secrets in `credentials.h` (or `.env`, key files) listed individually in `.gitignore`; a committed `credentials.h.example` with placeholders
- Never print credentials in logs, serial output, or reports
- Pins, intervals, and thresholds go in `config.h`, not in the credentials file

## Verification

- Compile every firmware change for the project's exact board when the toolchain is available
- Report separately: compiled / ran locally / tested on hardware. Never report a check as passed that did not run
- Uploading firmware changes a physical device, and deploying changes a cloud service: do them only when they are part of the request
- When the toolchain fails, read the error and inspect the installed cores and libraries before changing the environment; do not clear caches or reinstall as a first step

## Documentation

- Keep translated READMEs in step (`core:sync-bilingual-docs`)
- When moving projects, update the root index, relative links, nested `AGENTS.md` files, and build paths, and record old → new paths in a table
