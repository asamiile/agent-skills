# One-time Google Cloud setup

Replace `{...}`. Check each command against the current gcloud documentation before running it.

```sh
PROJECT={project-id}; REGION={region}; REPO={registry-repo}; GH_REPO={owner}/{repo}
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')

gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com \
  iamcredentials.googleapis.com --project "$PROJECT"

gcloud artifacts repositories create "$REPO" --repository-format=docker --location="$REGION" --project "$PROJECT"

# Two service accounts: one deploys, one is what the services run as
gcloud iam service-accounts create deployer --project "$PROJECT"
gcloud iam service-accounts create app-runtime --project "$PROJECT"
DEPLOYER=deployer@$PROJECT.iam.gserviceaccount.com
RUNTIME=app-runtime@$PROJECT.iam.gserviceaccount.com

for role in roles/run.admin roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$DEPLOYER" --role="$role"
done
# The deployer may deploy services that run as the runtime account, and nothing else
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME" --member="serviceAccount:$DEPLOYER" --role=roles/iam.serviceAccountUser

# Secrets: the runtime account reads only the ones it needs
printf '%s' "{value}" | gcloud secrets create database-url --data-file=- --project "$PROJECT"
gcloud secrets add-iam-policy-binding database-url --member="serviceAccount:$RUNTIME" --role=roles/secretmanager.secretAccessor --project "$PROJECT"

# Workload Identity Federation for GitHub Actions, limited to this repository
gcloud iam workload-identity-pools create github --location=global --project "$PROJECT"
gcloud iam workload-identity-pools providers create-oidc github-actions --location=global --workload-identity-pool=github \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping=google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref \
  --attribute-condition="assertion.repository=='$GH_REPO'" --project "$PROJECT"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$GH_REPO"
```

Then set the GitHub repository variables listed at the top of the workflow. The provider's full name is
`projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github-actions`.

To allow deploys only from `main`, tighten the attribute condition with `&& assertion.ref=='refs/heads/main'`.

Set a budget alert on the billing account at the same time.
