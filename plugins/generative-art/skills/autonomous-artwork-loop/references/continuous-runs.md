# Continuous runs

## Stop conditions

Stop instead of starting the next iteration when:

- Unrelated pending changes are present in the working tree
- A unique work name cannot be chosen with confidence
- The first preview cannot be generated
- The sketch still fails after one repair attempt
- Commit or push fails after one repair attempt
- The user interrupts

## Lightweight mode

For slow or rate-limited model routes (for example a proxy to another provider), run the same loop with less overhead:

- No separate planner, artist, and critic agents; write a short inline brief (name, theme, technique, palette, how it differs from recent works) and an inline critique in the same format
- At most one revision per work
- Scan `WORKS.md` and `FEEDBACK.md` enough to avoid obvious repetition instead of reading every past work in detail
- Prefer stills over video unless motion is essential
- Keep progress reports short to reduce calls

## Rate limits

- Wait a minute or more between committed works
- On a provider error, wait a few minutes and retry once. If it fails again, stop and report the last completed commit and the current `git status`

## State between works

Carry nothing between iterations except what is in the repository. Each iteration re-reads `WORKS.md` and `FEEDBACK.md`, so a run can be stopped and restarted at any time.

## Long renders

- Print progress (frame N of total) at a regular interval so a slow render is not mistaken for a hang
- Delete intermediate frame folders after encoding; they can take gigabytes per work
- Move finished videos off the local disk after the commit. A large collection of videos fills the disk quickly
