# Security policy

Template for a repository that holds a client's unreleased material. Keep it in the project (for example `.agents/SECURITY.md`) and link it from AGENTS.md.

## Basic policy

- This repository contains the client's unreleased material: {what, for example design data, specifications, preview images}
- Do not push to GitHub or any other remote. Do not configure a remote
- Do not publish or upload anything through Claude features: Artifacts, document connectors, design tools, deployments, uploads to external sites
- Do not use cloud execution (cloud reviews, scheduled runs, remote agents)
- Preview and check everything locally
  - The dev server listens on localhost only
  - Exposing it to the local network (for checks on real devices) makes everything it serves visible to that network. Do it only on a trusted network, never on shared Wi-Fi

## Enforced by settings

- `.claude/settings.json` is the source of truth for the exact values. Do not copy them here
- `permissions.deny`: push and data transfer commands, deployment commands, connectors that upload or publish ({list the connectors}), file uploads from the browser
- `sandbox`: writes only inside the project, network only to `allowedDomains` (currently {domains}), no commands outside the sandbox
- `.gitignore`: the source material folder ({folder}) and OS files
- Do not change `.claude/settings.json` without asking the user

## Outside the repository (account and user settings)

- {Model training opt-out setting}: off
- No feedback ratings in conversations about this project
- Connectors that are not needed: disconnected
- `~/.claude/settings.json`: no broad permissions (reading the whole home folder, push, cloud deploy commands)
- MCP servers that remain at user scope: disabled here with deny

## How to verify

Check after changing settings and when starting on another machine:

- A request to a domain that is not allowed (for example `example.com`) is refused
- A request to an allowed domain (for example the package registry) works
- Writing outside the project (for example the home folder) is refused
- `/mcp` shows no unexpected servers
- `.claude/settings.local.json` does not repeat or loosen these settings (local settings take precedence)

## Exceptions

- Adding a network destination: add only what is needed to `allowedDomains`, and write the purpose here
- Using a connector (for example to read a design file): lift the deny only for reading, only for the task, and put it back afterwards
- Sharing anything outside: only with the client's permission

## Contract

- Confirm that giving the material to AI tools is allowed by the contract (NDA, service agreement)
- When unsure, ask the client or the contractor

## After delivery

- Agree with the client on keeping or deleting the source material
- Decide the same for the local conversation logs (`~/.claude/projects/`)
