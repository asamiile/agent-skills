---
name: deploy-to-cloud-run
description: Deploys a web backend and frontend to Google Cloud Run from GitHub Actions - Workload Identity Federation instead of service account keys, images in Artifact Registry tagged by commit, database migrations as a Cloud Run job run before the new revision, runtime secrets from Secret Manager, public frontend values passed at build time, a canonical-domain redirect, and a smoke test - plus CI that builds the same Dockerfile. Use when the user says things like "deploy to Cloud Run", "set up GitHub Actions for GCP", "stop using the service account key", "run migrations on deploy", "the frontend still calls the old API URL", or "set up the production environment on Google Cloud".
---

# Deploy to Cloud Run from GitHub Actions

Starter file, in this repository: `templates/cloud-run/.github/workflows/deploy.yml`. One-time Google Cloud setup: [references/gcp-setup.md](references/gcp-setup.md). Pitfalls: [references/pitfalls.md](references/pitfalls.md).

Creating cloud resources costs money and changes a shared account. Show the user the commands and get approval before running them.

## 1. One-time setup

Follow the setup reference: enable the APIs, create the Artifact Registry repository, a deployer service account and a runtime service account with the smallest roles, the secrets in Secret Manager, and a Workload Identity pool and provider limited to this repository. Put the non-secret identifiers in GitHub repository variables. No JSON key leaves Google Cloud.

## 2. The workflow

1. **Authenticate** with `google-github-actions/auth` using the workload identity provider and the deployer service account (`permissions: id-token: write`)
2. **Build and push** each image tagged with the commit SHA. Do not deploy `latest`: a SHA tag says exactly what runs and makes rollback a redeploy of an older tag
3. **Migrate** with a Cloud Run job that uses the new backend image and the runtime service account, executed with `--wait` before the service is updated. If it fails, the deploy stops and the old revision keeps serving. Migrations must work with the old code too (see `web-modern:change-database-schema`)
4. **Deploy the backend**, with configuration as env vars and credentials as Secret Manager references (`secrets:`), never as plain values
5. **Deploy the frontend**, with public values (`NEXT_PUBLIC_*`, `VITE_*`) passed as Docker build arguments: they are compiled into the bundle, so setting them at runtime does nothing
6. **Smoke test** the deployed URL, then run the full check (`web-modern:verify-production-release`)

Use `concurrency` so two deploys never overlap, and a protected `production` environment if deploys need approval.

## 3. CI before deploy

Build the same Dockerfiles in pull request CI. A missing dependency or broken build argument then fails the pull request instead of the deploy.

## 4. Domain

Map the custom domain (Cloud Run domain mapping or a load balancer), then redirect the default `*.run.app` URL of the public frontend to the canonical domain (an app-level redirect when the host header is not the canonical one), so search engines index one address.

## 5. Rollback

Redeploy the previous image tag, or shift traffic to the previous revision (`gcloud run services update-traffic {service} --to-revisions={revision}=100`). Database changes do not roll back with it, which is why migrations are kept backward compatible.
