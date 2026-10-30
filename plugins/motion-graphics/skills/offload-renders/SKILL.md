---
name: offload-renders
description: Keeps rendered videos off the local disk by moving them to cloud storage (Google Drive or any rclone remote, or an external disk) after they are verified and committed, copying stills, preserving the folder layout, and letting render scripts skip outputs that already exist remotely. Use when the user says things like "my disk is full of renders", "upload the videos to Google Drive", "move outputs to the NAS", "don't re-render what's already uploaded", or "get that video back from Drive".
---

# Offload renders

Starter script, in this repository: `templates/motion-graphics/scripts/offload.mjs` (Node built-in modules plus rclone and ffprobe).

## 1. Set it up once

1. Install rclone and create a remote (`rclone config`, for example a Google Drive remote). A plain local folder such as an external disk also works without configuration
2. Put the settings in `.env` (gitignored) and document them in `.env.example`. Never hardcode the destination in code or docs:

```text
OFFLOAD_REMOTE=gdrive:Media/{project}
OFFLOAD_ROOT=out
# OFFLOAD=0                 turn it off
# OFFLOAD_TRANSFERS=8       parallel transfers
# OFFLOAD_CHUNK_SIZE=64M    Drive upload chunk; memory ≈ transfers × chunk
```

3. When offloading is not configured, the script says so and exits 1. Treat that as "videos stay local", not as a failed render

## 2. When to offload

Only after the outputs are verified (see `motion-graphics:verify-render-outputs`) and, in repositories that commit previews, after the commit. Checks and reviews need the local files.

```sh
node scripts/offload.mjs out/Text/{id}     # one output folder
node scripts/offload.mjs --all             # everything under OFFLOAD_ROOT
```

- Stills are copied (the repository can keep them); videos are moved
- A video that ffprobe cannot read (truncated or still being written) stays local
- rclone deletes the local copy only after a verified upload, so an interrupted run loses nothing. Re-running skips unchanged files
- The remote mirrors `OFFLOAD_ROOT`, one folder per output, so files are easy to find in the cloud
- Nothing on the remote is ever deleted by the script

## 3. Skip what already exists

Batch render scripts should count an output as done when it exists locally or remotely. Fetch the remote listing once per run (`node scripts/offload.mjs --list-remote`, paths relative to the root) and look outputs up in it; a folder counts as existing when anything is inside it (image sequences). Large recursive listings exceed default process buffers, so give the call a generous buffer.

Have the render script record which files it produced in this run and offload exactly those when it exits (a shell `trap ... EXIT`), including after a failure halfway.

## 4. Get a file back

```sh
node scripts/offload.mjs --fetch out/Text/{id}
```

Use it before re-encoding (see `motion-graphics:export-for-mobile`) or checking an old output. Offload again when done.
