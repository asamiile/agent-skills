---
name: run-local-ai-stack
description: Runs local AI models next to an app with docker compose - a local LLM server (Ollama or similar) and an image pipeline (ComfyUI or similar) as non-root containers with model caches in volumes, CPU fallback where GPUs cannot be passed through (Docker Desktop on Apple Silicon), memory sizing, timeouts long enough for cold starts, and measured timings that decide which steps stay local. Use when the user says things like "run the model locally instead of paying for the API", "Ollama in Docker", "ComfyUI keeps crashing", "local generation is extremely slow", or "no GPU in Docker on my Mac".
---

# Run a local AI stack

Compose and wrapper templates: `templates/web-modern/docker/` (see `web-modern:harden-local-docker-app`). Measurement record: `templates/ai-integration/measured-performance.md`. ComfyUI specifics: `comfyui:drive-comfyui-from-code`.

## 1. Containers

- Wrap upstream images that run as root with a non-root user; create the model directories and give them to that user before `USER`, so named volumes mounted there are writable
- Model files (gigabytes) live in named volumes, never in the image or the repository. Document how to download each one into the volume and which exact file the defaults were tuned for
- Bind ports to 127.0.0.1; shift the host port when the same tool is often installed natively (the app reaches the container by service name anyway)

## 2. Hardware

- Docker Desktop on Apple Silicon cannot pass the GPU into containers. Image pipelines must be told to use the CPU explicitly; some crash at startup looking for a CUDA driver instead of falling back
- On Linux with NVIDIA, use the GPU reservation block in compose and drop any CPU-only flag
- Give Docker enough memory: large checkpoints can be killed while loading under the default allocation. Raise it in Docker Desktop settings and record the value

## 3. Timeouts

Local models are slow to start (first request loads the model) and slow per item on CPU. Make every timeout configurable and long enough: the HTTP client to the model server, the job's polling limit, and every proxy in front of the API (each layer longer than the one behind it).

## 4. Measure, then decide

Run each stage at the sizes you intend to use and record time and memory in `measured-performance.md`. Cost grows faster than pixel count for diffusion models (doubling each side took about nine times as long in one CPU measurement), so extrapolate before promising high resolutions. Use the numbers to decide per step whether local is acceptable, and let users pick another provider for the steps where it is not.

## 5. Text models

A local text model is usually fast enough on CPU for prompt expansion. Use the non-streaming API for short completions, pin the model tag, and pull it into the volume once (`ollama pull {model}` inside the container).
