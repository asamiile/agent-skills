---
name: expo-release-pipeline
description: Sets up versioning and builds for an Expo app - one version number in package.json that release-please bumps and app.config.js reads (so the store, the build, and the in-app version agree), build numbers managed remotely by EAS with auto-increment, development/preview/production build profiles with matching EAS environments, secrets and public keys handled per environment, and the manual steps that stay manual (when to build, submitting). Use when the user says things like "set up EAS builds", "the version shown in the app is wrong", "bump the build number automatically", "release the app", or "where do I put the API keys for production builds".
---

# Expo release pipeline

Starter files, in this repository: `templates/expo/app.config.js`, `eas.json`, `release-please-config.json`, `.release-please-manifest.json`, `.env.example`. Branch flow and release-please basics: `core:set-up-release-flow`.

## 1. One version number

- `package.json` `version` is the only place the marketing version lives
- `app.config.js` (JavaScript, not `app.json`) reads it: `version: pkg.version`. The settings or about screen reads it through `expo-constants`
- release-please (release type `node`, package path = the app folder) bumps `package.json`, updates the changelog, and tags `vX.Y.Z` when its pull request is merged. If the repository also contains a server or companion app released together, let them share this one version

## 2. Build numbers

In `eas.json`, `cli.appVersionSource: "remote"` makes EAS keep the iOS build number and Android version code, and `autoIncrement: true` on the production profile raises them on every build. Do not also set them in the app config. Run `eas build:version:get` / `:set` to inspect or seed them once.

## 3. Profiles and environments

| Profile | Use | Distribution | EAS environment |
| --- | --- | --- | --- |
| `development` | Development client with native modules | internal | development |
| `preview` | Testers, release candidates | internal | preview |
| `production` | Store | store | production |

- `EXPO_PUBLIC_*` values are compiled into the app and readable by anyone: only public keys (crash-report DSN, public purchase SDK key)
- Build-time secrets (source-map upload token) are EAS secrets, never `EXPO_PUBLIC_`
- Set an environment name per profile (for example for crash reporting) so production and test reports are separated
- Locally, `.env.local` (gitignored) from `.env.example`

## 4. Crash reporting

Wrap the config with the reporter's Expo plugin and let organization and project come from environment variables at build time, so nothing account-specific is committed. Check once that a deliberate error from a release-like build arrives with readable stack traces.

## 5. What stays manual

Deciding when to build (`eas build --platform ios --profile production`), submitting (`eas submit`), store review, and merging the release pull request. Document them with the automated parts in the operations docs (`core:document-operations`).
