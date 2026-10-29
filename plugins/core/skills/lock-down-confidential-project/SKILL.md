---
name: lock-down-confidential-project
description: Locks down a repository that holds a client's unreleased or confidential material before any work starts - Claude Code deny rules for push, data transfer, deploys, and uploading connectors, a sandbox with a network allowlist, a SECURITY.md with checks and exceptions, naming rules that keep the client's name out of code, and what to do after delivery. Use when the user says things like "this is under NDA", "the client's files must not leak", "set this project up securely", "make sure nothing gets uploaded", or "lock down Claude for this repo".
---

# Lock down a confidential project

Do this before reading or adding any client material. Settings enforce what can be enforced; the rest goes into a policy file the agent reads at the start of every session.

Starter files, in this repository: `templates/core/.claude/settings.json` and `templates/core/SECURITY.md`.

## 1. Confirm the facts with the user

- What the material is, and where it will live in the repository (for example a `docs/` folder that is never served or committed)
- Whether the contract allows giving the material to AI tools. If unknown, the user asks the client first
- Which network destinations the work needs (package registry, CDNs used at runtime need no allowlist for the agent)
- Which connectors and MCP servers are configured for the user, so you know what to deny

## 2. Project settings

Copy `templates/core/.claude/settings.json` to the project and adjust:

- `permissions.deny`: push and remote changes, GitHub CLI, transfer commands (`curl`, `wget`, `scp`, `rsync`), deploy CLIs, Artifacts, and every configured connector that can upload, publish, or send (documents, design tools, mail, cloud storage, hosting, databases). Add browser upload tools
- `sandbox.enabled: true` with `allowUnsandboxedCommands: false`, so commands cannot escape the sandbox
- `sandbox.network.allowedDomains`: only what installs and builds need (for example the package registry)
- Keep `.claude/settings.local.json` free of overrides; local settings take precedence

Check the current settings documentation for exact rule syntax before writing them. Tool and connector names change.

## 3. Work around sandbox limits

- Package manager stores outside the project are not writable. Put the store inside the project (for pnpm: `store-dir=.pnpm-store` in `.npmrc`) and ignore it in git
- A sandbox usually cannot bind local ports or start a browser. Document that the user runs the dev server, browser tests, and capture scripts in their own terminal

## 4. Policy file

Fill in `templates/core/SECURITY.md` and link it from the project's AGENTS.md as required reading. Then add a short summary to AGENTS.md:

- No remote, no push, no uploads, no cloud execution; check everything locally
- Local network exposure only on a trusted network
- Never put the client's name (in any script) in code, file names, comments, package names, or class prefixes. Choose a neutral prefix
- Do not change `.claude/settings.json`; propose changes to the user instead

## 5. Settings outside the repository

Tell the user what only they can do: turn off model training on their account, avoid sending feedback ratings on these conversations, disconnect connectors that are not needed, and remove broad permissions from their user-level settings.

## 6. Verify

Run each check in the "How to verify" section of SECURITY.md and report the results: a blocked domain is refused, the registry works, writing outside the project is refused, `/mcp` shows nothing unexpected.

## 7. After delivery

Remind the user to agree with the client on keeping or deleting the material, and to decide the same for local conversation logs.
