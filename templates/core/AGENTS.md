# AGENTS.md

Guide for AI agents working in this repository. This file is the agent-neutral source of truth for every coding agent (Claude Code, Codex, GitHub Copilot, Cursor, and others). Product-specific files only point here or add narrow integration notes; do not repeat repository rules in them.

- Read these first:
  - [.agents/rules/repository.md](.agents/rules/repository.md): structure, file layout, core conventions
  - [.agents/rules/{topic}.md](.agents/rules/{topic}.md): {what it covers}
  - [.agents/design/README.md](.agents/design/README.md): how things should look (if the project has visual specs)
  - [.loop/POLICY.md](.loop/POLICY.md): autonomous-loop boundaries and human approval gates (if the project uses the loop)

## Language

- Repository content (code, comments, docs, rules, commit messages): {language}
- Replies in chat may follow the user's language

## Overview

{One paragraph: what the project is, who it is for, what it is not.}

## Commands

See [README.md](README.md) for setup, preview, build, and release commands.

## Rules that apply everywhere

- {rule}
- Ask before adding dependencies, committing, pushing, or running long or expensive jobs
- Treat personal, uncommitted settings files (`*.local.*`, `.env`) as read-only unless the user names the file and the change
- Edit README.md only when asked; it is written for people, not for agents
- Do not modify skills imported from elsewhere (listed in `skills-lock.json`); propose changes to the user instead
- After finishing a task, check {roadmap file}: tick the matching item and move it to the done section. Unlisted work (refactors, small fixes) needs no entry

## Directory boundaries

- `{frontend}/`: {framework} only. Never changes the database schema
- `{backend}/`: API, database, background jobs. Never changes page structure
- API client code: `{frontend}/lib/api/`, one file per group of endpoints

## Dependencies

- Before adding a package: check the exact name (typosquatting), maintenance activity, and publisher, then ask the user
- Run the ecosystem's audit after changes (`pnpm audit`, `pip-audit`), and pin versions where the ecosystem does not lock them
