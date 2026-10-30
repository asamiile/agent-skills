---
name: document-operations
description: Documents how a project is operated after the code is written, split into what runs automatically (CI, release pull requests, version bumps, build numbers) and what a person must do (merging releases, store submissions, console-only setup, and renewals of tokens, certificates, and keys before they expire) - with the exact error each expired credential produces and a table of expiry dates. Use when the user says things like "document the release process", "what do I have to do by hand", "the release workflow fails with token not supplied", "how do I renew the certificate", or "write an operations runbook".
---

# Document operations

Starter files, in this repository: `templates/core/docs/operations/` (`README.md`, `automated.md`, `manual.md`).

## 1. Inventory

- Automated: every workflow file (trigger, what it does, output, the local command that reproduces it), and effects that follow automatically (a merged release pull request bumps the version, the app reads it, build numbers increment)
- Manual: everything a person decides or does in a console: merging releases, building and submitting to stores, console-only setup (store products, agreements, third-party dashboards), dependency upgrades that need judgment, and device QA
- Credentials: every token, certificate, and key the workflows and apps use, with where it is stored, what it can do, and when it expires

## 2. Write

- `automated.md`: one section per workflow, so a person can tell what will happen without reading YAML
- `manual.md`: numbered steps a person can follow months later, with how to confirm success. For each renewal, quote the error message the workflow prints when the credential is missing or expired, so a search for that error leads here
- `README.md`: the flow at a glance and the expiry table
- Never record secret values; name the secret and its store

## 3. Keep it true

Update these files in the same change as the workflow or setup they describe. When a manual step becomes automated, move it from `manual.md` to `automated.md`. Add a calendar reminder for each expiry date.
