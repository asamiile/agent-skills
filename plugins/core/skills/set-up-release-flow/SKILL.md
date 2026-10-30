---
name: set-up-release-flow
description: Sets up a branch and release flow on GitHub - work on dev, one automatically maintained dev-to-main pull request listing unreleased commits, Conventional Commits, release-please on main for versions, changelog, tags, and releases, Dependabot with grouped updates, and lockfile repair for Dependabot pull requests - and explains the token pitfalls that stop CI from running. Use when the user says things like "set up releases", "automate the changelog", "keep a PR from dev to main", "group dependabot PRs", "the release PR didn't run CI", or "what commit prefix should I use".
---

# Set up the branch and release flow

Starter files, in this repository: `templates/core/.github/workflows/dev-to-main-pr.yml`, `release.yml`, `update-lockfile.yml`, `templates/core/.github/dependabot.yml`, `release-please-config.json`, `.release-please-manifest.json`.

## 1. The flow

```text
feature branches → dev ──(auto-maintained PR)──→ main ──(release-please PR)──→ tag + GitHub Release
```

- Work is merged into `dev`. Each push to `dev` creates or refreshes one pull request into `main` whose body lists the commits `main` lacks
- Merging into `main` makes release-please open or update a release pull request (version bump and changelog)
- Merging the release pull request into `main` creates the tag and the release. Merging it anywhere else does nothing

## 2. Conventional Commits

| Prefix | Use | Version |
| --- | --- | --- |
| `feat:` | New feature | minor |
| `fix:` | Bug fix | patch |
| `feat!:` / `BREAKING CHANGE:` footer | Breaking change | major |
| `chore:`, `docs:`, `refactor:`, `test:`, `ci:` | Everything else | none |

Put this table in the project's AGENTS.md so agents use it for every commit.

## 3. Install

1. Copy the workflows and configs. In `release-please-config.json`, set `release-type` (`simple`, `node`, `python`, ...) and the packages; set the starting version in `.release-please-manifest.json`
2. Create a fine-grained token that can write contents and pull requests on this repository, store it as `RELEASE_TOKEN`
3. Protect `main` (pull requests and passing CI required) and enable "Allow GitHub Actions to create pull requests" in the repository's Actions settings
4. Adjust `dependabot.yml` directories and groups

## 4. Token pitfalls

- Pull requests and pushes made with the built-in `GITHUB_TOKEN` do not trigger other workflows. A release pull request opened that way never runs CI, and branch protection then blocks it. Use `RELEASE_TOKEN` for release-please
- The lockfile fix for Dependabot pushes with `GITHUB_TOKEN`, so CI does not run again on that commit; re-run CI or use a separate token
- `pull_request` workflows from forks get a read-only token and no secrets. Do not switch to `pull_request_target` to get around it unless the job never checks out or runs the fork's code

## 5. Dependabot

- Group minor and patch updates into one pull request per ecosystem; keep majors separate so they get real review
- Update GitHub Actions monthly
- Before adding any new dependency yourself: check the name (typosquatting), maintenance, and publisher, then run the ecosystem's audit (`pnpm audit`, `pip-audit`)
