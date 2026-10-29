# Cloud Run pitfalls

## Service account keys

A JSON key in a GitHub secret never expires and works from anywhere. Workload Identity Federation gives each workflow run a short-lived token that only this repository can obtain. Delete old keys after switching.

## Build-time public values

Frontend frameworks inline public variables at build time. Changing the API URL in the Cloud Run service's env vars does nothing until the image is rebuilt with the new build argument. Server-only values are read at runtime and can change without a rebuild.

## Env var values with commas

`gcloud run deploy --set-env-vars` splits on commas. For values that contain commas (lists of hosts or origins), change the delimiter: `--set-env-vars="^;^A=x,y;B=z"`. The deploy action's `env_vars:` takes one variable per line and avoids the problem.

## Migrations at startup

Running migrations when the container starts runs them on every instance and every cold start, concurrently. A separate job that runs once per deploy avoids races and stops the deploy when it fails.

## Unauthenticated access

`--allow-unauthenticated` makes the service public. Use it for public sites and APIs; keep internal services private and call them with an identity token. Internal endpoints inside a public service (webhooks, schedulers) need their own authentication.

## Cold starts and cost

Minimum instances at 0 cost nothing when idle but add a cold start to the first request. Set `--min-instances=1` only for services where that latency matters, and note the cost.

## Region

Put the database, the services, and the registry in the same region. Cross-region traffic adds latency and egress cost.
