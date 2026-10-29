---
name: two-step-generation
description: Designs generation features as cheap candidates first, then an expensive final step only for the one the user picks - several low-cost previews, per-item status so one failure is retried alone, the final step run per chosen item with its own provider, state that survives reloads and long waits, and spend capped by rate limits. Use when the user says things like "generate four options and let me pick", "high-resolution only for the chosen image", "retry just the failed one", "generation takes minutes and the page times out", or "generating is too expensive".
---

# Two-step generation: candidates, then a final

Provider structure: `ai-integration:pluggable-ai-providers`. Long requests through a web frontend: `nextjs:proxy-long-backend-requests`.

## 1. Flow

1. The user writes a short prompt; the server expands it once (`ai-integration:safe-prompt-expansion`) and stores both versions
2. The server creates N low-cost candidates (low resolution, fast model) concurrently
3. The user picks one; only that item gets the expensive final step (high resolution, refinement from the candidate)
4. Never offer only a single expensive step: most of the cost would go to results nobody wanted

## 2. Data model

- A session row: original prompt, expanded prompt, provider used for candidates, created time (indexed for history)
- One row per candidate: index, output path, status enum (`success` / `failed`), error message, the provider that produced the current output, and the final step's own fields (path, status, error, provider, resolution, time). Keeping final-step state per candidate lets several candidates be finalized independently

## 3. Failures

- A failed candidate stores `failed` with the error and is shown as such; the others stay usable
- Retry regenerates that one candidate (optionally with another provider) and resets its final-step fields, since they belonged to the old output
- Do not make "regenerate everything" the only recovery

## 4. Waiting

Final steps can take minutes (local models: much longer). Keep the request open long enough through every hop (browser, frontend server, API, model), or switch to a job: return an ID immediately, store progress, and let the page poll. Either way, a reload or returning to the page shows the item as still running rather than failed while within the time limit.

## 5. Spend

Rate-limit candidate, retry, and final endpoints with one configurable limit, write the cost per full cycle in the docs, and show the user which provider each output came from.
