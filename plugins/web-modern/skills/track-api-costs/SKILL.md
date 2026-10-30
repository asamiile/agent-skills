---
name: track-api-costs
description: Keeps the cost of paid APIs and infrastructure (LLM and embedding calls, databases, queues, email) visible in a web app - a cost map from each user action or job to the paid calls it makes, a checklist for changes that touch them (call counts, duplicate processing in retries, incremental updates, caching, raised limits), and guards such as budget alerts and rate limits. Use when the user says things like "how much will this cost", "the API bill went up", "add an LLM feature", "is this calling the API too often", or "document our costs".
---

# Track API and infrastructure costs

Starter file, in this repository: `templates/web-modern/COST.md`.

## 1. Build the cost map

1. List every billable service from dependencies, environment variables, and infrastructure config
2. For each one, find every place in the code that calls it, and trace each call back to the user action or scheduled job that triggers it
3. Fill the tables in `COST.md`: trigger, call, calls per trigger, and whether the result is cached (and where)

## 2. Review every change that touches a paid call

Go through the checklist in `COST.md` and state the result in the pull request:

- Calls per action before and after
- Retries and scheduled jobs cannot reprocess the same input (a status column, a unique key, or an idempotency key)
- Incremental work instead of full re-processing
- Reusable results cached
- Raised limits (result counts, chunk sizes, model tier) estimated first
- A new external API documented with its timeout, rate limit, failure behavior, and recovery

## 3. Guards

- A budget alert on each billing account, with the threshold written in `COST.md`
- Rate limits on public endpoints that trigger paid calls (per IP or per user), returning 429
- Expensive actions behind authentication where possible
- In tests and local development, a fake or a free tier instead of the production key

## 4. Record actual costs

After each billing period, add the real figures next to the estimates. Large differences point to a missing row in the cost map.
