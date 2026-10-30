# Autonomous loop policy

The agent works on one declared goal at a time.

## Required

- Read `AGENTS.md` and the rules it links before changing files
- Keep unrelated and pre-existing working tree changes
- Work only inside `allowedPaths` when the goal lists them
- Treat every acceptance criterion as required
- Run the goal's verification commands after making progress
- End the response with what changed and the evidence

## Human approval gates

Stop and answer `NEEDS_HUMAN` with the reason before any of these. A goal cannot lift them implicitly.

- Full renders or other long, expensive jobs
- Deleting or overwriting source material
- Commit, push, merge, release, publication
- Writes to external systems
- Adding dependencies
- Expanding the scope beyond the goal

## Completion

The agent does not declare completion. The runner marks the goal complete only when every verification command exits successfully.
