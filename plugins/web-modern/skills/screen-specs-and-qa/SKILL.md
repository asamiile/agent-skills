---
name: screen-specs-and-qa
description: Writes and maintains screen specifications with stable spec IDs (display, actions, states, permissions per screen, plus cross-screen scenarios) and runs manual QA against them - preparing environments and accounts, checking API and UI states, reporting bugs with a template that cites spec IDs, and cleaning up test data. Use when the user says things like "write specs for each screen", "make a QA checklist", "test this feature before release", "document how this page should behave", "file a bug for this", or "the implementation and spec disagree".
---

# Screen specifications and manual QA

Starter files, in this repository: `templates/web-modern/specs/` (`README.md`, `screen.md`, `cross-screen-scenarios.md`, `bug-report.md`, `qa-guide.md`).

## 1. Write the specs

1. List every screen from the routes and the sitemap; give each a short ID (`SCR-{NAME}`) and one file
2. Put shared behavior (authentication, navigation, layout, toasts, error pages) in `common.md`. Screen specs link to it instead of repeating it
3. For each screen, fill the tables in `screen.md`: display, actions (with side effects such as saved data, emails, notifications, and cost), states (loading, empty, error, in progress), permissions by role, and responsive and accessibility notes. Number every row (`SCR-{NAME}-A01`)
4. Write the expected behavior as the code does it today. When the code looks wrong, write the intended behavior and flag the difference to the user rather than picking silently
5. Add flows that span screens to `cross-screen-scenarios.md`, each step citing the spec ID it relies on, with cleanup steps

Specs describe behavior, not implementation. Name the main file so a reader can find it, but do not copy code.

## 2. Keep them current

Whenever a change touches a screen's conditions, permissions, states, or navigation, update its spec IDs in the same change. Never reuse an ID for a new meaning.

## 3. Run QA

Follow `qa-guide.md`:

1. Record environment, commit, browser, width, roles, and test data
2. Check common behavior, then the changed screens ID by ID, then the affected cross-screen scenarios
3. Check both sides of each breakpoint, the console, and failed requests
4. For backend changes, check authorization per role, invalid input, external-service failures, and repeated requests against the API reference
5. Clean up through the UI or API only. Never edit the database directly, and never touch other people's data on shared environments

## 4. Report

- Bugs: `bug-report.md`, titled `[Spec ID] summary`, with steps, expected (citing the spec), actual, and evidence (console, network, frequency)
- Ideas that are not bugs go to a separate list, not into bug reports
- When an agent runs the QA, it reports findings as a list first and fixes only what the user picks
