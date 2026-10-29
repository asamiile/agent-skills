---
name: auto-fix-from-errors
description: Builds a pipeline that turns new production errors into draft fix pull requests - error tracker webhooks into a small dispatcher (signature check, deduplication, rate limit, first occurrence only) that starts a GitHub Actions workflow where a coding agent with restricted tools proposes a minimal fix, then a notification - designed so that untrusted error text cannot inject shell commands or instructions. Use when the user says things like "automatically fix production errors", "open a PR when Sentry reports an error", "connect error monitoring to Claude", or "auto-fix pipeline".
---

# Auto-fix pull requests from production errors

Starter file, in this repository: `templates/core/.github/workflows/auto-fix.yml`. Security reasoning: [references/security.md](references/security.md).

A person always reviews and merges. The pipeline only saves the time between "an error appeared" and "here is a candidate fix".

## 1. Architecture

```text
Error tracker (frontend) ─┐
Cloud error reporting ────┴→ Dispatcher endpoint ──workflow_dispatch──→ GitHub Actions ──→ draft PR
                              verify signature                          agent with Read/Edit only     └→ notification
                              dedupe, rate limit, record
```

## 2. Dispatcher

An internal endpoint per source (`POST /internal/webhooks/{source}`) in the existing backend:

1. Verify the request: HMAC signature of the raw body with a shared secret, compared in constant time; reject anything else with 401
2. Act only on the first occurrence of an error group (subscribe to "issue created", not every event)
3. Deduplicate: a table of jobs with a unique `error_id`; skip if present
4. Rate limit: count jobs in the last hour; skip above a small number (for example 3)
5. Pick the related file paths from the stack trace frames that belong to the repository
6. Start the workflow through the GitHub API (`POST /repos/{owner}/{repo}/actions/workflows/auto-fix.yml/dispatches`) with a fine-grained token that can only run workflows on this repository
7. Record the job (`triggered`), and update it from the workflow result if you want history

Store the webhook secrets and the token in the secret manager, never in code.

## 3. Workflow

Use the template. What matters:

- Inputs reach shell steps only as environment variables, are length-limited, and IDs are validated against a strict pattern
- The error text goes to a file that the prompt describes as data to analyze, not instructions
- The agent gets file tools only (`--allowedTools Read,Glob,Grep,Edit,Write`), a turn limit, and a job timeout. No shell, no network tools
- The workflow refuses changes under `.github/`, opens a **draft** pull request, and never merges
- Notifications are built with `jq`, so error text cannot break the JSON

## 4. Setup

1. Add `ANTHROPIC_API_KEY` (and optionally `NOTIFY_WEBHOOK_URL`) as repository secrets
2. In the error tracker, add a webhook for new issues pointing at the dispatcher; in the cloud error service, an alert on new error groups with a webhook channel
3. Test end to end with a deliberate error in a staging environment
4. Estimate the cost (tokens per run × expected runs) and record it with the other API costs (`web-modern:track-api-costs`)
