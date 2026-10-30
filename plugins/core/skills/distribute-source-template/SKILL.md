---
name: distribute-source-template
description: Packages a repository as a source template for customers or the public - a curated zip built with git archive and export-ignore rules that leave out agent files, operator workflows, internal docs, and secrets, attached to each GitHub release automatically and checked for files that must never ship - plus the separate customer documents (quick start and troubleshooting, in each language). Use when the user says things like "sell this as a template", "make a zip for customers", "exclude internal files from the download", "package the release for Gumroad", or "what should the buyer get".
---

# Distribute the repository as a source template

Starter files, in this repository: `templates/core/.gitattributes.distribution` and `templates/core/.github/workflows/package-release.yml`.

## 1. Decide what the customer gets

List what ships and what stays: application code and the configuration needed to run it ship; agent instructions, operator workflows (deploy, release, auto-fix), internal docs and plans, store-page assets, and anything with real identifiers stay. Confirm the list with the user.

## 2. Mark exclusions with export-ignore

`git archive` honors `export-ignore` in `.gitattributes`. How directory patterns match has differed between Git versions, so list both `dir` and `dir/**`, and never trust the rules without reading the listing:

```sh
git archive --format=zip -o /tmp/check.zip HEAD && unzip -l /tmp/check.zip
```

`git archive` takes committed files from one tree only: untracked files and the history stay out. Never distribute the repository itself, because its history keeps every secret that was ever committed.

## 3. Customer documents

Write separate entry points for customers (`docs/QUICKSTART.{lang}.md`, `docs/TROUBLESHOOTING.{lang}.md`) instead of shipping the developer README:

- Prerequisites with versions, setup from zero, environment variables (from `.env.example`), first run, deploy options
- Troubleshooting organized by symptom: what you see, why, what to do
- No references to internal tools, private services, or the seller's infrastructure

## 4. Automate

Add `package-release.yml`. On each published release it builds the zip from the tag, fails if a forbidden path is inside, and attaches it to the release. Uploading to the store stays a manual step.

## 5. Before the first release

- [ ] The zip listing matches the decision in step 1
- [ ] Setup from the zip works on a clean machine, following only the quick start
- [ ] License file for customers is included and correct
- [ ] No real domains, account IDs, or keys remain in shipped files (`.env.example` holds placeholders only)
