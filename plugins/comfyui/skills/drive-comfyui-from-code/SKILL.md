---
name: drive-comfyui-from-code
description: Calls ComfyUI from application code - workflows exported in API format and versioned in the repository, inputs set by node title, queueing with POST /prompt, polling /history with a timeout and error reporting, fetching only real outputs, tunable sampler settings per checkpoint, and memory-safe choices (tiled VAE, no oversized upscalers) for large images on limited hardware. Use when the user says things like "call ComfyUI from my backend", "run this ComfyUI workflow via API", "ComfyUI crashes on large images", "the workflow JSON doesn't work with the API", or "make the upscale step not run out of memory".
---

# Drive ComfyUI from code

Starter files, in this repository: `templates/comfyui/comfyui_client.py`, `templates/comfyui/workflows/README.md`, `templates/comfyui/tests/test_comfyui_client.py` (runs against a fake server). Memory and speed: [references/memory-and-speed.md](references/memory-and-speed.md).

## 1. Workflows as files

Build the workflow in the editor, give every node the code will change a clear title, then export with **Save (API)**. The normal save format is for the editor and `POST /prompt` rejects it; `load_workflow` checks the format. Commit the JSON files and review changes to them like code.

## 2. Run

```python
workflow = set_inputs(load_workflow(Path("workflows/txt2img.json")), {
    "Positive prompt": {"text": prompt},
    "Negative prompt": {"text": NEGATIVE_PROMPT},
    "Seed": {"seed": random.randint(0, 2**32 - 1)},
})
images = await ComfyClient(COMFYUI_URL, timeout_s=LOCAL_TIMEOUT).run(workflow)
```

- `set_inputs` copies the workflow and finds nodes by title, which survive re-exports; numeric node IDs do not
- `run` queues, polls `/history/{id}` until outputs appear or the timeout passes, raises with ComfyUI's own message on a rejected or failed workflow, and downloads only `output` images (not previews or temp files)
- Randomize the seed per request unless reproducibility is wanted; store it with the result

## 3. Settings per checkpoint

Steps, CFG, sampler, and scheduler depend on the checkpoint (few-step distilled models need very different values from standard ones). Read them from environment variables with defaults for the checkpoint you document, and note that pairing next to the workflow.

## 4. Batches and finals

Generate a batch of candidates in one queued workflow (batch size in the latent node), and build the final output as image-to-image from the chosen candidate with partial denoise, which keeps the composition and adds detail. For a different aspect ratio, resize with a center crop rather than stretching.

## 5. Test

Unit-test the client against a fake server with the same endpoints (template). Run each workflow once against a real instance after every change to it, and record time and memory (`ai-integration:run-local-ai-stack`).
