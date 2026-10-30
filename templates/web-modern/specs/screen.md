# SCR-{NAME}: {screen name}

Path: `/{path}` · Who: {roles that can open it} · Implementation: `{main file}`

## Purpose

{One or two sentences: what the user comes here to do.}

## Display

| ID | Element | Condition | Expected |
| --- | --- | --- | --- |
| SCR-{NAME}-D01 | {element} | {when} | {what is shown} |

## Actions

| ID | Action | Expected result | Side effects |
| --- | --- | --- | --- |
| SCR-{NAME}-A01 | {click / submit / ...} | {what happens} | {saved data, emails, notifications, cost} |

## States

| ID | State | Expected |
| --- | --- | --- |
| SCR-{NAME}-S01 | Loading | {skeleton / spinner; actions disabled} |
| SCR-{NAME}-S02 | Empty | {message and next step} |
| SCR-{NAME}-S03 | Error | {message; how to retry} |
| SCR-{NAME}-S04 | In progress | {double submission prevented; state restored after reload} |

## Permissions

| Role | Can see | Can do |
| --- | --- | --- |
| Signed out | | |
| {role} | | |

## Responsive and accessibility

- Breakpoint behavior: {what changes around {breakpoint}}
- Keyboard and focus: {tab order, focus after actions}
- Labels: {aria labels, live regions}
