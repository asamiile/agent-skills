---
name: migrate-local-storage
description: Changes the shape of data an app stores on the device (AsyncStorage, MMKV, SharedPreferences, UserDefaults wrappers) without losing it for users who update from any older version - namespaced keys, a stored schema version, ordered migrations that resume after a crash, tolerance for corrupt values, and tests for legacy, fresh, and interrupted cases. Use when the user says things like "rename this storage key", "turn the saved setting into a list", "users lost their settings after the update", or "migrate local data".
---

# Migrate data stored on the device

Starter file, in this repository: `templates/mobile-app/src/lib/migrations.ts`.

## Rules

- Prefix every key with the app's namespace (`{app}.`), so a new key never collides with an old one
- Never change what an existing key means. Write a new key and migrate
- Users skip versions. Migrations run in order from whatever version they have
- Run migrations once at startup, before any code reads stored data

## Write a migration

1. Add a step with the next version number to `MIGRATIONS`
2. Read the old value; if it is missing, do nothing (fresh installs and already-migrated users)
3. Treat unreadable values (bad JSON, wrong type) as empty instead of throwing; a crash at startup is worse than a lost setting
4. Write the new keys first and delete the old key last, so a crash in between repeats the step without losing data
5. `migrate()` stores the version after each step, so the next launch resumes at the step that failed

## Test

With an in-memory store, cover: a user with old data, a second launch (no change), a fresh install, corrupt old data, and a step that throws once (the next run resumes and finishes). Then install the previous release on a device, create data, update to the new build, and check the data.
