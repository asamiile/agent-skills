# API and infrastructure costs

Where money is spent, and what to check before changing anything that calls a paid service. Actual monthly figures: {path to the billing record}.

## Billable services

| Service | Used for | Billed by |
| --- | --- | --- |
| {LLM API, model} | {summaries, translation} | input and output tokens |
| {embedding API} | {indexing, search queries} | input tokens |
| {database} | {data, vectors} | compute, storage |
| {queue / scheduler} | {background jobs} | executions |
| {email / SMS} | {notifications} | messages |

## Where each cost is incurred

| Trigger (user action or job) | Call | Calls per trigger | Cached? |
| --- | --- | --- | --- |
| {POST /api/...} | {model call} | {1 per request / 1 per uncached chunk} | {yes: where / no} |

## Before changing anything here

1. Estimate the calls per user action and per job run, before and after the change
2. Make sure retries and scheduled jobs cannot process the same input twice (idempotency keys, a status column, unique constraints)
3. Prefer incremental updates (changed items only) over full re-processing
4. Cache results that can be reused, and say where the cache lives
5. When raising limits (result counts, chunk sizes, batch sizes, model tier), estimate the cost and database load first
6. For a new external API, document its timeout, rate limit, failure behavior, and how to recover

## Guards

- Budget alerts: {where they are configured, thresholds}
- Rate limits on public endpoints that trigger paid calls: {limits}
