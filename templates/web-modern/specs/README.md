# Screen specifications

The expected behavior of every screen. Manual QA, regression checks, and bug reports all refer to these spec IDs.

## How to read

1. Start with [common.md](common.md) (authentication, navigation, layout, shared states)
2. Read the spec of the screen under test
3. For flows that cross screens, use [cross-screen-scenarios.md](cross-screen-scenarios.md)
4. Report bugs with [bug-report.md](bug-report.md)

The specs follow the current implementation and the sitemap ({path to sitemap}). The API contract lives in {path to API reference}.

## Screens

| Spec ID | Path | Screen | Spec |
| --- | --- | --- | --- |
| SCR-COMMON | — | Shared behavior | [common.md](common.md) |
| SCR-{NAME} | `/{path}` | {screen} | [{name}.md]({name}.md) |

## Update rules

- When a screen is added, removed, or reached differently, update this table and the affected specs in the same change
- When display conditions, permissions, empty states, errors, or loading states change, update the matching spec IDs
- Never reuse an ID for a different meaning; retire it instead
- When the implementation and a spec disagree, find out which was intended, then fix the code or the spec
