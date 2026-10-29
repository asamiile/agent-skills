---
name: harden-local-docker-app
description: Sets up and reviews a docker compose stack for an app that runs only on the developer's machine - ports bound to 127.0.0.1, every container as a non-root user (including wrappers around upstream images that default to root), named volumes for data, read-only mounts for inspection tools, secrets in ignored env files, health checks, host ports that avoid clashing with native installs, a shared token between the frontend's server and the API, and rate limits on endpoints that cost money. Use when the user says things like "run this locally with Docker", "make the compose file safer", "the container runs as root", "anyone on my Wi-Fi can open the app", or "add a database viewer".
---

# Harden a local docker compose app

Starter files, in this repository: `templates/web-modern/docker/docker-compose.yml` and `Dockerfile.nonroot-wrapper`. API side: `fastapi:protect-fastapi-endpoints`; frontend proxy: `nextjs:proxy-long-backend-requests`.

## Rules

1. **Loopback ports**: publish as `127.0.0.1:{host}:{container}`. A bare `{host}:{container}` listens on every interface, so anyone on the same network can reach it
2. **Non-root everywhere**: your own images create and switch to a user. For upstream images that run as root, add a small wrapper Dockerfile (template). Remove an existing uid-1000 user first when the base has one; create and `chown` every writable directory before `USER`
3. **Named volumes** for databases, uploads, generated files, and model caches, so data survives `docker compose down` and rebuilds. Bind-mount source code only for development
4. **Inspection tools read-only**: mount data volumes with `:ro` and use the tool's own read-only mode
5. **Secrets** in `.env` files listed in `.gitignore`, with a committed `.env.example` that has empty values and comments
6. **One shared token** between the frontend's server side and the API: the browser calls the frontend's own routes, which add the token. The token never reaches client code or `NEXT_PUBLIC_*` variables
7. **Rate limits** on every endpoint that spends money or heavy compute, with the limit in an environment variable
8. **Health checks**, and `depends_on: condition: service_healthy` for services that need the API ready
9. **Host port clashes**: when a tool is often installed natively too (local model servers, databases), shift the host port and keep the container port; services talk over the compose network by service name anyway

## Review an existing stack

Go through the rules above for each service, then check: images pinned to a tag or digest, no `privileged`, no Docker socket mounted, no secrets in `environment:` lines of the committed compose file, and `.dockerignore` excluding `.env`, `node_modules`, and data folders.

## GPUs

Docker Desktop on Apple Silicon cannot pass the GPU to containers; GPU-bound work runs on the CPU there (see `ai-integration:run-local-ai-stack`). On Linux with NVIDIA, add the `deploy.resources` block and the NVIDIA container toolkit; keep it commented in the shared file and document it.
