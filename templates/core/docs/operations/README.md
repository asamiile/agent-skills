# Operations

What keeps the project running after the code is written: what CI does on its own, and what a person has to do.

- [automated.md](automated.md): what happens without anyone starting it, and what triggers it
- [manual.md](manual.md): what a person must do, with step-by-step instructions, including renewals of anything that expires

## Flow

```text
{feature branch} → {dev} → {main} ─┬→ CI (automated)
                                  └→ release pull request (automated) → merge (manual) → tag, release (automated) → build and submit (manual)
```

## Expiring credentials

| Credential | Used by | Expires | Renewal |
| --- | --- | --- | --- |
| {release token} | {release workflow} | {date} | [manual.md](manual.md#{anchor}) |
| {signing certificate} | {signing workflow} | {date} | [manual.md](manual.md#{anchor}) |
| {store API key} | {notarization / purchases} | {date or "until revoked"} | [manual.md](manual.md#{anchor}) |
