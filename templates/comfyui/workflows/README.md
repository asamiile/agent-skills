# Workflows

Save workflows from the ComfyUI editor with **Save (API)**, not the normal save: the API format maps node IDs to
`class_type` and `inputs`, which is what `POST /prompt` accepts.

- Give every node the code changes a clear title in the editor (`Positive prompt`, `Negative prompt`, `Seed`,
  `Size`, `Load reference`); `set_inputs` finds nodes by title, which stays stable across re-exports
- Keep sampler settings that depend on the checkpoint (steps, CFG, sampler, scheduler) configurable through
  environment variables, and note in the workflow's commit which checkpoint they were tuned for
- Use `SaveImage` for results; `PreviewImage` writes temporary files that the client ignores
