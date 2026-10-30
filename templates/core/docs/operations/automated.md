# Automated

Nobody needs to start these. If one fails, the fix is usually in [manual.md](manual.md).

## {Name, e.g. CI}

- Workflow: `{.github/workflows/file.yml}`
- Trigger: {push to main, pull requests, paths}
- Does: {checks it runs}
- Output: {status check, artifact, pull request}
- Run the same locally: `{commands}`

## {Name, e.g. Release pull request}

- Trigger: {push to main}
- Does: {opens or updates the release pull request from Conventional Commits}
- After a person merges it: {version bump, changelog, tag, release; where the version appears}
