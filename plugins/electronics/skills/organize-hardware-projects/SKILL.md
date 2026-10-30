---
name: organize-hardware-projects
description: Organizes a repository of electronics projects (Arduino and other microcontrollers, Raspberry Pi and other single-board computers, and their cloud parts) - a layout by chip family, board, and project, a README per project with bill of materials, one-line wiring, numbered setup steps, and tests, a plan document for multi-phase builds, shared guides instead of repeated setup, and safe reorganization with an old-to-new path table. Use when the user says things like "organize my Arduino projects", "add a new project to the repo", "write a README for this circuit", "where should this sketch go", or "restructure the folders".
---

# Organize hardware projects

Starter files, in this repository: `templates/electronics/AGENTS.md`, `project-readme.md`, `project-plan.md`, `gitignore.snippet`.

## 1. Layout

```text
mcu/<chip-family>/<board>/<project>/   firmware, diagrams, board notes
sbc/<board>/<project>/                 single-board computer apps and setup
cloud/<runtime>/<project>/             functions receiving device data
docs/                                  shared setup guides
```

- Group microcontroller projects by chip family first, then board: pins, cores, board IDs, and libraries differ per board even within one family
- Keep microcontrollers and single-board computers apart: their toolchains and deployment differ
- A project with several devices goes under the board running its main code and links the others
- Put the main sketch in `sketch/<Name>/<Name>.ino` (folder and file names must match for Arduino tools)

## 2. Add a project

1. Choose the place by the rules above; create a family or board folder only for a genuinely new one
2. Write the README from `project-readme.md`: overview, bill of materials grouped by role, wiring as one line per connection (`board port -> component pin`), software setup as numbered steps in execution order with details as indented bullets under each step, cloud steps with exact names, and tests including failure cases
3. Link shared guides (toolchain, credentials, cloud service setup) instead of repeating them
4. List required libraries; leave out statements about what is not needed
5. Add the project to the root index
6. For a multi-phase build, add `docs/plan.md` (or a project `AGENTS.md`) from `project-plan.md`: scope per phase, what is deliberately deferred, hardware table, data flow, data specification, constraints

## 3. Edit an existing README

Keep the user's own edits outside the requested change. Do not bring back sections that were removed on purpose. After editing: relative links, anchors, balanced code fences, and translations (`core:sync-bilingual-docs`).

## 4. Reorganize

Move with `git mv` so history follows. Keep sketch, diagram, and project names. Then update the root index, every relative link, nested `AGENTS.md` files, build paths, and editor settings, and add an old → new path table to the docs for anyone with bookmarks or scripts.
