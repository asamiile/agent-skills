---
name: watch-platform-updates
description: Sets up a scheduled agent run that checks each week whether new releases of the platforms a project depends on (iOS, Android, a host application, an SDK or framework) affect it - reading only official release notes, comparing them with the project's documented minimum versions and APIs, logging "no impact" without noise, and opening a reviewed pull request only when a change is needed. Use when the user says things like "keep up with iOS updates automatically", "watch for new versions of the host app", "weekly check for breaking changes", or "set up a routine that opens a PR when something changes".
---

# Watch platform updates with a scheduled agent

Starter prompt, in this repository: `templates/core/routines/platform-update-watch.md`.

## 1. Prepare what the agent compares against

The run is only as good as the project's own record of what it depends on. Make sure one document lists, per platform: the minimum supported version, the settings that depend on it (permissions, network security, build properties), and the APIs used (for a host application, a table of the calls and listeners). Keep a small log file where each run appends its date and result.

## 2. Write the prompt

Fill in the template: platforms, where the facts live, the test commands, and the rules (official sources only, quote the note behind each decision, no pull request when nothing changes, never merge, no unrelated upgrades, no CI or secret changes).

## 3. Schedule it

Use the scheduling feature of the agent platform (for Claude Code, a scheduled cloud routine; see the `schedule` skill or the routines page), weekly at a time someone can review. Give it access to the repository only, and remove connectors it does not need. Turning on automatic fixing of its own pull requests' CI failures is reasonable because a person still reviews before merging.

## 4. Review

Read each pull request against the quoted release notes. When a run was wrong (missed an impact, or opened a pull request for nothing), improve the facts document or the prompt, not just the one result.

## 5. Cost

Estimate tokens per run; most weeks should end at step 3 of the prompt with one log line.
