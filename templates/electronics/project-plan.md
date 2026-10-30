# {Project}: plan and constraints

For agents and people working on this project. Keep it current; it overrides general habits for this project.

## Purpose and policy

- Purpose: {what the system measures or does}
- Policy: {hard limits, for example "store only derived numeric data, never video or audio"}

## Scope

| Phase | Content | Status |
| --- | --- | --- |
| 1 | {first working slice} | in progress |
| 2 | {next} | not started |
| Out of scope for now | {parts on hand but deliberately deferred} | — |

Do not implement later phases or out-of-scope parts until the earlier phase is stable and the plan is updated.

## Hardware

| Component | Role | Connection |
| --- | --- | --- |
| {board} | {role} | {USB / Wi-Fi / I2C address} |

## Data flow

```text
{sensor} -> {microcontroller} -(UDP/serial/MQTT)-> {computer or broker} -> {API} -> {storage}
```

## Data specification

| Field | Type | Description |
| --- | --- | --- |
| `timestamp` | ISO 8601, milliseconds, UTC | {joins with other data sources on this} |
| {field} | | |

## Constraints

- Non-blocking loops on every device; timeouts on every wait
- Power: {external supply ratings, common ground}
- Integration: {IDs and timestamp precision shared with other projects}

## Steps

1. {Build and wire} — done when {observable result}
2. {Firmware} — done when {...}
3. {Receive and validate on the next device} — done when {...}
