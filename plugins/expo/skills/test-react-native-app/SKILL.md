---
name: test-react-native-app
description: Sets up testing for a React Native / Expo app - which screens need manual testing on real devices (latency, sensors, real networks) and which get component tests with React Native Testing Library and Jest, mocking hooks and storage, the async API of Testing Library v13+, ESM-only packages in Jest, pure logic moved into plain modules for fast unit tests, a test that keeps translation files in sync, and a QA table that marks each row as automated or manual. Use when the user says things like "write tests for this screen", "set up Jest for Expo", "the test can't find the element", "jest fails on an ESM package", or "make a QA checklist for the app".
---

# Test a React Native app

Starter files, in this repository: `templates/expo/jest.setup.js`, `jest.config.snippet.json`, `src/i18n/catalogs.test.ts`, `src/screens/SettingsScreen.test.tsx`, and `templates/mobile-app/qa-checklist.md`.

## 1. Decide per screen

- **Manual on devices**: anything whose point is timing, feel, sensors, or a real network (playback controls, recording, latency to a server)
- **Component tests**: screens whose logic does not depend on those (settings, onboarding, license, help): what is shown, what a tap calls, text per language
- **Unit tests**: pure functions (address math, dictionary lookup, data migrations)

Write the decision into the project's AGENTS.md so it stays consistent.

## 2. Jest setup

- Preset `jest-expo`; a `jest.setup.js` that mocks storage with the library's official mock
- Packages that ship only ES modules can fail under Jest. Map them to their CommonJS build with `moduleNameMapper`, or add them to `transformIgnorePatterns`
- Keep `jest-expo`, `jest`, and the Testing Library on versions that match the SDK

## 3. Component tests

- Mock the hooks that talk to the outside (connection, purchases), so no socket or store is involved
- Testing Library v13 and later: `render` and `fireEvent` are async. Always `await` them; otherwise queries run against an unfinished tree and fail with "unable to find element"
- Clear the storage mock in `beforeEach`; stored values persist between tests
- Query by role and label, as a user would find the element

## 4. Pure logic first

Move logic out of components and context providers into plain modules (no React Native or storage imports) before testing it. The tests then run in milliseconds without mocks.

## 5. Translations

A test compares every locale file's keys with the reference locale (`catalogs.test.ts`). A missing key otherwise shows a raw key in the UI only in that language.

## 6. QA table

One table per screen (`qa-checklist.md`) with a Type column: Automated rows name their test; Manual rows say why they need a device. Fill the result column for manual rows at each release. When a manual row gets a test, change its type.
