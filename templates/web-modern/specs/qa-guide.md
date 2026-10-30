# QA guide

Entry point for manual QA. Expected behavior is not repeated here; check against the spec IDs.

## Before you start

1. Record the branch and commit, environment, browser, and viewport width
2. Decide which roles and settings to test with (signed out, each role, feature flags)
3. Record the test data you rely on
4. On shared or production environments, use a dedicated QA account and never touch other people's data

## Order

1. [Common behavior](common.md): authentication, navigation
2. The specs of the screens that changed, ID by ID
3. The [cross-screen scenarios](cross-screen-scenarios.md) that involve those screens
4. Main actions on desktop and mobile widths, including both sides of each breakpoint
5. Browser console and failed network requests
6. Record bugs and improvement ideas separately

## API checks (when the backend changed)

- Authentication and authorization: signed out, each role
- Success: status, response shape, what was saved
- Invalid input: empty, wrong format, limits, unexpected paths
- External services: failure and timeout of each one
- Repeats: double submission, the same input twice, cached results

## UI checks

- Loading, empty, success, error, and in-progress states
- Actions disabled while processing; no double submission
- Keyboard use, focus, labels, `aria-*` states
- Long titles, long text, long email addresses do not break the layout
- Jobs and progress survive a reload or leaving the page

## Recording

- Bugs: [bug-report.md](bug-report.md), with the spec ID
- Ideas that are not bugs: {path to improvement list}. Move them to the roadmap when scheduled; delete them when done or dropped

## Afterwards

- Remove what the QA run created, through the UI or the official API. Never edit the database directly
