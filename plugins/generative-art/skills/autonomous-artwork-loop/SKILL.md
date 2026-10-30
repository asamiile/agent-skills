---
name: autonomous-artwork-loop
description: Runs an autonomous generative-art production loop - a planner writes a creative brief from the catalog of past works and the user's ratings, an artist implements it, a critic scores the preview on four axes and asks for revisions, then the work is documented, committed, and its outputs archived. Works with any creative-coding tool (py5/Processing, p5.js, TouchDesigner, shaders). Use when the user says things like "make a new artwork", "generate artworks continuously", "create one new sketch end to end", "keep producing pieces until I stop you", or "set up an agent workflow for generative art".
---

# Autonomous artwork loop

One iteration produces one complete, original work: concept, code, preview, critique, documentation, commit. The loop can run once or continuously.

Starter files, in this repository: `templates/generative-art/` (`AGENTS.md`, `WORKS.md`, `FEEDBACK.md`, `work-README.md`). Tool-specific code skeletons live in the tool's plugin (for py5: `py5:py5-sketch-setup`).

## 1. Set up the repository once

- `WORKS.md`: the catalog of every work (date, format, concept, techniques, palette). Agents append to it
- `FEEDBACK.md`: one entry per work with `Rating` (OK / NG / blank) and `Comment`. **Only the user writes these two fields.** Agents only add the empty entry for a new work
- `sketch/{work_name}/`: one folder per work with the code, `README.md`, and previews. Frames and videos are outputs, not committed
- A branch per session (for example `feature/works-YYYYMMDD`). Never commit to `main` directly
- Results must vary between runs: no fixed random seeds (pass a fresh seed into shaders as a uniform)

## 2. One iteration

1. **Check the tree**: `git status --short`. Stop if unrelated changes would end up in the commit
2. **Plan**: write a creative brief. See [references/creative-brief.md](references/creative-brief.md)
3. **Implement**: create `sketch/{work_name}/` from the tool's template. The sketch saves its own preview and exits on its own; a run that never exits is a failure
4. **Preview**: run it with a timeout. Fail fast on a blank frame (see the tool's template)
5. **Critique**: score the preview and the code. Revise at most twice. See [references/critique.md](references/critique.md)
6. **Document**: write the work's `README.md`, append to `WORKS.md`, add an empty entry to `FEEDBACK.md`
7. **Commit and push**: stage only `sketch/{work_name}/`, `WORKS.md`, and `FEEDBACK.md`
8. **Archive outputs**: move large videos to cloud storage after the commit (see `motion-graphics:offload-renders`)
9. **Report**: work name, verdict and score, changed files, commit hash

## 3. Naming

- `snake_case` names that describe the concept, not the algorithm alone
- No `_v1` on first versions. A deliberate remake or refinement gets a new folder `{name}_v2`, `{name}_v3`. Never overwrite a past work
- Previews: `{work_name}_p1.png`, extra variants `_p2`, `_p3`; revision snapshots `{work_name}_p1_v1.png`. The first preview must exist before review and commit

## 4. Roles

Run the roles as separate agents when the budget allows, or inline in one agent on slow or rate-limited routes:

| Role | Reads | Writes |
| --- | --- | --- |
| Planner | `WORKS.md`, `FEEDBACK.md`, optional algorithm references | The creative brief only, no code |
| Artist | The brief, the tool's template, at most a few referenced algorithm files | `sketch/{work_name}/` |
| Critic | `WORKS.md`, the code, every preview image | Scores, strengths, concrete improvements, verdict |

Treat algorithm references (libraries, example collections, MCP servers) as technical reference: rework them into an original piece, never copy them wholesale, and continue without them if they are unavailable.

## 5. Continuous runs

When the user asks for continuous production, start the next iteration right after a successful commit, re-reading `WORKS.md` and `FEEDBACK.md` each time so concepts don't repeat. See [references/continuous-runs.md](references/continuous-runs.md) for stop conditions, a lightweight mode, and rate limits.

## 6. Safety and color

- Moving works must stay within flashing limits: no strong brightness changes more than three times per second over a large part of the frame. See `motion-graphics:verify-render-outputs` for the full guideline and a check
- Palettes follow [references/palette.md](references/palette.md)
