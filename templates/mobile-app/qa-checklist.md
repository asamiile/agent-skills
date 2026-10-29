# QA: {screen or feature}

Spec: {link}. Run before every release. Automated rows are covered by `{test file}` and checked by CI; fill Result only for manual rows.

Environment: {devices and OS versions} · {server/companion versions} · {network} · dark and bright surroundings if the app is used on stage or outdoors

| No. | Screen | Item | Expected | Type | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | {screen} | {item} | {expected behavior} | Manual | | {why manual: real device, latency, real network} |
| 2 | {screen} | {item} | {expected behavior} | Automated | | `{test name}` |

- Rows that could be automated but are not yet: mark them in Notes, and switch the type when a test exists
- Bugs: file them with the row number; ideas go elsewhere
