---
name: pluggable-ai-providers
description: Structures an app that calls AI models (LLMs, image or video generation, local or cloud) so providers can be added and switched per request or per step - one module per provider with the same functions, a registry checked at import, delegation when a provider lacks a capability, retries for transient errors only, model IDs verified against current docs, and a record of providers evaluated and rejected. Use when the user says things like "add another image model", "let the user choose between OpenAI and Gemini", "support a local model too", "the provider is down, fall back", or "which AI API should we use".
---

# Pluggable AI providers

Starter files, in this repository: `templates/ai-integration/providers/` (`__init__.py` registry, `http_retry.py`, `prompts.py`, two example providers) and `templates/ai-integration/tests/test_providers.py`. Evaluation record: [references/evaluating-providers.md](references/evaluating-providers.md).

## 1. The contract

List the steps the app needs (for image generation, for example: expand the prompt, create one preview, create a batch, create the final output) and make every provider module define exactly those async functions with the same signatures. The registry checks the contract at import, so a missing function fails at startup, not mid-request.

- Return `None` (or a typed failure) for a failed generation instead of raising, so one bad item does not fail a batch
- Store results the same way for every provider (one storage helper)
- Call through the registry (`get_provider(name).fn(...)`), never by importing functions directly, so tests can replace the module's functions

## 2. Capabilities that differ

When a provider lacks a step (an image API with no text model), its function delegates to another provider chosen by configuration, with a sensible free or local default. Expose which providers are configured (keys present, local service reachable) through an endpoint, so the UI offers only those.

## 3. Choose per step

Record on each stored item which provider produced it. Let expensive steps choose their provider separately from cheap ones: a slow local model can make previews while a fast cloud model makes the final output, or the reverse.

## 4. Errors and retries

Retry only transient failures: 5xx, 429 (respecting `Retry-After`), and dropped connections, with a few short delays (`http_retry.py`). Return other 4xx at once; a bad key, a refused prompt, or exhausted quota will not succeed on retry. SDKs that raise their own error types need the same rule applied to those types.

## 5. Model IDs and parameters

Model names, sizes, and parameters change often. Keep them in environment variables with defaults, and check the provider's current documentation right before implementing or upgrading. Write that rule into the project's AGENTS.md.

## 6. Cost

Write the approximate cost of one full cycle per provider in the docs (`web-modern:track-api-costs`), and rate-limit the endpoints that trigger paid calls.
